import { CatalogPage, catalogMetadata } from "@/components/catalog-page";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ make: string; model: string }> };

export async function generateMetadata({ params }: P) {
  return catalogMetadata("used-engines", await params);
}

export default async function Page({ params }: P) {
  return <CatalogPage kind="used-engines" params={await params} />;
}
