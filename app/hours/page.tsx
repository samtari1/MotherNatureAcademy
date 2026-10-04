import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { HoursContent } from "@/components/hours-content";
export const metadata: Metadata = { title: "Hours & Tuition" };
export default function HoursPage(){return <><PageIntro eyebrow="HOURS & TUITION" title={<>A good morning,<br/><em>at your own rhythm.</em></>} intro="A few practical details to help you picture how Mother Nature Academy could fit into your family’s week."/><HoursContent /></>}
