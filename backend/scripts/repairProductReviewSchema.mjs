import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");

const productReviewModel = `
model ProductReview {
  id               String    @id @default(cuid())
  productId        String
  userId           String?
  orderNo          String?
  customerName     String
  customerEmail    String?
  rating           Int
  title            String?
  content          String
  images           Json?
  status           String    @default("PENDING")
  verifiedPurchase Boolean   @default(false)
  helpfulCount     Int       @default(0)
  adminReply       String?
  moderatedById    String?
  moderatedAt      DateTime?

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  user    User?   @relation(fields: [userId], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  order     Order?   @relation(fields: [orderId], references: [id])
  orderId   String?

  @@index([productId, status, createdAt])
  @@index([userId, createdAt])
  @@index([status, createdAt])
}
`;

const schema = fs.readFileSync(schemaPath, "utf8");

if (schema.includes("model ProductReview")) {
  console.log("ProductReview model already exists. No change needed.");
  process.exit(0);
}

const marker = "\nmodel Voucher {";

if (!schema.includes(marker)) {
  console.error("Cannot find insertion marker: model Voucher.");
  process.exit(1);
}

const nextSchema = schema.replace(marker, `${productReviewModel}${marker}`);
fs.writeFileSync(schemaPath, nextSchema);
console.log("Inserted ProductReview model into prisma/schema.prisma.");
