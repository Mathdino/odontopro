-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "workingDays" TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']::TEXT[];
