/*
  Warnings:

  - You are about to drop the column `totalDuration` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the `AppointmentService` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `serviceId` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."AppointmentService" DROP CONSTRAINT "AppointmentService_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AppointmentService" DROP CONSTRAINT "AppointmentService_serviceId_fkey";

-- AlterTable
ALTER TABLE "public"."Appointment" DROP COLUMN "totalDuration",
DROP COLUMN "totalPrice",
ADD COLUMN     "serviceId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."AppointmentService";

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
