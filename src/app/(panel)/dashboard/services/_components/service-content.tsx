import { getAllServices } from "../_data-access/get-all-services";
import { ServicesList } from "./services-list";
import { CategoryList } from "./category-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ServicesContentProps {
  userId: string;
}

export default async function ServiceContent({ userId }: ServicesContentProps) {
  const services = await getAllServices({ userId: userId });

  return (
    <Tabs defaultValue="services" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="services">Serviços</TabsTrigger>
        <TabsTrigger value="categories">Categorias</TabsTrigger>
      </TabsList>
      <TabsContent value="services" className="mt-6">
        <ServicesList services={services.data || []} userId={userId} />
      </TabsContent>
      <TabsContent value="categories" className="mt-6">
        <CategoryList userId={userId} />
      </TabsContent>
    </Tabs>
  );
}
