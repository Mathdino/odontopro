import { notFound } from "next/navigation";
import { getClinicInfo } from "../_data-access/get-info-schedule";
import { ReviewsContent } from "./_components/reviews-content";

interface ReviewsPageProps {
  params: {
    id: string;
  };
}

export default async function ReviewsPage({ params }: ReviewsPageProps) {
  const clinic = await getClinicInfo(params.id);

  if (!clinic) {
    notFound();
  }

  return <ReviewsContent clinic={clinic} />;
}