import { CodePage, codeMetadata } from "@/components/code-page";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: P) {
  return codeMetadata("used-transmissions", (await params).code);
}

export default async function Page({ params }: P) {
  return <CodePage kind="used-transmissions" code={(await params).code} />;
}
