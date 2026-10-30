import { CatalogPage, catalogMetadata } from "@/components/catalog-page";

export const dynamic = "force-dynamic";

export const generateMetadata = () => catalogMetadata("used-transmissions", {});

export default function Page() {
  return <CatalogPage kind="used-transmissions" params={{}} />;
}
