import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";

export const metadata: Metadata = {
  title: "Academy Admin",
  robots: { index: false, follow: false },
};

const sections = new Set(["news", "media", "policies", "calendar", "hours", "contacts", "email"]);

export default function AdminSectionPage({ params }: { params: { section: string } }) {
  if (!sections.has(params.section)) notFound();
  return <main><AdminDashboard /></main>;
}
