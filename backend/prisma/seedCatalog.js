import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  {
    code: "GUNPLA_KIT",
    slug: "gunpla-kit",
    nameVi: "Gunpla Kit",
    nameEn: "Gunpla Kit",
    description: "Mô hình lắp ráp Gundam chính hãng.",
    sortOrder: 1,
  },
  {
    code: "ACCESSORY_TOOL",
    slug: "accessory-tool",
    nameVi: "Phụ kiện & dụng cụ",
    nameEn: "Accessories & Tools",
    description: "Đế trưng bày, dụng cụ build, decal và phụ kiện.",
    sortOrder: 2,
  },
];

const suppliers = [
  {
    code: "BANDAI_OFFICIAL",
    name: "Bandai Official Distributor",
    contactName: "Bandai Sales",
    phone: "",
    email: "",
    address: "Japan / Vietnam distributor",
    note: "Demo supplier for authentic Bandai products.",
  },
];

const groups = [
  { code: "NEW_ARRIVALS", slug: "new-arrivals", nameVi: "Hàng mới về", nameEn: "New arrivals", sortOrder: 1 },
  { code: "PREORDER", slug: "preorder", nameVi: "Hàng order", nameEn: "Pre-order", sortOrder: 2 },
  { code: "BEST_SELLERS", slug: "best-sellers", nameVi: "Hàng bán chạy", nameEn: "Best sellers", sortOrder: 3 },
  { code: "SALE_PRODUCTS", slug: "sale-products", nameVi: "Hàng sale", nameEn: "Sale products", sortOrder: 4 },
  { code: "TOOLS", slug: "tools", nameVi: "Phụ kiện / Tools", nameEn: "Tools", sortOrder: 5 },
];

const productCatalog = [
  {
    sku: "RG-HINU-144-BD",
    slug: "rg-1-144-hi-nu-gundam",
    categorySlug: "gunpla-kit",
    supplierCode: "BANDAI_OFFICIAL",
    groupCodes: ["NEW_ARRIVALS", "BEST_SELLERS"],
    imageUrl: "/images/products/hi-nu.jpg",
    images: ["/images/products/hi-nu.jpg"],
    brand: "Bandai",
    grade: "RG",
    scale: "1/144",
    tone: "cyan",
    oldPrice: 1290000,
    status: "inStock",
    specs: [
      { label: "Scale", value: "1/144" },
      { label: "Height", value: "~16 cm" },
      { label: "Maker", value: "Bandai Spirits" },
      { label: "Material", value: "PS / ABS" },
    ],
    boxItems: ["Runner nhựa đầy đủ", "Decal sheet", "Beam Rifle", "Shield", "Beam Saber x2", "Sách hướng dẫn Nhật"],
  },
  {
    sku: "HG-AERIAL-144-BD",
    slug: "hg-1-144-gundam-aerial",
    categorySlug: "gunpla-kit",
    supplierCode: "BANDAI_OFFICIAL",
    groupCodes: ["NEW_ARRIVALS", "BEST_SELLERS"],
    imageUrl: "/images/products/aerial.jpg",
    images: ["/images/products/aerial.jpg"],
    brand: "Bandai",
    grade: "HG",
    scale: "1/144",
    tone: "sky",
    oldPrice: 0,
    status: "inStock",
    specs: [{ label: "Scale", value: "1/144" }],
    boxItems: ["Runner nhựa", "Sticker", "Beam parts"],
  },
  {
    sku: "MG-FREEDOM-100-VER20",
    slug: "mg-1-100-freedom-gundam-ver-2-0",
    categorySlug: "gunpla-kit",
    supplierCode: "BANDAI_OFFICIAL",
    groupCodes: ["NEW_ARRIVALS", "BEST_SELLERS"],
    imageUrl: "/images/products/freedom.jpg",
    images: ["/images/products/freedom.jpg"],
    brand: "Bandai",
    grade: "MG",
    scale: "1/100",
    tone: "blue",
    oldPrice: 1390000,
    status: "inStock",
    specs: [
      { label: "Scale", value: "1/100" },
      { label: "Height", value: "~18 cm" },
      { label: "Maker", value: "Bandai Spirits" },
    ],
    boxItems: ["Runner nhựa", "Sticker", "Beam Rifle", "Shield", "Beam Saber"],
  },
  {
    sku: "MGEX-STRIKE-FREEDOM",
    slug: "mgex-1-100-strike-freedom",
    categorySlug: "gunpla-kit",
    supplierCode: "BANDAI_OFFICIAL",
    groupCodes: ["PREORDER", "BEST_SELLERS"],
    imageUrl: "/images/products/strike-freedom.jpg",
    images: ["/images/products/strike-freedom.jpg"],
    brand: "Bandai",
    grade: "MGEX",
    scale: "1/100",
    tone: "gold",
    oldPrice: 0,
    status: "preorder",
    specs: [
      { label: "Scale", value: "1/100" },
      { label: "Height", value: "~19 cm" },
      { label: "Material", value: "PS / ABS / Metal color parts" },
    ],
    boxItems: ["Runner nhựa", "Decal", "Beam Rifle", "Wing parts", "Stand connector"],
  },
  {
    sku: "RG-SAZABI-144-BD",
    slug: "rg-1-144-sazabi",
    categorySlug: "gunpla-kit",
    supplierCode: "BANDAI_OFFICIAL",
    groupCodes: ["SALE_PRODUCTS", "BEST_SELLERS"],
    imageUrl: "/images/products/sazabi.jpg",
    images: ["/images/products/sazabi.jpg"],
    brand: "Bandai",
    grade: "RG",
    scale: "1/144",
    tone: "red",
    oldPrice: 1350000,
    status: "sale",
    specs: [
      { label: "Scale", value: "1/144" },
      { label: "Maker", value: "Bandai Spirits" },
    ],
    boxItems: ["Runner nhựa", "Decal", "Beam Rifle", "Shield"],
  },
  {
    sku: "ACTION-BASE-5-CLEAR",
    slug: "action-base-5-clear",
    categorySlug: "accessory-tool",
    supplierCode: "BANDAI_OFFICIAL",
    groupCodes: ["TOOLS", "BEST_SELLERS"],
    imageUrl: "/images/products/action-base-5.jpg",
    images: ["/images/products/action-base-5.jpg"],
    brand: "Bandai",
    grade: "Tools",
    scale: "Accessory",
    tone: "slate",
    oldPrice: 0,
    status: "inStock",
    specs: [{ label: "Type", value: "Display base" }],
    boxItems: ["Base parts", "Connector parts"],
  },
];

