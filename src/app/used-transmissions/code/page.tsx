import type { Metadata } from "next";
import { CodeIndexPage } from "@/components/code-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Used Transmissions by Model",
  alternates: { canonical: "/used-transmissions/code" },
};

export default function Page() {
  return <CodeIndexPage kind="used-transmissions" />;
}
