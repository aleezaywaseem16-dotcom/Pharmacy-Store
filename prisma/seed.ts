import { PrismaClient, UserRole, CouponType, PaymentMethod, OrderStatus, PaymentStatus, PrescriptionStatus, NotificationType, MessageStatus, StockAdjustmentType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function future(days: number) {
  return new Date(Date.now() + days * 86_400_000);
}

function past(days: number) {
  return new Date(Date.now() - days * 86_400_000);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding pharmacy database…\n');

  // ── ROLES ──────────────────────────────────────────────────────────────────

  const roleData: { name: UserRole; displayName: string; description: string; permissions: object }[] = [
    { name: UserRole.CUSTOMER,    displayName: 'Customer',     description: 'Regular customer who can browse and purchase', permissions: { browse: true, purchase: true, review: true } },
    { name: UserRole.PHARMACIST,  displayName: 'Pharmacist',   description: 'Licensed pharmacist for prescription review',  permissions: { browse: true, purchase: true, review: true, prescriptionReview: true, inventory: true } },
    { name: UserRole.ADMIN,       displayName: 'Admin',        description: 'Store administrator',                         permissions: { all: true, userManage: true, productManage: true, orderManage: true } },
    { name: UserRole.SUPER_ADMIN, displayName: 'Super Admin',  description: 'Full system access',                         permissions: { superAdmin: true } },
  ];

  for (const r of roleData) {
    await db.role.upsert({ where: { name: r.name }, update: {}, create: r });
  }
  console.log('✔ Roles seeded');

  // ── USERS ──────────────────────────────────────────────────────────────────

  const [superAdminPwd, adminPwd, pharmPwd, custPwd1, custPwd2] = await Promise.all([
    bcrypt.hash('Admin@1234',   12),
    bcrypt.hash('Admin@5678',   12),
    bcrypt.hash('Pharma@1234',  12),
    bcrypt.hash('Customer@123', 12),
    bcrypt.hash('Customer@456', 12),
  ]);

  const superAdmin = await db.user.upsert({
    where: { email: 'admin@pharmacy.com' },
    update: {},
    create: {
      email: 'admin@pharmacy.com', passwordHash: superAdminPwd,
      firstName: 'Super', lastName: 'Admin',
      phone: '+923001234567', role: UserRole.SUPER_ADMIN,
      isVerified: true, emailVerifiedAt: new Date(), isActive: true,
    },
  });

  const admin = await db.user.upsert({
    where: { email: 'store.admin@pharmacy.com' },
    update: {},
    create: {
      email: 'store.admin@pharmacy.com', passwordHash: adminPwd,
      firstName: 'Zain', lastName: 'Malik',
      phone: '+923009876543', role: UserRole.ADMIN,
      isVerified: true, emailVerifiedAt: new Date(), isActive: true,
    },
  });

  const pharmacist = await db.user.upsert({
    where: { email: 'pharmacist@pharmacy.com' },
    update: {},
    create: {
      email: 'pharmacist@pharmacy.com', passwordHash: pharmPwd,
      firstName: 'Dr. Sana', lastName: 'Riaz',
      phone: '+923331234567', role: UserRole.PHARMACIST,
      isVerified: true, emailVerifiedAt: new Date(), isActive: true,
    },
  });

  const customer1 = await db.user.upsert({
    where: { email: 'sara.khan@email.com' },
    update: {},
    create: {
      email: 'sara.khan@email.com', passwordHash: custPwd1,
      firstName: 'Sara', lastName: 'Khan',
      phone: '+923211234567', role: UserRole.CUSTOMER,
      isVerified: true, emailVerifiedAt: new Date(), isActive: true,
    },
  });

  const customer2 = await db.user.upsert({
    where: { email: 'ali.ahmed@email.com' },
    update: {},
    create: {
      email: 'ali.ahmed@email.com', passwordHash: custPwd2,
      firstName: 'Ali', lastName: 'Ahmed',
      phone: '+923451234567', role: UserRole.CUSTOMER,
      isVerified: false, isActive: true,
    },
  });

  console.log('✔ Users seeded (5)');

  // ── ADDRESSES ──────────────────────────────────────────────────────────────

  const addr1 = await db.userAddress.upsert({
    where: { id: 'addr-sara-home' },
    update: {},
    create: {
      id: 'addr-sara-home', userId: customer1.id,
      label: 'Home', streetLine1: '12-A Gulshan-e-Iqbal Block 5',
      city: 'Karachi', state: 'Sindh', postalCode: '75300', country: 'PK', isDefault: true,
    },
  });

  await db.userAddress.upsert({
    where: { id: 'addr-sara-office' },
    update: {},
    create: {
      id: 'addr-sara-office', userId: customer1.id,
      label: 'Office', streetLine1: '5th Floor, Dolmen Mall, Clifton',
      city: 'Karachi', state: 'Sindh', postalCode: '75600', country: 'PK', isDefault: false,
    },
  });

  const addr2 = await db.userAddress.upsert({
    where: { id: 'addr-ali-home' },
    update: {},
    create: {
      id: 'addr-ali-home', userId: customer2.id,
      label: 'Home', streetLine1: '23 Model Town Extension',
      city: 'Lahore', state: 'Punjab', postalCode: '54700', country: 'PK', isDefault: true,
    },
  });

  console.log('✔ Addresses seeded');

  // ── CATEGORIES ─────────────────────────────────────────────────────────────

  const catMedicines = await db.category.upsert({
    where: { slug: 'medicines' },
    update: {},
    create: { name: 'Medicines', slug: 'medicines', description: 'Prescription and OTC medicines', sortOrder: 1 },
  });

  const catAntibiotics = await db.category.upsert({
    where: { slug: 'antibiotics' },
    update: {},
    create: { name: 'Antibiotics', slug: 'antibiotics', description: 'Antibiotic medications', parentId: catMedicines.id, sortOrder: 1 },
  });

  const catPainRelief = await db.category.upsert({
    where: { slug: 'pain-relief' },
    update: {},
    create: { name: 'Pain Relief', slug: 'pain-relief', description: 'Analgesics and anti-inflammatories', parentId: catMedicines.id, sortOrder: 2 },
  });

  const catVitamins = await db.category.upsert({
    where: { slug: 'vitamins-supplements' },
    update: {},
    create: { name: 'Vitamins & Supplements', slug: 'vitamins-supplements', description: 'Daily health supplements', sortOrder: 2 },
  });

  const catPersonalCare = await db.category.upsert({
    where: { slug: 'personal-care' },
    update: {},
    create: { name: 'Personal Care', slug: 'personal-care', description: 'Skincare and hygiene products', sortOrder: 3 },
  });

  const catDevices = await db.category.upsert({
    where: { slug: 'medical-devices' },
    update: {},
    create: { name: 'Medical Devices', slug: 'medical-devices', description: 'BP monitors, glucometers, and more', sortOrder: 4 },
  });

  const catBabyMom = await db.category.upsert({
    where: { slug: 'baby-mother' },
    update: {},
    create: { name: 'Baby & Mother', slug: 'baby-mother', description: 'Products for babies and mothers', sortOrder: 5 },
  });

  console.log('✔ Categories seeded (7)');

  // ── MANUFACTURERS ──────────────────────────────────────────────────────────

  const mfgGSK = await db.manufacturer.upsert({
    where: { slug: 'gsk-pakistan' },
    update: {},
    create: { name: 'GSK Pakistan', slug: 'gsk-pakistan', country: 'PK' },
  });

  const mfgAbbott = await db.manufacturer.upsert({
    where: { slug: 'abbott-laboratories' },
    update: {},
    create: { name: 'Abbott Laboratories', slug: 'abbott-laboratories', country: 'US' },
  });

  const mfgSanofi = await db.manufacturer.upsert({
    where: { slug: 'sanofi-pakistan' },
    update: {},
    create: { name: 'Sanofi Pakistan', slug: 'sanofi-pakistan', country: 'FR' },
  });

  const mfgOBS = await db.manufacturer.upsert({
    where: { slug: 'obs-pakistan' },
    update: {},
    create: { name: 'OBS Pakistan', slug: 'obs-pakistan', country: 'PK' },
  });

  console.log('✔ Manufacturers seeded (4)');

  // ── PRODUCTS ───────────────────────────────────────────────────────────────

  const productDefs = [
    // Antibiotics
    {
      categoryId: catAntibiotics.id, manufacturerId: mfgGSK.id,
      name: 'Augmentin 500mg', slug: 'augmentin-500mg', genericName: 'Amoxicillin + Clavulanate',
      sku: 'AUG-500-30', price: 450, requiresPrescription: true,
      dosageForm: 'Tablet', strength: '500mg/125mg', packSize: '30 tablets',
      shortDescription: 'Broad-spectrum antibiotic combination', isActive: true, isFeatured: false,
    },
    {
      categoryId: catAntibiotics.id, manufacturerId: mfgAbbott.id,
      name: 'Erythrocin 250mg', slug: 'erythrocin-250mg', genericName: 'Erythromycin',
      sku: 'ERY-250-20', price: 320, requiresPrescription: true,
      dosageForm: 'Tablet', strength: '250mg', packSize: '20 tablets',
      shortDescription: 'Macrolide antibiotic for respiratory infections', isActive: true,
    },
    // Pain Relief
    {
      categoryId: catPainRelief.id, manufacturerId: mfgGSK.id,
      name: 'Panadol 500mg', slug: 'panadol-500mg', genericName: 'Paracetamol',
      sku: 'PAR-500-20', price: 120,
      dosageForm: 'Tablet', strength: '500mg', packSize: '20 tablets',
      shortDescription: 'Pain and fever relief', isActive: true, isFeatured: true,
    },
    {
      categoryId: catPainRelief.id, manufacturerId: mfgSanofi.id,
      name: 'Brufen 400mg', slug: 'brufen-400mg', genericName: 'Ibuprofen',
      sku: 'IBU-400-20', price: 180,
      dosageForm: 'Tablet', strength: '400mg', packSize: '20 tablets',
      shortDescription: 'Anti-inflammatory pain relief', isActive: true, isFeatured: true,
    },
    {
      categoryId: catPainRelief.id, manufacturerId: mfgGSK.id,
      name: 'Voltaren 50mg', slug: 'voltaren-50mg', genericName: 'Diclofenac Sodium',
      sku: 'DCF-50-30', price: 250, requiresPrescription: true,
      dosageForm: 'Tablet', strength: '50mg', packSize: '30 tablets',
      shortDescription: 'Powerful anti-inflammatory for arthritis pain', isActive: true,
    },
    // Vitamins
    {
      categoryId: catVitamins.id,
      name: 'Vitamin C 1000mg', slug: 'vitamin-c-1000mg', genericName: 'Ascorbic Acid',
      sku: 'VIT-C-1000-60', price: 350,
      dosageForm: 'Effervescent Tablet', strength: '1000mg', packSize: '60 tablets',
      shortDescription: 'Immune system support', isActive: true, isFeatured: true,
    },
    {
      categoryId: catVitamins.id, manufacturerId: mfgAbbott.id,
      name: 'Ensure Gold Vanilla', slug: 'ensure-gold-vanilla', genericName: 'Complete Nutrition Supplement',
      sku: 'ENS-GLD-400G', price: 2800,
      dosageForm: 'Powder', packSize: '400g',
      shortDescription: 'Complete adult nutrition supplement', isActive: true, isFeatured: true,
    },
    {
      categoryId: catVitamins.id,
      name: 'Omega-3 Fish Oil 1000mg', slug: 'omega-3-fish-oil-1000mg', genericName: 'Omega-3 Fatty Acids',
      sku: 'OMG-1000-90', price: 950,
      dosageForm: 'Softgel Capsule', strength: '1000mg', packSize: '90 capsules',
      shortDescription: 'Heart and brain health support', isActive: true,
    },
    // Personal Care
    {
      categoryId: catPersonalCare.id, manufacturerId: mfgOBS.id,
      name: 'Dettol Antiseptic Liquid 250ml', slug: 'dettol-antiseptic-250ml', genericName: 'Chloroxylenol',
      sku: 'DTL-ANT-250', price: 280,
      dosageForm: 'Liquid', strength: '4.8%', packSize: '250ml',
      shortDescription: 'Trusted antiseptic protection', isActive: true,
    },
    {
      categoryId: catPersonalCare.id,
      name: 'Sensodyne Sensitive Toothpaste 75ml', slug: 'sensodyne-sensitive-75ml', genericName: 'Potassium Nitrate + Fluoride',
      sku: 'SEN-TP-75', price: 420,
      dosageForm: 'Gel', packSize: '75ml',
      shortDescription: 'Relief for sensitive teeth', isActive: true,
    },
    // Medical Devices
    {
      categoryId: catDevices.id, manufacturerId: mfgOBS.id,
      name: 'Omron BP Monitor HEM-7120', slug: 'omron-bp-monitor-hem7120',
      sku: 'OMR-BP-7120', price: 5500,
      dosageForm: 'Device', packSize: '1 unit',
      shortDescription: 'Fully automatic upper arm blood pressure monitor', isActive: true, isFeatured: true,
    },
    {
      categoryId: catDevices.id,
      name: 'Accu-Chek Active Glucometer', slug: 'accu-chek-active-glucometer',
      sku: 'ACC-GLC-ACT', price: 3200,
      dosageForm: 'Device', packSize: '1 unit',
      shortDescription: 'Blood glucose monitoring system', isActive: true,
    },
    // Baby & Mother
    {
      categoryId: catBabyMom.id, manufacturerId: mfgAbbott.id,
      name: 'Similac Advance Step 1', slug: 'similac-advance-step1', genericName: 'Infant Formula',
      sku: 'SIM-ADV-1-400', price: 3400,
      dosageForm: 'Powder', packSize: '400g',
      shortDescription: 'Complete nutrition for infants 0-6 months', isActive: true, isFeatured: true,
    },
  ] as const;

  const products: Record<string, { id: string; name: string; sku: string; price: any }> = {};

  for (const p of productDefs) {
    const prod = await db.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: { ...(p as any) },
    });
    products[p.sku] = prod;
  }

  console.log(`✔ Products seeded (${Object.keys(products).length})`);

  // ── INVENTORY BATCHES ──────────────────────────────────────────────────────

  const batchDefs = [
    { sku: 'AUG-500-30',   batch: 'AUGB-001', qty: 200, price: 315,  expDays: 730  },
    { sku: 'AUG-500-30',   batch: 'AUGB-002', qty: 150, price: 320,  expDays: 545  },
    { sku: 'ERY-250-20',   batch: 'ERYB-001', qty: 180, price: 224,  expDays: 600  },
    { sku: 'PAR-500-20',   batch: 'PARB-001', qty: 500, price: 84,   expDays: 730  },
    { sku: 'PAR-500-20',   batch: 'PARB-002', qty: 300, price: 85,   expDays: 365  },
    { sku: 'IBU-400-20',   batch: 'IBUB-001', qty: 300, price: 126,  expDays: 730  },
    { sku: 'DCF-50-30',    batch: 'DCFB-001', qty: 150, price: 175,  expDays: 400  },
    { sku: 'VIT-C-1000-60', batch: 'VITCB-001', qty: 400, price: 245, expDays: 730 },
    { sku: 'ENS-GLD-400G', batch: 'ENSB-001', qty: 80,  price: 1960, expDays: 365  },
    { sku: 'OMG-1000-90',  batch: 'OMGB-001', qty: 200, price: 665,  expDays: 730  },
    { sku: 'DTL-ANT-250',  batch: 'DTLB-001', qty: 250, price: 196,  expDays: 1095 },
    { sku: 'SEN-TP-75',    batch: 'SENB-001', qty: 120, price: 294,  expDays: 730  },
    { sku: 'OMR-BP-7120',  batch: 'OMRB-001', qty: 30,  price: 3850, expDays: 1825 },
    { sku: 'ACC-GLC-ACT',  batch: 'ACCB-001', qty: 40,  price: 2240, expDays: 1095 },
    { sku: 'SIM-ADV-1-400', batch: 'SIMB-001', qty: 60, price: 2380, expDays: 365  },
    // Expiring soon batch for testing alerts
    { sku: 'PAR-500-20',   batch: 'PARB-EXP', qty: 50,  price: 80,  expDays: 20   },
  ];

  const batches: Record<string, { id: string; productId: string }> = {};

  for (const b of batchDefs) {
    const prod = products[b.sku];
    if (!prod) continue;

    try {
      const batch = await db.inventoryBatch.upsert({
        where: { productId_batchNumber: { productId: prod.id, batchNumber: b.batch } },
        update: {},
        create: {
          productId: prod.id, batchNumber: b.batch,
          quantity: b.qty, expiryDate: future(b.expDays),
          purchasePrice: b.price,
        },
      });
      batches[b.batch] = batch;
    } catch (_) {
      // skip if batch already exists
    }
  }

  // Recalculate totalStock for each product
  for (const sku of Object.keys(products)) {
    const prod = products[sku];
    const agg = await db.inventoryBatch.aggregate({
      where: { productId: prod.id, isActive: true },
      _sum: { quantity: true },
    });
    await db.product.update({
      where: { id: prod.id },
      data: { totalStock: agg._sum.quantity ?? 0 },
    });
  }

  console.log(`✔ Inventory batches seeded (${Object.keys(batches).length})`);

  // ── STOCK ADJUSTMENTS ─────────────────────────────────────────────────────

  const firstBatch = batches['AUGB-001'];
  if (firstBatch) {
    await db.stockAdjustment.create({
      data: {
        batchId: firstBatch.id, userId: admin.id,
        type: StockAdjustmentType.PURCHASE, quantity: 200,
        reason: 'Initial purchase order PO-2026-001',
      },
    });
    await db.stockAdjustment.create({
      data: {
        batchId: firstBatch.id, userId: pharmacist.id,
        type: StockAdjustmentType.DAMAGE, quantity: -5,
        reason: 'Damaged during delivery inspection',
      },
    });
  }

  console.log('✔ Stock adjustments seeded');

  // ── COUPONS ────────────────────────────────────────────────────────────────

  const coupons = await Promise.all([
    db.coupon.upsert({
      where: { code: 'WELCOME10' },
      update: {},
      create: {
        code: 'WELCOME10', type: CouponType.PERCENTAGE, value: 10,
        maxDiscount: 200, validFrom: past(30), validUntil: future(335), isActive: true,
      },
    }),
    db.coupon.upsert({
      where: { code: 'SAVE100' },
      update: {},
      create: {
        code: 'SAVE100', type: CouponType.FLAT, value: 100,
        minOrderAmount: 1000, validFrom: new Date(), validUntil: future(60), isActive: true,
      },
    }),
    db.coupon.upsert({
      where: { code: 'HEALTH15' },
      update: {},
      create: {
        code: 'HEALTH15', type: CouponType.PERCENTAGE, value: 15,
        maxDiscount: 500, usageLimit: 500,
        validFrom: past(10), validUntil: future(20), isActive: true,
      },
    }),
    db.coupon.upsert({
      where: { code: 'PHARMA20' },
      update: {},
      create: {
        code: 'PHARMA20', type: CouponType.PERCENTAGE, value: 20,
        maxDiscount: 400, usageLimit: 200,
        validFrom: past(5), validUntil: future(25), isActive: true,
      },
    }),
  ]);

  console.log(`✔ Coupons seeded (${coupons.length})`);

  // ── PRESCRIPTIONS ──────────────────────────────────────────────────────────

  const rx1 = await db.prescription.upsert({
    where: { id: 'rx-sara-001' },
    update: {},
    create: {
      id: 'rx-sara-001', userId: customer1.id,
      doctorName: 'Dr. Imran Sheikh', doctorLicense: 'PMC-12345',
      hospitalName: 'Aga Khan University Hospital',
      issuedDate: past(5),
      imageKeys: ['uploads/prescriptions/rx-sara-001-front.jpg'],
      status: PrescriptionStatus.APPROVED,
      reviewedById: pharmacist.id, reviewedAt: past(3),
      expiresAt: future(25),
      items: {
        create: [
          { medicationName: 'Augmentin 500mg', dosage: '500mg/125mg', frequency: 'Twice daily', duration: '7 days', quantity: 14, productId: products['AUG-500-30']?.id },
          { medicationName: 'Brufen 400mg',    dosage: '400mg',       frequency: 'Three times daily', duration: '5 days', quantity: 15 },
        ],
      },
    },
  });

  const rx2 = await db.prescription.upsert({
    where: { id: 'rx-ali-001' },
    update: {},
    create: {
      id: 'rx-ali-001', userId: customer2.id,
      doctorName: 'Dr. Ayesha Noor', doctorLicense: 'PMC-67890',
      issuedDate: past(2),
      imageKeys: ['uploads/prescriptions/rx-ali-001.jpg'],
      status: PrescriptionStatus.PENDING,
    },
  });

  console.log('✔ Prescriptions seeded (2)');

  // ── ORDERS ─────────────────────────────────────────────────────────────────

  // Order 1: Delivered, paid (Sara)
  const order1 = await db.order.upsert({
    where: { orderNumber: 'PH-20260628-0001' },
    update: {},
    create: {
      orderNumber: 'PH-20260628-0001', userId: customer1.id, addressId: addr1.id,
      couponId: coupons[0].id, prescriptionId: rx1.id,
      status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.JAZZCASH,
      subtotal: 570, discountAmount: 57, shippingFee: 100, taxAmount: 0, total: 613,
      deliveredAt: past(2),
    },
  });

  await db.orderItem.upsert({
    where: { id: 'oi-1-aug' },
    update: {},
    create: {
      id: 'oi-1-aug', orderId: order1.id,
      productId: products['AUG-500-30'].id,
      productName: 'Augmentin 500mg', productSku: 'AUG-500-30',
      unitPrice: 450, quantity: 1, subtotal: 450, batchNumber: 'AUGB-001',
    },
  });

  await db.orderItem.upsert({
    where: { id: 'oi-1-par' },
    update: {},
    create: {
      id: 'oi-1-par', orderId: order1.id,
      productId: products['PAR-500-20'].id,
      productName: 'Panadol 500mg', productSku: 'PAR-500-20',
      unitPrice: 120, quantity: 1, subtotal: 120, batchNumber: 'PARB-001',
    },
  });

  await db.orderStatusHistory.createMany({
    skipDuplicates: true,
    data: [
      { orderId: order1.id, status: OrderStatus.PENDING,   note: 'Order placed', changedBy: customer1.id, createdAt: past(8) },
      { orderId: order1.id, status: OrderStatus.CONFIRMED, note: 'Payment verified', changedBy: admin.id, createdAt: past(7) },
      { orderId: order1.id, status: OrderStatus.PROCESSING, note: 'Being packed', changedBy: admin.id, createdAt: past(6) },
      { orderId: order1.id, status: OrderStatus.SHIPPED,   note: 'Dispatched via TCS', changedBy: admin.id, createdAt: past(5) },
      { orderId: order1.id, status: OrderStatus.DELIVERED, note: 'Delivered successfully', changedBy: admin.id, createdAt: past(2) },
    ],
  });

  await db.payment.upsert({
    where: { orderId: order1.id },
    update: {},
    create: {
      orderId: order1.id, amount: 613, method: PaymentMethod.JAZZCASH,
      status: PaymentStatus.PAID, transactionId: 'JC-20260628-789012',
      paidAt: past(8),
    },
  });

  // Order 2: Processing (Ali)
  const order2 = await db.order.upsert({
    where: { orderNumber: 'PH-20260701-0002' },
    update: {},
    create: {
      orderNumber: 'PH-20260701-0002', userId: customer2.id, addressId: addr2.id,
      status: OrderStatus.PROCESSING, paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      subtotal: 5620, discountAmount: 0, shippingFee: 0, taxAmount: 0, total: 5620,
    },
  });

  await db.orderItem.upsert({
    where: { id: 'oi-2-omr' },
    update: {},
    create: {
      id: 'oi-2-omr', orderId: order2.id,
      productId: products['OMR-BP-7120'].id,
      productName: 'Omron BP Monitor HEM-7120', productSku: 'OMR-BP-7120',
      unitPrice: 5500, quantity: 1, subtotal: 5500, batchNumber: 'OMRB-001',
    },
  });

  await db.orderItem.upsert({
    where: { id: 'oi-2-vitc' },
    update: {},
    create: {
      id: 'oi-2-vitc', orderId: order2.id,
      productId: products['VIT-C-1000-60'].id,
      productName: 'Vitamin C 1000mg', productSku: 'VIT-C-1000-60',
      unitPrice: 350, quantity: 1, subtotal: 350, batchNumber: 'VITCB-001',
    },
  });

  await db.payment.upsert({
    where: { orderId: order2.id },
    update: {},
    create: {
      orderId: order2.id, amount: 5620, method: PaymentMethod.CREDIT_CARD,
      status: PaymentStatus.PAID, transactionId: 'CC-20260701-123456', paidAt: past(1),
    },
  });

  // Order 3: Pending COD (Sara)
  const order3 = await db.order.upsert({
    where: { orderNumber: 'PH-20260702-0003' },
    update: {},
    create: {
      orderNumber: 'PH-20260702-0003', userId: customer1.id, addressId: addr1.id,
      status: OrderStatus.PENDING, paymentStatus: PaymentStatus.UNPAID,
      paymentMethod: PaymentMethod.COD,
      subtotal: 1300, discountAmount: 130, shippingFee: 150, taxAmount: 0, total: 1320,
      couponId: coupons[1].id,
    },
  });

  await db.orderItem.upsert({
    where: { id: 'oi-3-ens' },
    update: {},
    create: {
      id: 'oi-3-ens', orderId: order3.id,
      productId: products['ENS-GLD-400G'].id,
      productName: 'Ensure Gold Vanilla', productSku: 'ENS-GLD-400G',
      unitPrice: 2800, quantity: 1, subtotal: 2800,
    },
  });

  console.log('✔ Orders seeded (3)');

  // ── REVIEWS ────────────────────────────────────────────────────────────────

  await db.productReview.upsert({
    where: { productId_userId: { productId: products['PAR-500-20'].id, userId: customer1.id } },
    update: {},
    create: {
      productId: products['PAR-500-20'].id, userId: customer1.id, orderId: order1.id,
      rating: 5, title: 'Works great!',
      body: 'Effective pain relief. Took effect within 30 minutes. Will buy again.',
      isVerified: true, isApproved: true,
    },
  });

  await db.productReview.upsert({
    where: { productId_userId: { productId: products['AUG-500-30'].id, userId: customer1.id } },
    update: {},
    create: {
      productId: products['AUG-500-30'].id, userId: customer1.id, orderId: order1.id,
      rating: 4, title: 'Good antibiotic',
      body: 'Cleared my infection quickly. Slightly expensive but worth it.',
      isVerified: true, isApproved: true,
    },
  });

  await db.productReview.upsert({
    where: { productId_userId: { productId: products['OMR-BP-7120'].id, userId: customer2.id } },
    update: {},
    create: {
      productId: products['OMR-BP-7120'].id, userId: customer2.id, orderId: order2.id,
      rating: 5, title: 'Highly accurate',
      body: 'Compared with clinic readings — spot on. Easy to use, great display.',
      isVerified: true, isApproved: false,
    },
  });

  // Update product ratings
  for (const sku of Object.keys(products)) {
    const prod = products[sku];
    const agg = await db.productReview.aggregate({
      where: { productId: prod.id, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await db.product.update({
      where: { id: prod.id },
      data: {
        averageRating: agg._avg.rating ?? 0,
        reviewCount: agg._count.rating,
      },
    });
  }

  console.log('✔ Reviews seeded (3)');

  // ── CART ───────────────────────────────────────────────────────────────────

  const sara_cart = await db.cart.upsert({
    where: { userId: customer1.id },
    update: {},
    create: { userId: customer1.id },
  });

  await db.cartItem.upsert({
    where: { cartId_productId: { cartId: sara_cart.id, productId: products['VIT-C-1000-60'].id } },
    update: {},
    create: { cartId: sara_cart.id, productId: products['VIT-C-1000-60'].id, quantity: 2 },
  });

  await db.cartItem.upsert({
    where: { cartId_productId: { cartId: sara_cart.id, productId: products['OMG-1000-90'].id } },
    update: {},
    create: { cartId: sara_cart.id, productId: products['OMG-1000-90'].id, quantity: 1 },
  });

  console.log('✔ Cart seeded (Sara: 2 items)');

  // ── WISHLIST ───────────────────────────────────────────────────────────────

  const wishlistItems = [
    { userId: customer1.id, productId: products['ENS-GLD-400G'].id },
    { userId: customer1.id, productId: products['OMR-BP-7120'].id  },
    { userId: customer2.id, productId: products['VIT-C-1000-60'].id },
    { userId: customer2.id, productId: products['IBU-400-20'].id    },
  ];

  for (const w of wishlistItems) {
    await db.wishlistItem.upsert({
      where: { userId_productId: { userId: w.userId, productId: w.productId } },
      update: {},
      create: w,
    });
  }

  console.log(`✔ Wishlist seeded (${wishlistItems.length} items)`);

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────

  await db.notification.createMany({
    skipDuplicates: true,
    data: [
      { userId: customer1.id, type: NotificationType.ORDER_PLACED,   title: 'Order Placed',     body: 'Your order PH-20260702-0003 has been placed successfully.', data: { orderId: order3.id }, createdAt: past(1) },
      { userId: customer1.id, type: NotificationType.ORDER_DELIVERED, title: 'Order Delivered',  body: 'Your order PH-20260628-0001 has been delivered!', data: { orderId: order1.id }, isRead: true, readAt: past(1), createdAt: past(2) },
      { userId: customer1.id, type: NotificationType.PAYMENT_RECEIVED, title: 'Payment Received', body: 'Payment of PKR 613 received for order PH-20260628-0001.', data: { orderId: order1.id }, isRead: true, readAt: past(3), createdAt: past(8) },
      { userId: customer2.id, type: NotificationType.ORDER_CONFIRMED, title: 'Order Confirmed',  body: 'Your order PH-20260701-0002 is confirmed and being processed.', data: { orderId: order2.id }, createdAt: past(1) },
      { userId: customer2.id, type: NotificationType.PRESCRIPTION_APPROVED, title: 'Prescription Under Review', body: 'Your prescription has been submitted and is under review.', isRead: false },
      { userId: admin.id,    type: NotificationType.LOW_STOCK_ALERT, title: 'Low Stock Alert', body: 'Omron BP Monitor HEM-7120 has only 30 units left.', data: { productId: products['OMR-BP-7120'].id } },
    ],
  });

  console.log('✔ Notifications seeded (6)');

  // ── MESSAGES ───────────────────────────────────────────────────────────────

  const msg1 = await db.message.create({
    data: {
      senderId: customer1.id, receiverId: pharmacist.id,
      subject: 'Question about Augmentin dosage',
      body: 'Hello, I was prescribed Augmentin 500mg. Should I take it with food? Are there any side effects I should watch for?',
      status: MessageStatus.READ,
    },
  });

  await db.message.create({
    data: {
      senderId: pharmacist.id, receiverId: customer1.id,
      subject: 'RE: Question about Augmentin dosage',
      body: 'Hi Sara! Yes, please take Augmentin with food or milk to reduce stomach upset. Common side effects include nausea and diarrhea. If you experience a rash, stop immediately and contact us.',
      status: MessageStatus.READ,
      parentId: msg1.id,
    },
  });

  await db.message.create({
    data: {
      senderId: customer2.id, receiverId: pharmacist.id,
      subject: 'Prescription inquiry',
      body: 'Hi, I submitted a prescription for Voltaren. How long does the review usually take?',
      status: MessageStatus.SENT,
    },
  });

  console.log('✔ Messages seeded (3)');

  // ── AUDIT LOGS ─────────────────────────────────────────────────────────────

  await db.auditLog.createMany({
    data: [
      { userId: admin.id,  action: 'CREATE', entity: 'Product', entityId: products['AUG-500-30'].id, newValue: { name: 'Augmentin 500mg' }, ipAddress: '192.168.1.10' },
      { userId: admin.id,  action: 'CREATE', entity: 'Product', entityId: products['PAR-500-20'].id, newValue: { name: 'Panadol 500mg' }, ipAddress: '192.168.1.10' },
      { userId: customer1.id, action: 'CREATE', entity: 'Order', entityId: order1.id, newValue: { orderNumber: 'PH-20260628-0001', total: 613 }, ipAddress: '203.215.22.14' },
      { userId: customer1.id, action: 'CREATE', entity: 'Order', entityId: order3.id, newValue: { orderNumber: 'PH-20260702-0003', total: 1320 }, ipAddress: '203.215.22.14' },
      { userId: pharmacist.id, action: 'UPDATE', entity: 'Prescription', entityId: rx1.id, oldValue: { status: 'PENDING' }, newValue: { status: 'APPROVED' }, ipAddress: '10.0.0.5' },
      { userId: admin.id, action: 'UPDATE', entity: 'Order', entityId: order1.id, oldValue: { status: 'PROCESSING' }, newValue: { status: 'SHIPPED' }, ipAddress: '192.168.1.10' },
      { userId: null, action: 'LOGIN_FAILED', entity: 'Auth', entityId: null, newValue: { email: 'unknown@test.com' }, ipAddress: '1.2.3.4' },
    ],
  });

  console.log('✔ Audit logs seeded (7)');

  // ── SUMMARY ────────────────────────────────────────────────────────────────

  console.log('\n✅ Seed complete!\n');
  console.log('Credentials:');
  console.log('  Super Admin  — admin@pharmacy.com           / Admin@1234');
  console.log('  Admin        — store.admin@pharmacy.com     / Admin@5678');
  console.log('  Pharmacist   — pharmacist@pharmacy.com      / Pharma@1234');
  console.log('  Customer 1   — sara.khan@email.com          / Customer@123');
  console.log('  Customer 2   — ali.ahmed@email.com          / Customer@456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