async function main() {
  const categoryBySlug = {};
  const supplierByCode = {};
  const groupByCode = {};

  for (const category of categories) {
    const saved = await prisma.productCategory.upsert({
      where: { code: category.code },
      update: category,
      create: category,
    });
    categoryBySlug[saved.slug] = saved;
  }

  for (const supplier of suppliers) {
    const saved = await prisma.supplier.upsert({
      where: { code: supplier.code },
      update: supplier,
      create: supplier,
    });
    supplierByCode[saved.code] = saved;
  }

  for (const group of groups) {
    const saved = await prisma.productGroup.upsert({
      where: { code: group.code },
      update: group,
      create: group,
    });
    groupByCode[saved.code] = saved;
  }

  for (const item of productCatalog) {
    const product = await prisma.product.findUnique({
      where: { sku: item.sku },
    });

    if (!product) {
      console.warn(`Skip ${item.sku}: product does not exist yet. Run npm run seed first.`);
      continue;
    }

    const category = categoryBySlug[item.categorySlug];
    const supplier = supplierByCode[item.supplierCode];

    const updateData = {
      slug: item.slug,
      oldPrice: item.oldPrice,
      status: item.status,
      imageUrl: item.imageUrl,
      brand: item.brand,
      grade: item.grade,
      scale: item.scale,
      tone: item.tone,
      specs: item.specs,
      boxItems: item.boxItems,
      media: {
        card: item.imageUrl,
        home: item.imageUrl,
        detailMain: item.imageUrl,
        gallery: item.images,
        hover: item.imageUrl,
        box: item.imageUrl,
      },
      categoryId: category?.id || null,
      supplierId: supplier?.id || null,
    };

    const saved = await prisma.product.update({
      where: { id: product.id },
      data: updateData,
    });

    await prisma.productImage.deleteMany({
      where: { productId: saved.id },
    });

    await prisma.productImage.createMany({
      data: item.images.map((url, index) => ({
        productId: saved.id,
        url,
        alt: saved.nameVi,
        type: index === 0 ? "primary" : "gallery",
        sortOrder: index,
        active: true,
      })),
    });

    await prisma.productGroupItem.deleteMany({
      where: { productId: saved.id },
    });

    for (const [index, groupCode] of item.groupCodes.entries()) {
      const group = groupByCode[groupCode];
      if (!group) continue;

      await prisma.productGroupItem.create({
        data: {
          productId: saved.id,
          groupId: group.id,
          sortOrder: index,
          featured: index === 0,
        },
      });
    }
  }

  console.log("Catalog seed completed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
