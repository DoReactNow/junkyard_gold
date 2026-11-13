import { CodePage, codeMetadata } from "@/components/code-page";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: P) {
  return codeMetadata("used-engines", (await params).code);
}

export default async function Page({ params }: P) {
  return <CodePage kind="used-engines" code={(await params).code} />;
}
