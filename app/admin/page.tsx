import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin-dashboard";

export const metadata: Metadata = {
  title: "Academy Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <main><AdminDashboard /></main>;
}
