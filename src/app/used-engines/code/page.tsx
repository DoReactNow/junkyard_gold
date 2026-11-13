import type { Metadata } from "next";
import { CodeIndexPage } from "@/components/code-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Used Engines by GM Engine Code",
  alternates: { canonical: "/used-engines/code" },
};

export default function Page() {
  return <CodeIndexPage kind="used-engines" />;
}
