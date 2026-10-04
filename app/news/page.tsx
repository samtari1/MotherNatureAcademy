import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { PublicNews } from "@/components/public-news";

export const metadata: Metadata = { title: "News & Notes" };

export default function NewsPage() {
  return <><PageIntro eyebrow="FROM THE ACADEMY" title={<>A few things<br/><em>growing here.</em></>} intro="News, reminders, and little moments from Mother Nature Academy." /><PublicNews /></>;
}
