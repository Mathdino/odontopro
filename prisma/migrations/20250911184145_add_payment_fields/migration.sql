-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CASH', 'PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER');

-- AlterTable
ALTER TABLE "public"."Appointment" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" "public"."PaymentMethod",
ADD COLUMN     "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING';
