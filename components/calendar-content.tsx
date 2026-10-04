"use client";

import { useEffect, useMemo, useState } from "react";

type CalendarEvent = { id: number; title: string; start_date: string; end_date: string | null; description: string };
type AcademicCalendar = { id: number; school_year: string; title: string; notes: string; is_current: boolean; events: CalendarEvent[] };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function formatRange(event: CalendarEvent) {
  const start = formatDate(event.start_date);
  if (!event.end_date || event.end_date === event.start_date) return start;
  const end = formatDate(event.end_date);
  if (event.start_date.slice(0, 4) === event.end_date.slice(0, 4)) {
    const startDate = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${event.start_date}T00:00:00Z`));
    return `${startDate} – ${end}`;
  }
  return `${start} – ${end}`;
}

export function CalendarContent() {
  const [calendars, setCalendars] = useState<AcademicCalendar[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/calendars").then(response => {
      if (!response.ok) throw new Error("Calendar unavailable");
      return response.json();
    }).then((data: AcademicCalendar[]) => {
      setCalendars(data);
      const current = data.find(calendar => calendar.is_current) ?? data[0];
      setSelectedId(current?.id ?? null);
    }).catch(() => setFailed(true)).finally(() => setLoading(false));
  }, []);

  const selected = useMemo(() => calendars.find(calendar => calendar.id === selectedId) ?? null, [calendars, selectedId]);

  return <section className="calendar-section"><div className="container">
    <div className="calendar-toolbar"><div><span className="eyebrow"><span/> SCHOOL YEAR</span><h2>{selected?.title ?? "Academic calendar"}</h2></div>
      {calendars.length > 1 && <label className="calendar-select">View a school year<select value={selectedId ?? ""} onChange={event => setSelectedId(Number(event.target.value))}>{calendars.map(calendar => <option key={calendar.id} value={calendar.id}>{calendar.school_year}{calendar.is_current ? " · Current" : " · Archive"}</option>)}</select></label>}
    </div>
    {loading ? <p className="calendar-status">Loading calendar…</p> : failed ? <p className="calendar-status" role="alert">The calendar could not be loaded. Please try again later or contact the academy.</p> : !selected ? <p className="calendar-status">The current school calendar is being prepared. Please contact the academy for dates.</p> : <>
      {selected.notes && <p className="calendar-notes">{selected.notes}</p>}
      {selected.events.length === 0 ? <p className="calendar-status">Dates for this school year will be posted soon.</p> : <div className="calendar-events">{selected.events.map(event => <article className="calendar-event" key={event.id}><time>{formatRange(event)}</time><div><h3>{event.title}</h3>{event.description && <p>{event.description}</p>}</div></article>)}</div>}
      {!selected.is_current && <p className="calendar-archive-note">You’re viewing a past school year’s calendar.</p>}
    </>}
    <p className="calendar-contact">Dates may change. Please contact the academy if you need to confirm a school closure or schedule.</p>
  </div></section>;
}
