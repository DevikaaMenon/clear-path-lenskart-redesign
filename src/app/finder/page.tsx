import type { Metadata } from "next";
import { FrameFinder } from "@/components/finder/FrameFinder";

export const metadata: Metadata = { title: "Find my frame" };

export default function FinderPage() {
  return <FrameFinder />;
}
