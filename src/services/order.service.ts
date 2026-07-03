import { Prisma, OrderStatus, PaymentMethod } from '@prisma/client';
import { db } from '@/config/database';
import { AppError } from '@/utils/AppError';
import { parsePagination, buildPaginatedResponse } from '@/utils/pagination';
import { generateOrderNumber } from '@/utils/orderNumber';
import { notificationService } from '@/services/notification.service';
import { emailService } from '@/services/email.service';
import { productService } from '@/services/product.service';
import { CreateOrderInput, UpdateOrderStatusInput, CancelOrderInput } from '@/validators/order.validator';

const CANCELLABLE_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED'];

class OrderService {
  async createOrder(userId: string, data: CreateOrderInput) {
    const address = await db.userAddress.findFirst({
      where: { id: data.addressId, userId },
    });
    if (!address) throw new AppError('Address not found', 404, 'NOT_FOUND');

    const cart = await db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                discountedPrice: true,
                requiresPrescription: true,
                isActive: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError('Cart is empty', 400, 'CART_EMPTY');
    }

    const rxItems = cart.items.filter((i) => i.product.requiresPrescription);
    if (rxItems.length > 0 && !data.prescriptionId) {
      throw new AppError(
        'A valid prescription is required for prescription items',
        400,
        'PRESCRIPTION_REQUIRED',
      );
    }

    if (data.prescriptionId) {
      const prescription = await db.prescription.findFirst({
        where: { id: data.prescriptionId, userId, status: 'APPROVED' },
      });
      if (!prescription) {
        throw new AppError('Valid approved prescription not found', 400, 'PRESCRIPTION_INVALID');
      }
    }

    let discountAmount = 0;
    let couponId: string | undefined;

    if (data.couponCode) {
      const coupon = await db.coupon.findFirst({
        where: {
          code: data.couponCode.toUpperCase(),
          isActive: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
        },
      });

      if (!coupon) throw new AppError('Invalid or expired coupon', 400, 'COUPON_INVALID');

      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        throw new AppError('Coupon usage limit reached', 400, 'COUPON_EXHAUSTED');
      }

