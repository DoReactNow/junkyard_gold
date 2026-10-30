import { CatalogPage, catalogMetadata } from "@/components/catalog-page";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ make: string }> };

export async function generateMetadata({ params }: P) {
  return catalogMetadata("used-transmissions", await params);
}

export default async function Page({ params }: P) {
  return <CatalogPage kind="used-transmissions" params={await params} />;
}
