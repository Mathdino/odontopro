-- AlterTable
ALTER TABLE "public"."Appointment" ADD COLUMN     "professionalId" TEXT;

-- AlterTable
ALTER TABLE "public"."Professional" ADD COLUMN     "specialty" TEXT NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "public"."Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
