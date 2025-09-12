-- AlterTable
ALTER TABLE "public"."Appointment" ADD COLUMN     "totalDuration" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPrice" INTEGER NOT NULL DEFAULT 0;

-- Update existing appointments to set default values based on their service
UPDATE "public"."Appointment" 
SET "totalDuration" = (
    SELECT "duration" 
    FROM "public"."Service" 
    WHERE "Service"."id" = "Appointment"."serviceId"
), 
"totalPrice" = (
    SELECT "price" 
    FROM "public"."Service" 
    WHERE "Service"."id" = "Appointment"."serviceId"
)
WHERE "totalDuration" = 0 AND "totalPrice" = 0;

-- CreateTable
CREATE TABLE "public"."AppointmentService" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentService_pkey" PRIMARY KEY ("id")
);

-- Populate AppointmentService table with existing data
INSERT INTO "public"."AppointmentService" ("id", "appointmentId", "serviceId", "createdAt")
SELECT gen_random_uuid(), "id", "serviceId", "createdAt"
FROM "public"."Appointment";

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentService_appointmentId_serviceId_key" ON "public"."AppointmentService"("appointmentId", "serviceId");

-- AddForeignKey
ALTER TABLE "public"."AppointmentService" ADD CONSTRAINT "AppointmentService_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AppointmentService" ADD CONSTRAINT "AppointmentService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;