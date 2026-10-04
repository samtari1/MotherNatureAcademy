import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Academy Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  redirect("/admin/news");
}
