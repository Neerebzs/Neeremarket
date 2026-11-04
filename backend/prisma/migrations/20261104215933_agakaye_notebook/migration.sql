-- CreateEnum
CREATE TYPE "AgakayeKind" AS ENUM ('MONEY', 'ITEM');

-- CreateEnum
CREATE TYPE "AgakayeStatus" AS ENUM ('OUTSTANDING', 'RETURNED');

-- CreateTable
CREATE TABLE "agakaye_entries" (
    "id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "borrower_name" TEXT NOT NULL,
    "borrower_phone" TEXT,
    "kind" "AgakayeKind" NOT NULL,
    "item_name" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "amount" BIGINT,
    "lent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMP(3),
    "status" "AgakayeStatus" NOT NULL DEFAULT 'OUTSTANDING',
    "returned_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agakaye_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agakaye_entries_seller_id_status_due_at_idx" ON "agakaye_entries"("seller_id", "status", "due_at");

-- AddForeignKey
ALTER TABLE "agakaye_entries" ADD CONSTRAINT "agakaye_entries_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
