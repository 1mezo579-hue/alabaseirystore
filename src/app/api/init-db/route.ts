import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("Initializing database schema...");
    
    // Run prisma db push via npx using the schema file
    try {
      execSync("npx prisma db push --accept-data-loss", {
        env: {
          ...process.env,
          // Ensure prisma can find the schema if needed
        },
      });
      console.log("Prisma db push completed successfully.");
    } catch (dbError: any) {
      console.error("Error running prisma db push:", dbError.message);
      return NextResponse.json(
        { error: `فشل تهيئة الجداول: ${dbError.message}` },
        { status: 500 }
      );
    }

    // Check if database is already seeded
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json({
        success: true,
        message: "قاعدة البيانات مهيأة بالفعل ولا تحتاج لإعادة بناء.",
      });
    }

    console.log("Seeding database...");

    // 1. Seed Users
    const defaultPassword = await bcrypt.hash("123456", 10);
    const users = [
      { username: "admin", password: defaultPassword, role: "admin", name: "أحمد الأباصيري (المالك)" },
      { username: "manager", password: defaultPassword, role: "manager", name: "المدير العام" },
      { username: "tech1", password: defaultPassword, role: "technician", name: "المهندس محمود (فني صيانة)" },
      { username: "cashier1", password: defaultPassword, role: "cashier", name: "كاشير 1" },
    ];

    for (const u of users) {
      await prisma.user.upsert({
        where: { username: u.username },
        update: { name: u.name, role: u.role },
        create: u,
      });
    }

    // 2. Seed Settings
    const settings = [
      { key: "store_name", value: "الأباصيري ستور - ALABASSIRY STORE" },
      { key: "store_phone", value: "01099668855 - 01244556677" },
      { key: "store_address", value: "شارع الجمهورية - بجوار محطة القطار" },
      { key: "receipt_footer", value: "شكراً لزيارتكم الأباصيري ستور. الأجهزة المتروكة للصيانة لأكثر من 3 أشهر دون استلام تسقط مسؤولية المحل عنها تماماً. يرجى الاحتفاظ بالبون الاستلام." },
    ];

    for (const s of settings) {
      await prisma.setting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: s,
      });
    }

    // 3. Seed Customers
    const customers = [
      { name: "عميل نقدي (كاش)", phone: "0000000000", address: "المحل", points: 0, balance: 0 },
      { name: "محمد إبراهيم", phone: "01023456789", address: "وسط البلد", points: 25, balance: 0 },
      { name: "مصطفى حسن", phone: "01155443322", address: "شمال المدينة", points: 10, balance: 1500 },
      { name: "كريم عبد العزيز", phone: "01233445566", address: "حي الزهور", points: 5, balance: -200 },
    ];

    for (const c of customers) {
      await prisma.customer.upsert({
        where: { phone: c.phone },
        update: { name: c.name, address: c.address, balance: c.balance },
        create: c,
      });
    }

    // 4. Seed Categories and Products
    const categoriesData = [
      {
        name: "هواتف ذكية",
        products: [
          { name: "iPhone 15 Pro Max 256GB Black", costPrice: 52000, price: 56500, barcode: "195949033321", stock: 3, minStock: 1 },
          { name: "Samsung Galaxy S24 Ultra 512GB", costPrice: 48000, price: 52000, barcode: "8806095304910", stock: 2, minStock: 1 },
          { name: "Redmi Note 13 Pro 8GB/256GB", costPrice: 11500, price: 12800, barcode: "6941812759902", stock: 8, minStock: 2 },
          { name: "Realme C67 8GB/256GB", costPrice: 7200, price: 7900, barcode: "6973082539091", stock: 10, minStock: 3 },
        ]
      },
      {
        name: "سكرينات وحماية",
        products: [
          { name: "سكرين خصوصية ملاقيف iPhone 15 Pro", costPrice: 40, price: 90, barcode: "10001001", stock: 50, minStock: 10 },
          { name: "سكرين نانو جيلاتين كاملة Samsung S24", costPrice: 35, price: 80, barcode: "10001002", stock: 30, minStock: 5 },
          { name: "سكرين سيراميك ضد الكسر Redmi Note 13", costPrice: 20, price: 50, barcode: "10001003", stock: 100, minStock: 15 },
          { name: "سكرين عدسات كاميرا خلفية iPhone 15 Pro", costPrice: 30, price: 70, barcode: "10001004", stock: 40, minStock: 5 },
        ]
      },
      {
        name: "جرابات وكفرات",
        products: [
          { name: "جراب سيليكون أصلي MagSafe iPhone 15", costPrice: 150, price: 350, barcode: "20002001", stock: 20, minStock: 5 },
          { name: "جراب شفاف مضاد للصدمات Samsung S24", costPrice: 50, price: 120, barcode: "20002002", stock: 25, minStock: 5 },
          { name: "جراب حماية فليب جلد كلاسيك لجميع الموديلات", costPrice: 70, price: 150, barcode: "20002003", stock: 15, minStock: 3 },
        ]
      },
      {
        name: "سماعات وإكسسوارات صوت",
        products: [
          { name: "Apple AirPods Pro 2 (Copy)", costPrice: 450, price: 750, barcode: "30003001", stock: 12, minStock: 3 },
          { name: "سماعة سلكية Type-C Joyroom", costPrice: 80, price: 140, barcode: "30003002", stock: 40, minStock: 10 },
          { name: "سماعة بلوتوث رياضية Oraimo Necklace", costPrice: 380, price: 520, barcode: "30003003", stock: 8, minStock: 2 },
          { name: "سماعة صب بلوتوث محمولة ميني", costPrice: 120, price: 220, barcode: "30003004", stock: 15, minStock: 4 },
        ]
      },
      {
        name: "شواحن وكابلات",
        products: [
          { name: "رأس شاحن سريع Anker 20W Type-C", costPrice: 280, price: 420, barcode: "40004001", stock: 15, minStock: 4 },
          { name: "رأس شاحن Samsung 45W أصلي ثلاثي", costPrice: 650, price: 950, barcode: "40004002", stock: 6, minStock: 2 },
          { name: "كابل Type-C to Type-C مضفر Joyroom 1m", costPrice: 60, price: 110, barcode: "40004003", stock: 50, minStock: 10 },
          { name: "باور بنك Anker 20000mAh شحن سريع", costPrice: 950, price: 1450, barcode: "40004004", stock: 5, minStock: 2 },
        ]
      },
      {
        name: "كروت شحن ورصيد",
        products: [
          { name: "شحن رصيد كارت فودافون فئة 50", costPrice: 50, price: 50, barcode: "60001001", stock: 100, minStock: 10 },
          { name: "شحن رصيد كارت اتصالات فئة 50", costPrice: 50, price: 50, barcode: "60001002", stock: 100, minStock: 10 },
          { name: "شحن رصيد كارت اورنج فئة 50", costPrice: 50, price: 50, barcode: "60001003", stock: 100, minStock: 10 },
          { name: "تحويل كاش فودافون", costPrice: 0, price: 5, priceType: "service", stock: 9999, minStock: 0 },
          { name: "تحويل كاش اتصالات", costPrice: 0, price: 5, priceType: "service", stock: 9999, minStock: 0 },
        ]
      },
      {
        name: "خدمات فوري والدفع الإلكتروني",
        products: [
          { name: "دفع فاتورة كهرباء فوري", costPrice: 0, price: 5, priceType: "service", stock: 9999, minStock: 0 },
          { name: "دفع فاتورة مياه فوري", costPrice: 0, price: 5, priceType: "service", stock: 9999, minStock: 0 },
          { name: "دفع فاتورة غاز فوري", costPrice: 0, price: 5, priceType: "service", stock: 9999, minStock: 0 },
          { name: "شحن خط أرضي Telecom Egypt", costPrice: 0, price: 5, priceType: "service", stock: 9999, minStock: 0 },
        ]
      },
      {
        name: "قطع غيار وإكسسوارات كمبيوتر",
        products: [
          { name: "ذاكرة عشوائية Kingston RAM 8GB DDR4 Laptop", costPrice: 650, price: 900, barcode: "70001001", stock: 10, minStock: 2 },
          { name: "وحدة تخزين Kingston SSD 240GB A400 SATA", costPrice: 750, price: 1100, barcode: "70001002", stock: 8, minStock: 2 },
          { name: "وحدة تخزين هارد ديسك WD Blue 1TB PC", costPrice: 1600, price: 2100, barcode: "70001003", stock: 5, minStock: 1 },
          { name: "ماوس سلكي ميني USB أسود", costPrice: 40, price: 80, barcode: "70001004", stock: 25, minStock: 5 },
        ]
      },
      {
        name: "صيانة وقطع غيار",
        products: [
          { name: "خدمة تغيير شاشة هاتف فئة متوسطة", costPrice: 800, price: 1500, priceType: "service", stock: 9999, minStock: 0 },
          { name: "خدمة فحص وتغيير مدخل شحن هاتف", costPrice: 50, price: 200, priceType: "service", stock: 9999, minStock: 0 },
          { name: "خدمة تنظيف كمبيوتر/لابتوب وتغيير المعجون الحراري", costPrice: 100, price: 350, priceType: "service", stock: 9999, minStock: 0 },
          { name: "خدمة تركيب ويندوز وتنزيل البرامج الخدمية والتعريفات", costPrice: 0, price: 150, priceType: "service", stock: 9999, minStock: 0 },
          { name: "شاشة iPhone 15 Pro Max أصلية خلع", costPrice: 12000, price: 15000, barcode: "50005001", stock: 2, minStock: 0 },
          { name: "بطارية iPhone 11 Pro أصلية نسبة 100%", costPrice: 650, price: 1100, barcode: "50005002", stock: 5, minStock: 1 },
        ]
      }
    ];

    for (const catData of categoriesData) {
      const category = await prisma.category.upsert({
        where: { name: catData.name },
        update: {},
        create: { name: catData.name },
      });

      for (const p of catData.products) {
        await prisma.product.upsert({
          where: p.barcode ? { barcode: p.barcode } : { id: -1 },
          update: {
            name: p.name,
            price: p.price,
            costPrice: p.costPrice,
            stock: p.stock,
            minStock: p.minStock,
            priceType: p.priceType || "unit",
            categoryId: category.id,
          },
          create: {
            ...p,
            priceType: p.priceType || "unit",
            categoryId: category.id,
          },
        });
      }
    }

    // 5. Seed sample Maintenance Orders
    const sampleOrders = [
      {
        orderNo: "MT-1001",
        customerName: "محمد عبد الرحمن",
        customerPhone: "01055667788",
        deviceType: "mobile",
        deviceBrand: "Apple",
        deviceModel: "iPhone 11",
        serialNo: "356789012345678",
        problem: "الشاشة مكسورة بالكامل ولا تعرض بيانات واللمس متوقف",
        techNotes: "تم تركيب شاشة أصلية جديدة وفحص الجهاز بالكامل والتجربة ناجحة",
        cost: 2500,
        paid: 500,
        remaining: 2000,
        status: "completed",
        userId: 3,
      },
      {
        orderNo: "MT-1002",
        customerName: "أحمد كمال",
        customerPhone: "01122334455",
        deviceType: "laptop",
        deviceBrand: "Dell",
        deviceModel: "Inspiration 15",
        serialNo: "DELL-7X29F3",
        problem: "الجهاز يفصل حرارة بعد 10 دقائق من تشغيل الألعاب ومروحة التبريد تصدر صوتاً مرتفعاً",
        techNotes: "يحتاج تنظيف وتزييت المروحة وتغيير المعجون الحراري المتهالك بمعجون MX-4",
        cost: 400,
        paid: 0,
        remaining: 400,
        status: "repairing",
        userId: 3,
      }
    ];

    for (const order of sampleOrders) {
      const exists = await prisma.maintenanceOrder.findFirst({ where: { orderNo: order.orderNo } });
      if (!exists) {
        await prisma.maintenanceOrder.create({ data: order });
      }
    }

    console.log("Database initialized and seeded successfully.");
    return NextResponse.json({
      success: true,
      message: "تم تهيئة قاعدة البيانات وإدخال البيانات الافتراضية بنجاح!",
    });
  } catch (e: any) {
    console.error("Initialization error:", e.message);
    return NextResponse.json(
      { error: `حدث خطأ أثناء التهيئة: ${e.message}` },
      { status: 500 }
    );
  }
}
