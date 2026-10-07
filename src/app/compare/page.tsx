import type { Metadata } from "next";
import { CompareView } from "@/components/compare/CompareView";

export const metadata: Metadata = { title: "Compare frames" };

export default function ComparePage() {
  return <CompareView />;
}
