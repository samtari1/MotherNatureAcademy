import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { CalendarContent } from "@/components/calendar-content";
import { PageBlocks } from "@/components/page-copy";

export const metadata: Metadata = { title: "Academic Calendar" };

export default function CalendarPage() {
  return <><PageIntro page="calendar" eyebrow="ACADEMIC CALENDAR" title="A year of little\nmilestones." intro="See important dates, breaks, and program days for the current school year. Past calendars remain available for reference."/><CalendarContent /><PageBlocks page="calendar" /></>;
}
