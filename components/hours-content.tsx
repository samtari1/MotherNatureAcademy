"use client";

import Link from "next/link";
import { CalendarDays, Clock3, CircleDollarSign } from "lucide-react";
import { useSiteDetails } from "@/components/public-site-details";

export function HoursContent() {
  const details = useSiteDetails();
  const schedules = [
    ["2 days", "Tuesday & Thursday", details.tuition_2_days, "per month"],
    ["3 days", "Monday, Wednesday & Friday", details.tuition_3_days, "per month"],
    ["5 days", "Monday through Friday", details.tuition_5_days, "per month"],
  ];
  return <section className="section-pad hours-section"><div className="container hours-layout">
    <div className="hours-side"><div className="info-card"><span><Clock3/></span><div className="eyebrow">OUR HOURS</div><h2>{details.hours}</h2><p>Morning sessions take place outdoors at our {details.campus_location} campus.</p></div><div className="info-card muted-card"><span><CalendarDays/></span><div className="eyebrow">ACADEMIC CALENDAR</div><h3>{details.school_year} school year</h3><p>Calendar dates and enrollment availability can change from year to year.</p></div></div>
    <div className="tuition-side"><div className="section-label"><span>01</span><span className="label-line"/> SCHEDULES & MONTHLY TUITION</div><h2>Choose a week<br/>that <em>works for you.</em></h2><p className="tuition-intro">The published tuition options are shown below. Please contact us to confirm current rates and availability before enrolling.</p><div className="tuition-list">{schedules.map(([days, dates, price, unit]) => <article key={days}><div><span className="schedule-days">{days} per week</span><p>{dates}</p></div><div className="schedule-price"><strong>{price}</strong><small>{unit}</small></div></article>)}</div><div className="registration-fee"><CircleDollarSign size={19}/><p><strong>Annual registration fee: {details.registration_fee}</strong><br/>Published as non-refundable. Confirm current fee and terms with the academy.</p></div><Link className="button" href="/register">Ask about enrollment <span>↗</span></Link><p className="fine-print">An inquiry does not reserve a place. Enrollment is confirmed directly by the academy.</p></div>
  </div></section>;
}
