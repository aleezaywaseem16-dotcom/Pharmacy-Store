import { db } from '@/config/database';
import { AppError } from '@/utils/AppError';

class CartService {
  private async ensureCart(userId: string) {
    return db.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                discountedPrice: true,
                requiresPrescription: true,
                totalStock: true,
                isActive: true,
                deletedAt: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
    });
  }

  async getCart(userId: string) {
    const cart = await this.ensureCart(userId);
    return this.formatCart(cart);
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number,
    prescriptionId?: string,
  ) {
    const product = await db.product.findFirst({
      where: { id: productId, isActive: true, deletedAt: null },
    });
    if (!product) throw new AppError('Product not found or unavailable', 404, 'NOT_FOUND');
    if (product.totalStock < quantity) {
      throw new AppError(`Only ${product.totalStock} units available`, 400, 'INSUFFICIENT_STOCK');
    }

    const cart = await db.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    await db.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity, prescriptionId },
      update: { quantity },
    });

    return this.getCart(userId);
  }

  async updateItem(userId: string, productId: string, quantity: number) {
    const product = await db.product.findFirst({
      where: { id: productId, isActive: true, deletedAt: null },
    });
    if (!product) throw new AppError('Product not found', 404, 'NOT_FOUND');
    if (product.totalStock < quantity) {
      throw new AppError(`Only ${product.totalStock} units available`, 400, 'INSUFFICIENT_STOCK');
    }

    const cart = await db.cart.findUnique({ where: { userId } });
    if (!cart) throw new AppError('Cart not found', 404, 'NOT_FOUND');

    const item = await db.cartItem.findFirst({ where: { cartId: cart.id, productId } });
    if (!item) throw new AppError('Cart item not found', 404, 'NOT_FOUND');

    await db.cartItem.update({ where: { id: item.id }, data: { quantity } });
    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string) {
    const cart = await db.cart.findUnique({ where: { userId } });
    if (!cart) throw new AppError('Cart not found', 404, 'NOT_FOUND');
    await db.cartItem.delete({ where: { cartId_productId: { cartId: cart.id, productId } } });
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await db.cart.findUnique({ where: { userId } });
    if (cart) {
      await db.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  }

  private formatCart(cart: Awaited<ReturnType<typeof this.ensureCart>>) {
    const items = cart.items
      .filter((i) => i.product.isActive && !i.product.deletedAt)
      .map((item) => ({
        id: item.id,
        quantity: item.quantity,
        prescriptionId: item.prescriptionId,
        product: item.product,
      }));

    const subtotal = items.reduce((sum, item) => {
      const price = item.product.discountedPrice ?? item.product.price;
      return sum + parseFloat(price.toString()) * item.quantity;
    }, 0);

    return { id: cart.id, items, itemCount: items.length, subtotal };
  }
}

export const cartService = new CartService();