      couponId = coupon.id;
    }

    const orderNumber = generateOrderNumber();

    const order = await db.$transaction(async (tx) => {
      const orderItems: Prisma.OrderItemCreateManyOrderInput[] = [];
      let subtotal = 0;

      for (const item of cart.items) {
        if (!item.product.isActive || item.product.deletedAt) {
          throw new AppError(`Product "${item.product.name}" is no longer available`, 400, 'PRODUCT_UNAVAILABLE');
        }

        const unitPrice = parseFloat(
          (item.product.discountedPrice ?? item.product.price).toString(),
        );
        const itemSubtotal = unitPrice * item.quantity;
        subtotal += itemSubtotal;

        const batches = await tx.inventoryBatch.findMany({
          where: {
            productId: item.product.id,
            isActive: true,
            expiryDate: { gt: new Date() },
          },
          orderBy: { expiryDate: 'asc' },
        });

        let remaining = item.quantity;
        let allocatedBatch: string | undefined;

        for (const batch of batches) {
          const available = batch.quantity - batch.reservedQty;
          if (available <= 0) continue;

          const allocate = Math.min(available, remaining);
          await tx.inventoryBatch.update({
            where: { id: batch.id },
            data: { reservedQty: { increment: allocate } },
          });
          allocatedBatch = batch.batchNumber;
          remaining -= allocate;
          if (remaining === 0) break;
        }

        if (remaining > 0) {
          throw new AppError(
            `Insufficient stock for "${item.product.name}"`,
            400,
            'INSUFFICIENT_STOCK',
          );
        }

        orderItems.push({
          productId: item.product.id,
          productName: item.product.name,
          productSku: item.product.sku,
          unitPrice,
          quantity: item.quantity,
          subtotal: itemSubtotal,
          batchNumber: allocatedBatch,
        });
      }

      if (couponId) {
        const coupon = await tx.coupon.findUnique({ where: { id: couponId } });
        if (coupon) {
          if (coupon.type === 'PERCENTAGE') {
            discountAmount = (subtotal * parseFloat(coupon.value.toString())) / 100;
            if (coupon.maxDiscount) {
              discountAmount = Math.min(discountAmount, parseFloat(coupon.maxDiscount.toString()));
            }
          } else {
            discountAmount = parseFloat(coupon.value.toString());
          }
          await tx.coupon.update({
            where: { id: couponId },
            data: { usageCount: { increment: 1 } },
          });
        }
      }

      const shippingFee = subtotal >= 1500 ? 0 : 150;
      const total = Math.max(0, subtotal - discountAmount + shippingFee);

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: data.addressId,
          couponId,
          prescriptionId: data.prescriptionId,
          paymentMethod: data.paymentMethod as PaymentMethod,
          subtotal,
          discountAmount,
          shippingFee,
          total,
          notes: data.notes,
          status: data.prescriptionId ? 'PRESCRIPTION_PENDING' : 'PENDING',
          items: { createMany: { data: orderItems } },
          statusHistory: {
            create: {
              status: data.prescriptionId ? 'PRESCRIPTION_PENDING' : 'PENDING',
              note: 'Order placed',
              changedBy: userId,
            },
          },
        },
        include: {
          items: true,
          address: true,
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    for (const item of order.items) {
      await productService.recalculateStock(item.productId);
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (user) {
      await emailService.sendOrderConfirmation(
        user.email,
        order.orderNumber,
        order.total.toString(),
      );
    }

    await notificationService.create(
      userId,
      'ORDER_PLACED',
      'Order Placed',
      `Your order ${order.orderNumber} has been placed successfully.`,
      { orderId: order.id },
    );

    return order;
  }

  async getUserOrders(userId: string, query: { page?: number; limit?: number; status?: OrderStatus }) {
    const pagination = parsePagination(query.page, query.limit);

    const where: Prisma.OrderWhereInput = {
      userId,
      ...(query.status && { status: query.status }),
    };

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          items: { take: 3, include: { product: { select: { images: { where: { isPrimary: true }, take: 1 } } } } },
          address: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      db.order.count({ where }),
    ]);

    return buildPaginatedResponse(orders, total, pagination);
  }

  async getOrderById(id: string, userId: string) {
    const order = await db.order.findFirst({
      where: { id, userId },
      include: {
        items: { include: { product: { select: { slug: true, images: { where: { isPrimary: true }, take: 1 } } } } },
        address: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payment: true,
      },
    });
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
    return order;
  }

  async cancelOrder(id: string, userId: string, data: CancelOrderInput) {
    const order = await db.order.findFirst({ where: { id, userId } });
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');

    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      throw new AppError(
        `Cannot cancel order with status: ${order.status}`,
        400,
        'CANNOT_CANCEL',
      );
    }

    const updated = await db.$transaction(async (tx) => {
      const cancelled = await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: data.reason,
        },
      });

      await tx.orderStatusHistory.create({
        data: { orderId: id, status: 'CANCELLED', note: data.reason, changedBy: userId },
      });

      const orderItems = await tx.orderItem.findMany({ where: { orderId: id } });
      for (const item of orderItems) {
        const batches = await tx.inventoryBatch.findMany({
          where: { productId: item.productId, batchNumber: item.batchNumber ?? undefined },
        });
        for (const batch of batches) {
          await tx.inventoryBatch.update({
            where: { id: batch.id },
            data: { reservedQty: { decrement: Math.min(batch.reservedQty, item.quantity) } },
          });
        }
      }

      return cancelled;
    });

    for (const item of await db.orderItem.findMany({ where: { orderId: id } })) {
      await productService.recalculateStock(item.productId);
    }

    return updated;
  }

  async getAllOrders(query: { page?: number; limit?: number; status?: OrderStatus; userId?: string }) {
    const pagination = parsePagination(query.page, query.limit);

    const where: Prisma.OrderWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.userId && { userId: query.userId }),
    };

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          address: true,
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      db.order.count({ where }),
    ]);

    return buildPaginatedResponse(orders, total, pagination);
  }

  async updateOrderStatus(
    id: string,
    data: UpdateOrderStatusInput,
    adminId: string,
  ) {
    const order = await db.order.findUnique({ where: { id } });
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');

    const updates: Prisma.OrderUpdateInput = { status: data.status };

    if (data.status === 'DELIVERED') updates.deliveredAt = new Date();

    if (data.status === 'DELIVERED' || data.status === 'SHIPPED') {
      await db.$transaction(async (tx) => {
        const orderItems = await tx.orderItem.findMany({ where: { orderId: id } });
        for (const item of orderItems) {
          const batches = await tx.inventoryBatch.findMany({
            where: { productId: item.productId, batchNumber: item.batchNumber ?? undefined },
          });
          for (const batch of batches) {
            const decrement = Math.min(item.quantity, batch.quantity, batch.reservedQty);
            await tx.inventoryBatch.update({
              where: { id: batch.id },
              data: {
                quantity: { decrement },
                reservedQty: { decrement },
              },
            });
          }
        }
      });

      const orderItems = await db.orderItem.findMany({ where: { orderId: id } });
      for (const item of orderItems) {
        await productService.recalculateStock(item.productId);
      }
    }

    const updated = await db.order.update({
      where: { id },
      data: updates,
    });

    await db.orderStatusHistory.create({
      data: { orderId: id, status: data.status, note: data.note, changedBy: adminId },
    });

    const notifMap: Partial<Record<OrderStatus, string>> = {
      CONFIRMED: 'Your order has been confirmed.',
      SHIPPED: 'Your order has been shipped.',
      OUT_FOR_DELIVERY: 'Your order is out for delivery.',
      DELIVERED: 'Your order has been delivered.',
    };

    const notifBody = notifMap[data.status];
    if (notifBody) {
      await notificationService.create(
        order.userId,
        data.status === 'SHIPPED' ? 'ORDER_SHIPPED' : data.status === 'DELIVERED' ? 'ORDER_DELIVERED' : 'ORDER_CONFIRMED',
        'Order Update',
        `Order ${order.orderNumber}: ${notifBody}`,
        { orderId: id },
      );
    }

    return updated;
  }
}

export const orderService = new OrderService();
