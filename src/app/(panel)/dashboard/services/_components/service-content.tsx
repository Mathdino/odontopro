import { getAllServices } from "../_data-access/get-all-services";
import { ServicesList } from "./services-list";


interface ServicesContentProps{
  userId : string;
} 



export default async function ServiceContent({ userId }: ServicesContentProps) {

  const services = await getAllServices({ userId: userId });


  return (
      <ServicesList services={services.data || []} />
  )
}

