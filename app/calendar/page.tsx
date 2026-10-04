import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { CalendarContent } from "@/components/calendar-content";

export const metadata: Metadata = { title: "Academic Calendar" };

export default function CalendarPage() {
  return <><PageIntro eyebrow="ACADEMIC CALENDAR" title={<>A year of little<br/><em>milestones.</em></>} intro="See important dates, breaks, and program days for the current school year. Past calendars remain available for reference."/><CalendarContent /></>;
}
