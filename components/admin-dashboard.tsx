"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { initialContactInfo, type ContactInfo } from "@/components/contact-details";
import { defaultPageCopy, editablePages, type PageCopyMap } from "@/components/page-copy";

const apiUrl = (path: string) => path;
const mediaUrl = (url: string) => url;

type News = { id: number; title: string; summary: string; body: string; published: boolean; updated_at: string };
type Media = { id: number; kind: "photo" | "video"; title: string; caption: string; alt_text: string; url: string; published: boolean; sort_order: number };
type PolicySection = { id: number; title: string; body: string; published: boolean; sort_order: number; slug: string };
type CalendarEvent = { id: number; calendar_id: number; title: string; start_date: string; end_date: string | null; description: string; sort_order: number };
type AcademicCalendar = { id: number; school_year: string; title: string; notes: string; is_current: boolean; published: boolean; events: CalendarEvent[] };
type SiteContent = { hours: string; campus_location: string; tuition_2_days: string; tuition_3_days: string; tuition_5_days: string; registration_fee: string; school_year: string };
type SmtpSettings = { enabled: boolean; smtp_host: string; smtp_port: number; smtp_user: string; smtp_password: string; smtp_from: string; notification_email: string; smtp_starttls: boolean; smtp_password_set: boolean; encryption_key_configured: boolean };
type RegistrationSummary = { id: number; school_year: string; child_name: string; guardian_name: string; created_at: string; notification_sent: boolean };
type RegistrationPageTwo = { medical_conditions: string; medications: string; allergies: { allergen: string; reaction: string }[]; immunizations_up_to_date: string; immunization_explanation: string; other_considerations: string; health_information_consent: boolean; admission_policy_initials: string; payment_terms_acknowledged: boolean };
type RegistrationDetail = RegistrationSummary & { guardian_email: string; child_nickname: string | null; child_age: string; child_date_of_birth: string; lives_with: string; schedule: string; guardian_relationship: string; address: string; city: string; state: string; postal_code: string; home_phone: string | null; cell_phone: string; work_phone: string | null; second_guardian_name: string | null; second_guardian_relationship: string | null; second_guardian_phone: string | null; second_guardian_email: string | null; signature: string; page_two: RegistrationPageTwo; notification_sent_at: string | null };
type AdminTab = "news" | "media" | "policies" | "calendar" | "details" | "email" | "contacts" | "applications" | "pages";

const adminTabRoutes: Record<AdminTab, string> = { news: "news", media: "media", policies: "policies", calendar: "calendar", details: "hours", contacts: "contacts", email: "email", applications: "applications", pages: "pages" };
function adminTabFromPath(pathname: string): AdminTab {
  const section = pathname.split("/").filter(Boolean)[1];
  if (section === "media" || section === "policies" || section === "calendar" || section === "contacts" || section === "email" || section === "applications" || section === "pages") return section;
  if (section === "hours") return "details";
  return "news";
}

const initialContent: SiteContent = { hours: "", campus_location: "", tuition_2_days: "", tuition_3_days: "", tuition_5_days: "", registration_fee: "", school_year: "" };
const initialSmtp: SmtpSettings = { enabled: false, smtp_host: "", smtp_port: 587, smtp_user: "", smtp_password: "", smtp_from: "", notification_email: "", smtp_starttls: true, smtp_password_set: false, encryption_key_configured: false };
const easternDateTime = (value: string) => new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(value));

async function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(apiUrl(path), { ...init, credentials: "include", headers });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.detail || "The request could not be completed.");
  return result;
}

function ApplicationSection({ title, rows }: { title: string; rows: [string, string | null | undefined][] }) {
  return <section className="application-detail-section"><h4>{title}</h4><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "Not provided"}</dd></div>)}</dl></section>;
}

function registrationHealthRows(page: RegistrationPageTwo): [string, string][] {
  const rows: [string, string][] = [["Medical conditions, disabilities, or fears", page.medical_conditions], ["Medications", page.medications]];
  page.allergies.forEach((allergy, index) => {
    rows.push([`Allergy ${index + 1}`, allergy.allergen], [`Reaction ${index + 1}`, allergy.reaction]);
  });
  rows.push(
    ["Immunizations up to date", page.immunizations_up_to_date === "yes" ? "Yes" : page.immunizations_up_to_date === "no" ? "No" : "Not provided"],
    ["Immunization explanation", page.immunization_explanation],
    ["Other considerations", page.other_considerations],
    ["Health information consent", page.health_information_consent ? "Confirmed" : "Not recorded"],
  );
  return rows;
}

export function AdminDashboard() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<AdminTab>(() => adminTabFromPath(pathname));
  const [news, setNews] = useState<News[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationSummary[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationDetail | null>(null);
  const [loadingRegistration, setLoadingRegistration] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(initialContactInfo);
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>(initialSmtp);
  const [policies, setPolicies] = useState<PolicySection[]>([]);
  const [editingPolicyId, setEditingPolicyId] = useState<number | null>(null);
  const [creatingPolicy, setCreatingPolicy] = useState(false);
  const [policyForm, setPolicyForm] = useState({ title: "", body: "", published: false, sort_order: 0 });
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const mediaDialogRef = useRef<HTMLDialogElement | null>(null);
  const [mediaForm, setMediaForm] = useState({ title: "", caption: "", alt_text: "", url: "", published: true, sort_order: 0 });
  const [editingNews, setEditingNews] = useState<number | null>(null);
  const [newsForm, setNewsForm] = useState({ title: "", summary: "", body: "", published: false });
  const [calendars, setCalendars] = useState<AcademicCalendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(null);
  const [creatingCalendar, setCreatingCalendar] = useState(false);
  const [copySourceId, setCopySourceId] = useState<number | null>(null);
  const [calendarForm, setCalendarForm] = useState({ school_year: "", title: "", notes: "", is_current: false, published: false });
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventForm, setEventForm] = useState({ title: "", start_date: "", end_date: "", description: "", sort_order: 0 });
  const [pageCopies, setPageCopies] = useState<PageCopyMap>(defaultPageCopy);
  const [selectedPageSlug, setSelectedPageSlug] = useState("home");

  async function loadAdmin() {
    const [posts, items, details, policySections, schoolCalendars, mailSettings, contactDetails, applications, savedPageCopies] = await Promise.all([
      request("/api/admin/news"), request("/api/admin/media"), request("/api/admin/site-content"), request("/api/admin/policies"), request("/api/admin/calendars"), request("/api/admin/smtp-settings"), request("/api/admin/contact-info"), request("/api/admin/registrations"), request("/api/admin/page-content"),
    ]);
    setNews(posts);
    setRegistrations(applications);
    setMedia(items);
    setContent(details);
    setContactInfo({ ...initialContactInfo, ...contactDetails });
    setSmtpSettings({ ...mailSettings, smtp_password: "" });
    setPolicies(policySections);
    setCalendars(schoolCalendars);
    setPageCopies(Object.fromEntries(Object.entries(defaultPageCopy).map(([slug, fields]) => [slug, { ...fields, ...(savedPageCopies[slug] ?? {}) }])));
    setSelectedCalendarId((current: number | null) => current && schoolCalendars.some((calendar: AcademicCalendar) => calendar.id === current) ? current : schoolCalendars.find((calendar: AcademicCalendar) => calendar.is_current)?.id ?? schoolCalendars[0]?.id ?? null);
  }

  useEffect(() => {
    request("/api/admin/session").then(async () => { setSignedIn(true); await loadAdmin(); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { setTab(adminTabFromPath(pathname)); }, [pathname]);

  function navigateTab(nextTab: AdminTab) {
    setTab(nextTab);
    const target = `/admin/${adminTabRoutes[nextTab]}`;
    if (pathname !== target) router.push(target);
  }

  useEffect(() => {
    const dialog = mediaDialogRef.current;
    if (!dialog) return;
    if (selectedMediaId !== null && !dialog.open) dialog.showModal();
    if (selectedMediaId === null && dialog.open) dialog.close();
  }, [selectedMediaId]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    try {
      await request("/api/admin/login", { method: "POST", body: JSON.stringify({ username, password }) });
      await loadAdmin(); setSignedIn(true); setPassword("");
    } catch (err) { setError(err instanceof Error ? err.message : "Sign-in failed."); }
  }

  async function signOut() {
    try { await request("/api/admin/logout", { method: "POST" }); } catch {}
    setSignedIn(false); setNews([]); setMedia([]); setRegistrations([]); setSelectedRegistration(null); setNotice("You are signed out.");
  }

  async function openRegistration(id: number) {
    setLoadingRegistration(true); setError(""); setSelectedRegistration(null);
    try { setSelectedRegistration(await request(`/api/admin/registrations/${id}`)); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not load the application."); }
    finally { setLoadingRegistration(false); }
  }

  async function refreshRegistrations() {
    try { setRegistrations(await request("/api/admin/registrations")); setNotice("Applications refreshed."); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not refresh applications."); }
  }

  async function removeRegistration(application: RegistrationSummary) {
    if (!window.confirm(`Permanently delete the application for ${application.child_name}? This cannot be undone.`)) return;
    try {
      await request(`/api/admin/registrations/${application.id}`, { method: "DELETE" });
      setRegistrations(current => current.filter(item => item.id !== application.id));
      setSelectedRegistration(null);
      setNotice("Application deleted.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not delete the application."); }
  }

  async function saveNews(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    try {
      const path = editingNews ? `/api/admin/news/${editingNews}` : "/api/admin/news";
      await request(path, { method: editingNews ? "PUT" : "POST", body: JSON.stringify(newsForm) });
      setNewsForm({ title: "", summary: "", body: "", published: false }); setEditingNews(null);
      await loadAdmin(); setNotice("News post saved.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save the post."); }
  }

  async function removeNews(id: number) {
    if (!window.confirm("Delete this news post?")) return;
    try { await request(`/api/admin/news/${id}`, { method: "DELETE" }); await loadAdmin(); setNotice("News post deleted."); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete the post."); }
  }

  async function uploadPhoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try { await request("/api/admin/media/photos", { method: "POST", body: form }); formElement.reset(); await loadAdmin(); setNotice("Photo uploaded."); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not upload the photo."); }
  }

  async function addVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const data = Object.fromEntries(form.entries());
    try { await request("/api/admin/media/videos", { method: "POST", body: JSON.stringify({ ...data, sort_order: Number(data.sort_order || 0), published: true }) }); formElement.reset(); await loadAdmin(); setNotice("Video added."); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not add the video."); }
  }

  async function toggleMedia(item: Media) {
    try { await request(`/api/admin/media/${item.id}`, { method: "PATCH", body: JSON.stringify({ ...item, published: !item.published }) }); await loadAdmin(); if (selectedMediaId === item.id) setMediaForm({ ...mediaForm, published: !item.published }); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update media."); }
  }

  function editMedia(item: Media) {
    setSelectedMediaId(item.id);
    setMediaForm({ title: item.title, caption: item.caption, alt_text: item.alt_text, url: item.url, published: item.published, sort_order: item.sort_order });
    setError(""); setNotice("");
  }

  async function saveMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedMediaId === null) return;
    setError(""); setNotice("");
    try {
      const saved = await request(`/api/admin/media/${selectedMediaId}`, { method: "PATCH", body: JSON.stringify(mediaForm) });
      await loadAdmin();
      editMedia(saved);
      setNotice("Media details saved.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save media details."); }
  }

  async function removeMedia(item: Media) {
    if (!window.confirm(`Delete “${item.title}” from the website?`)) return;
    try { await request(`/api/admin/media/${item.id}`, { method: "DELETE" }); await loadAdmin(); setNotice("Media removed."); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not remove media."); }
  }

  async function saveSiteContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    try { const saved = await request("/api/admin/site-content", { method: "PUT", body: JSON.stringify(content) }); setContent(saved); setNotice("Site details updated."); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update site details."); }
  }

  async function savePageCopy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    try {
      const saved = await request(`/api/admin/page-content/${selectedPageSlug}`, { method: "PUT", body: JSON.stringify({ content: pageCopies[selectedPageSlug] }) });
      setPageCopies(current => ({ ...current, [selectedPageSlug]: { ...current[selectedPageSlug], ...saved.content } }));
      setNotice(`${editablePages.find(page => page.slug === selectedPageSlug)?.label ?? "Page"} content saved and published.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save page content."); }
  }

  async function saveSmtpSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    try {
      const saved = await request("/api/admin/smtp-settings", { method: "PUT", body: JSON.stringify(smtpSettings) });
      setSmtpSettings({ ...saved, smtp_password: "" });
      setNotice("Email settings saved. Inquiry and registration notifications use these settings.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save email settings."); }
  }

  async function saveContactInfo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    try {
      const saved = await request("/api/admin/contact-info", { method: "PUT", body: JSON.stringify(contactInfo) });
      setContactInfo({ ...initialContactInfo, ...saved });
      setNotice("Contact information saved. Public contact details update as visitors load the site.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save contact information."); }
  }

  function editPolicy(section: PolicySection) {
    setEditingPolicyId(section.id); setCreatingPolicy(false);
    setPolicyForm({ title: section.title, body: section.body, published: section.published, sort_order: section.sort_order });
    setError(""); setNotice("");
  }

  async function savePolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    try {
      const path = creatingPolicy ? "/api/admin/policies" : `/api/admin/policies/${editingPolicyId}`;
      const saved = await request(path, { method: creatingPolicy ? "POST" : "PUT", body: JSON.stringify(policyForm) });
      await loadAdmin(); editPolicy(saved); setNotice("Policy section saved.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save the policy section."); }
  }

  async function removePolicy(section: PolicySection) {
    if (!window.confirm(`Delete “${section.title}” from the family policies?`)) return;
    try {
      await request(`/api/admin/policies/${section.id}`, { method: "DELETE" });
      if (editingPolicyId === section.id) { setEditingPolicyId(null); setPolicyForm({ title: "", body: "", published: false, sort_order: 0 }); }
      await loadAdmin(); setNotice("Policy section deleted.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not delete the policy section."); }
  }

  function editCalendar(calendar: AcademicCalendar) {
    setCreatingCalendar(false); setSelectedCalendarId(calendar.id);
    setCalendarForm({ school_year: calendar.school_year, title: calendar.title, notes: calendar.notes, is_current: calendar.is_current, published: calendar.published });
    setEditingEventId(null); setEventForm({ title: "", start_date: "", end_date: "", description: "", sort_order: calendar.events.length * 10 + 10 });
  }

  function startNewCalendar() {
    setCreatingCalendar(true); setSelectedCalendarId(null);
    const source = calendars.find(calendar => calendar.is_current) ?? calendars[0];
    setCopySourceId(source?.id ?? null);
    setCalendarForm({ school_year: "", title: "", notes: source?.notes ?? "", is_current: false, published: false });
    setEditingEventId(null); setEventForm({ title: "", start_date: "", end_date: "", description: "", sort_order: 10 });
  }

  async function saveCalendar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    try {
      const path = creatingCalendar ? "/api/admin/calendars" : `/api/admin/calendars/${selectedCalendarId}`;
      const payload = creatingCalendar ? { ...calendarForm, copy_from_id: copySourceId } : calendarForm;
      const saved = await request(path, { method: creatingCalendar ? "POST" : "PUT", body: JSON.stringify(payload) });
      await loadAdmin(); setCreatingCalendar(false); setSelectedCalendarId(saved.id); setCalendarForm({ school_year: saved.school_year, title: saved.title, notes: saved.notes, is_current: saved.is_current, published: saved.published });
      setCopySourceId(null);
      setNotice(creatingCalendar && copySourceId !== null ? `Calendar copied with ${saved.events.length} dates. Review the shifted dates before publishing.` : "Academic calendar saved.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save the calendar."); }
  }

  function editCalendarEvent(event: CalendarEvent) {
    setEditingEventId(event.id); setEventForm({ title: event.title, start_date: event.start_date, end_date: event.end_date ?? "", description: event.description, sort_order: event.sort_order });
  }

  async function saveCalendarEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    if (selectedCalendarId === null) return;
    try {
      const payload = { ...eventForm, end_date: eventForm.end_date || null };
      const path = editingEventId ? `/api/admin/calendar-events/${editingEventId}` : `/api/admin/calendars/${selectedCalendarId}/events`;
      await request(path, { method: editingEventId ? "PUT" : "POST", body: JSON.stringify(payload) });
      setEditingEventId(null); setEventForm({ title: "", start_date: "", end_date: "", description: "", sort_order: (calendars.find(calendar => calendar.id === selectedCalendarId)?.events.length ?? 0) * 10 + 10 });
      await loadAdmin(); setNotice("Calendar date saved.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save the date."); }
  }

  async function removeCalendarEvent(event: CalendarEvent) {
    if (!window.confirm(`Delete “${event.title}” from this calendar?`)) return;
    try { await request(`/api/admin/calendar-events/${event.id}`, { method: "DELETE" }); await loadAdmin(); setNotice("Calendar date deleted."); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete the date."); }
  }

  async function removeCalendar(calendar: AcademicCalendar) {
    if (!window.confirm(`Delete ${calendar.school_year} and all its dates? This cannot be undone.`)) return;
    try {
      await request(`/api/admin/calendars/${calendar.id}`, { method: "DELETE" });
      if (selectedCalendarId === calendar.id) { setSelectedCalendarId(null); setCalendarForm({ school_year: "", title: "", notes: "", is_current: false, published: false }); }
      await loadAdmin(); setNotice("Calendar deleted.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not delete the calendar."); }
  }

  if (loading) return <section className="admin-shell"><div className="admin-panel"><p>Loading admin…</p></div></section>;
  if (!signedIn) return <section className="admin-shell"><div className="admin-login"><span className="eyebrow"><span/> PRIVATE AREA</span><h1>Academy admin</h1><p>Sign in to update the website.</p>
    <form onSubmit={signIn} className="admin-form"><label>Username<input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /></label><button className="button">Sign in <span>↗</span></button></form>
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
  </div></section>;

  return <section className="admin-shell"><div className="admin-panel">
    <div className="admin-heading"><div><span className="eyebrow"><span/> WEBSITE CONTENT</span><h1>Academy admin</h1><p>Updates publish to the public website as soon as you save them.</p></div><button className="admin-secondary" onClick={signOut}>Sign out</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
    <nav className="admin-tabs" aria-label="Admin sections"><button type="button" className={tab === "news" ? "active" : ""} aria-current={tab === "news" ? "page" : undefined} onClick={() => navigateTab("news")}>News</button><button type="button" className={tab === "media" ? "active" : ""} aria-current={tab === "media" ? "page" : undefined} onClick={() => navigateTab("media")}>Photos & videos</button><button type="button" className={tab === "policies" ? "active" : ""} aria-current={tab === "policies" ? "page" : undefined} onClick={() => navigateTab("policies")}>Policies</button><button type="button" className={tab === "calendar" ? "active" : ""} aria-current={tab === "calendar" ? "page" : undefined} onClick={() => navigateTab("calendar")}>Calendar</button><button type="button" className={tab === "pages" ? "active" : ""} aria-current={tab === "pages" ? "page" : undefined} onClick={() => navigateTab("pages")}>Pages</button><button type="button" className={tab === "details" ? "active" : ""} aria-current={tab === "details" ? "page" : undefined} onClick={() => navigateTab("details")}>Hours & tuition</button><button type="button" className={tab === "contacts" ? "active" : ""} aria-current={tab === "contacts" ? "page" : undefined} onClick={() => navigateTab("contacts")}>Contacts</button><button type="button" className={tab === "applications" ? "active" : ""} aria-current={tab === "applications" ? "page" : undefined} onClick={() => navigateTab("applications")}>Applications</button><button type="button" className={tab === "email" ? "active" : ""} aria-current={tab === "email" ? "page" : undefined} onClick={() => navigateTab("email")}>Email</button></nav>

    {tab === "pages" && <div className="admin-details"><div><h2>Edit page copy</h2><p>Choose a page, edit its headings and main text, then save to publish the changes. A line break in headline fields separates the regular line from the emphasized final line.</p>
      <form className="admin-form" onSubmit={savePageCopy}>
        <label>Website page<select value={selectedPageSlug} onChange={event => setSelectedPageSlug(event.target.value)}>{editablePages.map(page => <option key={page.slug} value={page.slug}>{page.label}</option>)}</select></label>
        {editablePages.find(page => page.slug === selectedPageSlug)?.fields.map(field => <label key={field.key}>{field.label}{field.multiline ? <textarea rows={4} maxLength={20000} value={pageCopies[selectedPageSlug]?.[field.key] ?? ""} onChange={event => setPageCopies(current => ({ ...current, [selectedPageSlug]: { ...current[selectedPageSlug], [field.key]: event.target.value } }))} /> : <input maxLength={20000} value={pageCopies[selectedPageSlug]?.[field.key] ?? ""} onChange={event => setPageCopies(current => ({ ...current, [selectedPageSlug]: { ...current[selectedPageSlug], [field.key]: event.target.value } }))} />}</label>)}
        <div className="admin-actions"><button className="button">Save page content</button><a className="admin-secondary" href={selectedPageSlug === "home" ? "/" : `/${selectedPageSlug}`} target="_blank" rel="noreferrer">Preview published page</a></div>
      </form>
    </div><aside><strong>Layout and tools stay protected.</strong><p>This editor controls the page headings and copy. Registration forms, maps, calendars, contact data, photos, and policy lists keep their dedicated admin editors.</p></aside></div>}

    {tab === "applications" && <div className="applications-admin">
      <div className="admin-policy-heading"><div><h2>Registration applications</h2><p>Private family information is visible only to signed-in administrators. Showing the 200 most recent applications.</p></div><button type="button" className="admin-secondary" onClick={refreshRegistrations}>Refresh</button></div>
      <div className="applications-admin-grid"><div className="applications-list" aria-label="Registration applications">
        {registrations.length === 0 ? <p>No applications have been submitted yet.</p> : registrations.map(application => <button type="button" className={`application-select${selectedRegistration?.id === application.id ? " selected" : ""}`} key={application.id} onClick={() => openRegistration(application.id)}>
          <strong>{application.child_name}</strong><span>{application.guardian_name} · {application.school_year}</span><small>{easternDateTime(application.created_at)} · Email {application.notification_sent ? "sent" : "not sent"}</small>
        </button>)}
      </div>
      <div className="application-detail" aria-live="polite">
        {loadingRegistration && <p>Loading application…</p>}
        {!loadingRegistration && !selectedRegistration && <p>Select an application to view its details.</p>}
        {selectedRegistration && <>
          <div className="application-detail-heading"><div><span className="eyebrow"><span/> APPLICATION #{selectedRegistration.id}</span><h3>{selectedRegistration.child_name}</h3><p>School year {selectedRegistration.school_year} · Submitted {easternDateTime(selectedRegistration.created_at)}</p></div><div className="admin-actions"><button type="button" className="admin-secondary" onClick={() => setSelectedRegistration(null)}>Close</button><button type="button" className="admin-danger" onClick={() => removeRegistration(selectedRegistration)}>Delete application</button></div></div>
          <ApplicationSection title="Child & schedule" rows={[["Nickname", selectedRegistration.child_nickname], ["Age", selectedRegistration.child_age], ["Date of birth", selectedRegistration.child_date_of_birth], ["Lives with", selectedRegistration.lives_with], ["Schedule", selectedRegistration.schedule.replaceAll("_", " ")]]} />
          <ApplicationSection title="Responsible party" rows={[["Name", selectedRegistration.guardian_name], ["Relationship", selectedRegistration.guardian_relationship], ["Address", `${selectedRegistration.address}, ${selectedRegistration.city}, ${selectedRegistration.state} ${selectedRegistration.postal_code}`], ["Cell phone", selectedRegistration.cell_phone], ["Home phone", selectedRegistration.home_phone], ["Work phone", selectedRegistration.work_phone], ["Email", selectedRegistration.guardian_email]]} />
          <ApplicationSection title="Second responsible party" rows={[["Name", selectedRegistration.second_guardian_name], ["Relationship", selectedRegistration.second_guardian_relationship], ["Phone", selectedRegistration.second_guardian_phone], ["Email", selectedRegistration.second_guardian_email]]} />
          <ApplicationSection title="Page 2 · Health information" rows={registrationHealthRows(selectedRegistration.page_two)} />
          <ApplicationSection title="Page 2 · Agreements" rows={[["Enrollment terms initials", selectedRegistration.page_two.admission_policy_initials], ["Monthly tuition draft terms", selectedRegistration.page_two.payment_terms_acknowledged ? "Accepted" : "Not recorded"]]} />
          <ApplicationSection title="Submission" rows={[["Typed signature", selectedRegistration.signature], ["Email notification", selectedRegistration.notification_sent_at ? `Sent ${easternDateTime(selectedRegistration.notification_sent_at)}` : "Not sent or not recorded"]]} />
        </>}
      </div></div>
    </div>}

    {tab === "news" && <div className="admin-content-grid"><div><h2>{editingNews ? "Edit news post" : "Write a news post"}</h2><form className="admin-form" onSubmit={saveNews}>
      <label>Title<input value={newsForm.title} onChange={e => setNewsForm({ ...newsForm, title: e.target.value })} maxLength={180} required /></label>
      <label>Short introduction<textarea rows={2} value={newsForm.summary} onChange={e => setNewsForm({ ...newsForm, summary: e.target.value })} maxLength={500} /></label>
      <label>Post<textarea rows={10} value={newsForm.body} onChange={e => setNewsForm({ ...newsForm, body: e.target.value })} maxLength={20000} required /></label>
      <label className="admin-check"><input type="checkbox" checked={newsForm.published} onChange={e => setNewsForm({ ...newsForm, published: e.target.checked })} /> Publish now</label>
      <div className="admin-actions"><button className="button">{editingNews ? "Save changes" : "Save post"}</button>{editingNews && <button type="button" className="admin-secondary" onClick={() => { setEditingNews(null); setNewsForm({ title: "", summary: "", body: "", published: false }); }}>Cancel edit</button>}</div>
    </form></div><div><h2>News posts</h2>{news.length === 0 ? <p>No posts yet.</p> : <div className="admin-list">{news.map(post => <article key={post.id}><div><strong>{post.title}</strong><small>{post.published ? "Published" : "Draft"} · Updated {new Date(post.updated_at).toLocaleDateString()}</small></div><div className="admin-actions"><button className="admin-secondary" onClick={() => { setEditingNews(post.id); setNewsForm({ title: post.title, summary: post.summary, body: post.body, published: post.published }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button><button className="admin-danger" onClick={() => removeNews(post.id)}>Delete</button></div></article>)}</div>}</div></div>}

    {tab === "media" && <div className="admin-media-layout"><div><h2>Add a photo</h2><p>JPG, PNG, or WebP · up to 8 MB. Use images you have permission to publish.</p><form className="admin-form" onSubmit={uploadPhoto}>
      <label>Image file<input type="file" name="file" accept="image/jpeg,image/png,image/webp" required /></label><label>Title<input name="title" maxLength={180} required /></label><label>Caption<input name="caption" maxLength={500} /></label><label>Alternative text<input name="alt_text" maxLength={300} required /></label><button className="button">Upload photo</button>
    </form><h2 className="admin-subhead">Add a YouTube video</h2><form className="admin-form" onSubmit={addVideo}><label>Title<input name="title" required maxLength={180} /></label><label>Video link<input name="url" type="url" placeholder="https://youtu.be/…" required /></label><label>Caption<input name="caption" maxLength={500} /></label><label>Display order<input name="sort_order" type="number" defaultValue="0" min="0" max="10000" /></label><button className="button">Add video</button></form></div>
      <div><h2>Website media</h2><p>Select a photo or video to preview and edit its details.</p>
        <div className="admin-media-list-scroll" role="region" aria-label="Website media list" tabIndex={0}><div className="admin-list">{media.map(item => <article className={selectedMediaId === item.id ? "selected" : ""} key={item.id}><button type="button" className="admin-media-select" onClick={() => editMedia(item)}><span className="admin-media-row">{item.kind === "photo" ? <img src={mediaUrl(item.url)} alt=""/> : <span className="admin-video-icon">▶</span>}<span><strong>{item.title}</strong><small>{item.kind} · {item.published ? "Visible on site" : "Hidden"}</small><small>{item.caption}</small></span></span></button><div className="admin-actions"><button type="button" className="admin-secondary" onClick={() => toggleMedia(item)}>{item.published ? "Hide" : "Publish"}</button><button type="button" className="admin-danger" onClick={() => removeMedia(item)}>Delete</button></div></article>)}</div></div>
      </div></div>}

    <dialog className="media-editor-dialog" ref={mediaDialogRef} onClose={() => setSelectedMediaId(null)}>
      {selectedMediaId !== null && (() => { const selected = media.find(item => item.id === selectedMediaId); if (!selected) return null; return <div className="media-editor">
        <div className="media-editor-heading"><div><span className="eyebrow"><span/> EDIT WEBSITE MEDIA</span><h2>{selected.title}</h2></div><button type="button" className="admin-secondary" onClick={() => setSelectedMediaId(null)}>Close</button></div>
        <div className="media-editor-body"><div className="media-preview">{selected.kind === "photo" ? <img src={mediaUrl(selected.url)} alt={mediaForm.alt_text || selected.title} /> : <iframe src={selected.url} title={mediaForm.title || selected.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />}</div>
          <form className="admin-form" onSubmit={saveMedia}>
            <label>Title<input value={mediaForm.title} onChange={event => setMediaForm({ ...mediaForm, title: event.target.value })} required maxLength={180} /></label>
            {selected.kind === "video" && <label>YouTube video link<input type="url" value={mediaForm.url} onChange={event => setMediaForm({ ...mediaForm, url: event.target.value })} required maxLength={500} /></label>}
            <label>Caption<textarea rows={3} value={mediaForm.caption} onChange={event => setMediaForm({ ...mediaForm, caption: event.target.value })} maxLength={500} /></label>
            {selected.kind === "photo" && <label>Alternative text<input value={mediaForm.alt_text} onChange={event => setMediaForm({ ...mediaForm, alt_text: event.target.value })} maxLength={300} /></label>}
            <label>Display order<input type="number" min="0" max="10000" value={mediaForm.sort_order} onChange={event => setMediaForm({ ...mediaForm, sort_order: Number(event.target.value) })} /></label>
            <label className="admin-check"><input type="checkbox" checked={mediaForm.published} onChange={event => setMediaForm({ ...mediaForm, published: event.target.checked })} /> Visible on website</label>
            <div className="admin-actions"><button className="button">Save changes</button></div>
          </form>
        </div>
      </div>; })()}
    </dialog>

    {tab === "policies" && <div className="admin-content-grid policy-admin"><div>
      <div className="admin-policy-heading"><div><h2>{creatingPolicy ? "Add a policy section" : editingPolicyId ? "Edit policy section" : "Select a section"}</h2><p>Plain text is shown on the public Policies page. Review family-facing instructions before publishing.</p></div><button type="button" className="admin-secondary" onClick={() => { setCreatingPolicy(true); setEditingPolicyId(null); setPolicyForm({ title: "", body: "", published: false, sort_order: policies.length * 10 + 10 }); }}>Add section</button></div>
      {(creatingPolicy || editingPolicyId !== null) && <form className="admin-form" onSubmit={savePolicy}>
        <label>Section title<input value={policyForm.title} onChange={event => setPolicyForm({ ...policyForm, title: event.target.value })} required maxLength={180} /></label>
        <label>Policy text<textarea rows={12} value={policyForm.body} onChange={event => setPolicyForm({ ...policyForm, body: event.target.value })} required maxLength={20000} /></label>
        <label>Display order<input type="number" min="0" max="10000" value={policyForm.sort_order} onChange={event => setPolicyForm({ ...policyForm, sort_order: Number(event.target.value) })} /></label>
        <label className="admin-check"><input type="checkbox" checked={policyForm.published} onChange={event => setPolicyForm({ ...policyForm, published: event.target.checked })} /> Publish on website</label>
        <div className="admin-actions"><button className="button">Save section</button><button type="button" className="admin-secondary" onClick={() => { setCreatingPolicy(false); setEditingPolicyId(null); }}>Cancel</button></div>
      </form>}
    </div><div><h2>Policy sections</h2><p>Published sections appear on the public Policies page.</p><div className="admin-list">{policies.map(section => <article key={section.id}><div><strong>{section.title}</strong><small>{section.published ? "Published" : "Draft"} · Order {section.sort_order}</small></div><div className="admin-actions"><button type="button" className="admin-secondary" onClick={() => editPolicy(section)}>Edit</button><button type="button" className="admin-danger" onClick={() => removePolicy(section)}>Delete</button></div></article>)}</div></div></div>}

    {tab === "calendar" && <div className="calendar-admin-layout"><div>
      <div className="admin-policy-heading"><div><h2>{creatingCalendar ? "Create a school year" : selectedCalendarId ? "Edit school calendar" : "Choose a school year"}</h2><p>Published calendars appear to families. Mark one as current; past years can stay published as archives.</p></div><button type="button" className="admin-secondary" onClick={startNewCalendar}>Add school year</button></div>
      {(creatingCalendar || selectedCalendarId !== null) && <form className="admin-form" onSubmit={saveCalendar}>
        {creatingCalendar && <label>Copy dates from<select value={copySourceId ?? ""} onChange={event => { const value = event.target.value ? Number(event.target.value) : null; setCopySourceId(value); const source = calendars.find(calendar => calendar.id === value); setCalendarForm(form => ({ ...form, notes: source?.notes ?? "" })); }}><option value="">Start with a blank calendar</option>{calendars.map(calendar => <option key={calendar.id} value={calendar.id}>{calendar.school_year}{calendar.is_current ? " · Current" : " · Archive"}</option>)}</select></label>}
        <label>School year<input value={calendarForm.school_year} onChange={event => { const schoolYear = event.target.value; setCalendarForm(form => ({ ...form, school_year: schoolYear, title: !form.title || form.title === `${form.school_year} Academic Calendar` ? `${schoolYear} Academic Calendar` : form.title })); }} placeholder="2027–2028" maxLength={40} required /></label>
        <label>Calendar title<input value={calendarForm.title} onChange={event => setCalendarForm({ ...calendarForm, title: event.target.value })} placeholder="2027–2028 Academic Calendar" maxLength={180} required /></label>
        <label>Notes for families<textarea rows={3} value={calendarForm.notes} onChange={event => setCalendarForm({ ...calendarForm, notes: event.target.value })} maxLength={5000} /></label>
        <label className="admin-check"><input type="checkbox" checked={calendarForm.is_current} onChange={event => setCalendarForm({ ...calendarForm, is_current: event.target.checked })} /> This is the current school year</label>
        <label className="admin-check"><input type="checkbox" checked={calendarForm.published} onChange={event => setCalendarForm({ ...calendarForm, published: event.target.checked })} /> Visible on the public calendar</label>
        {creatingCalendar && copySourceId !== null && <p className="calendar-copy-hint">Dates will shift by the difference in school-year start years. Review every date before publishing.</p>}
        <div className="admin-actions"><button className="button">{creatingCalendar && copySourceId !== null ? "Create copied calendar" : "Save calendar"}</button>{creatingCalendar && <button type="button" className="admin-secondary" onClick={() => { setCreatingCalendar(false); setCopySourceId(null); }}>Cancel</button>}</div>
      </form>}
      {selectedCalendarId !== null && !creatingCalendar && <>
        <h3 className="admin-subhead">{editingEventId ? "Edit date" : "Add a date"}</h3>
        <form className="admin-form" onSubmit={saveCalendarEvent}>
          <label>Event name<input value={eventForm.title} onChange={event => setEventForm({ ...eventForm, title: event.target.value })} maxLength={180} required /></label>
          <div className="calendar-date-fields"><label>Start date<input type="date" value={eventForm.start_date} onChange={event => setEventForm({ ...eventForm, start_date: event.target.value })} required /></label><label>End date (optional)<input type="date" value={eventForm.end_date} onChange={event => setEventForm({ ...eventForm, end_date: event.target.value })} /></label></div>
          <label>Details<input value={eventForm.description} onChange={event => setEventForm({ ...eventForm, description: event.target.value })} maxLength={500} /></label>
          <div className="admin-actions"><button className="button">{editingEventId ? "Save date" : "Add date"}</button>{editingEventId && <button type="button" className="admin-secondary" onClick={() => { setEditingEventId(null); setEventForm({ title: "", start_date: "", end_date: "", description: "", sort_order: 0 }); }}>Cancel edit</button>}</div>
        </form>
      </>}
    </div><div><h2>School year calendars</h2><p>Choose a year to edit. Only published years are available on the public page.</p><div className="admin-list">{calendars.map(calendar => <article className={selectedCalendarId === calendar.id ? "selected" : ""} key={calendar.id}><div><strong>{calendar.title}</strong><small>{calendar.is_current ? "Current" : "Archive"} · {calendar.published ? "Published" : "Draft"} · {calendar.events.length} dates</small></div><div className="admin-actions"><button type="button" className="admin-secondary" onClick={() => editCalendar(calendar)}>Edit</button><button type="button" className="admin-danger" onClick={() => removeCalendar(calendar)}>Delete</button></div></article>)}</div>
      {selectedCalendarId !== null && <><h3 className="admin-subhead">Dates in {calendars.find(calendar => calendar.id === selectedCalendarId)?.school_year}</h3>{(calendars.find(calendar => calendar.id === selectedCalendarId)?.events ?? []).length === 0 ? <p>No dates have been added.</p> : <div className="admin-list">{calendars.find(calendar => calendar.id === selectedCalendarId)?.events.map(item => <article key={item.id}><div><strong>{item.title}</strong><small>{item.start_date}{item.end_date && item.end_date !== item.start_date ? ` – ${item.end_date}` : ""}{item.description ? ` · ${item.description}` : ""}</small></div><div className="admin-actions"><button type="button" className="admin-secondary" onClick={() => editCalendarEvent(item)}>Edit</button><button type="button" className="admin-danger" onClick={() => removeCalendarEvent(item)}>Delete</button></div></article>)}</div>}</>}
    </div></div>}

    {tab === "details" && <div className="admin-details"><div><h2>Hours, tuition & school year</h2><p>These details appear on the Hours & Tuition page and the home page.</p><form className="admin-form" onSubmit={saveSiteContent}>
      <label>School year<input value={content.school_year} onChange={e => setContent({ ...content, school_year: e.target.value })} required maxLength={40} /></label>
      <label>Hours<input value={content.hours} onChange={e => setContent({ ...content, hours: e.target.value })} required maxLength={180} /></label>
      <label>Campus location<input value={content.campus_location} onChange={e => setContent({ ...content, campus_location: e.target.value })} required maxLength={180} /></label>
      <div className="admin-rate-grid"><label>2-day tuition<input value={content.tuition_2_days} onChange={e => setContent({ ...content, tuition_2_days: e.target.value })} required /></label><label>3-day tuition<input value={content.tuition_3_days} onChange={e => setContent({ ...content, tuition_3_days: e.target.value })} required /></label><label>5-day tuition<input value={content.tuition_5_days} onChange={e => setContent({ ...content, tuition_5_days: e.target.value })} required /></label><label>Registration fee<input value={content.registration_fee} onChange={e => setContent({ ...content, registration_fee: e.target.value })} required /></label></div>
      <button className="button">Save site details</button>
    </form></div><aside><strong>Content goes live when saved.</strong><p>Please confirm tuition, fees, enrollment dates, and availability before publishing changes. Registration applications are stored separately from website content.</p></aside></div>}

    {tab === "email" && <div className="admin-details"><div><h2>SMTP email settings</h2><p>These settings send website inquiries and registration applications to the notification address.</p><form className="admin-form" onSubmit={saveSmtpSettings}>
      <label className="admin-check"><input type="checkbox" checked={smtpSettings.enabled} onChange={e => setSmtpSettings({ ...smtpSettings, enabled: e.target.checked })} /> Send website email notifications</label>
      <label>SMTP server<input value={smtpSettings.smtp_host} onChange={e => setSmtpSettings({ ...smtpSettings, smtp_host: e.target.value })} autoComplete="url" required maxLength={255} /></label>
      <div className="admin-rate-grid"><label>SMTP port<input type="number" value={smtpSettings.smtp_port} onChange={e => setSmtpSettings({ ...smtpSettings, smtp_port: Number(e.target.value) })} min="1" max="65535" required /></label><label>SMTP username<input value={smtpSettings.smtp_user} onChange={e => setSmtpSettings({ ...smtpSettings, smtp_user: e.target.value })} autoComplete="username" required maxLength={254} /></label></div>
      <label>SMTP password<input type="password" value={smtpSettings.smtp_password} onChange={e => setSmtpSettings({ ...smtpSettings, smtp_password: e.target.value })} autoComplete="new-password" placeholder={smtpSettings.smtp_password_set ? "********" : "Enter the mailbox password"} /></label>
      <p className="smtp-password-status">{smtpSettings.smtp_password_set ? "Password saved. Leave this field blank to keep it, or enter a new password to replace it." : "No SMTP password is configured yet."}</p>
      <label>From address<input type="email" value={smtpSettings.smtp_from} onChange={e => setSmtpSettings({ ...smtpSettings, smtp_from: e.target.value })} autoComplete="email" required maxLength={254} /></label>
      <label>Notification recipient<input type="email" value={smtpSettings.notification_email} onChange={e => setSmtpSettings({ ...smtpSettings, notification_email: e.target.value })} autoComplete="email" required maxLength={254} /></label>
      <label className="admin-check"><input type="checkbox" checked={smtpSettings.smtp_starttls} onChange={e => setSmtpSettings({ ...smtpSettings, smtp_starttls: e.target.checked })} /> Use STARTTLS (usually port 587)</label>
      <p className="smtp-password-status">Port 465 uses implicit SSL/TLS automatically. Leave STARTTLS off for port 465. Your SMTP password is encrypted before it is stored and is never displayed here.</p>
      {!smtpSettings.encryption_key_configured && <p className="form-error">The server still needs SMTP_CONFIG_ENCRYPTION_KEY in backend/.env before a new password can be saved. Existing environment-based mail settings will continue to work.</p>}
      <button className="button">Save email settings</button>
    </form></div><aside><strong>Mailbox setup</strong><p>Use the SMTP server, port, username, and password provided by your email host. “From address” should generally be the authenticated mailbox; the notification recipient can be a different address. Saving these settings applies to both family inquiries and registration applications.</p></aside></div>}

    {tab === "contacts" && <div className="admin-details"><div><h2>Contact details</h2><p>These details appear on the Contact page, site footer, registration page, and saved-application follow-up message.</p><form className="admin-form" onSubmit={saveContactInfo}>
      <label>Business name<input value={contactInfo.business_name} onChange={e => setContactInfo({ ...contactInfo, business_name: e.target.value })} required maxLength={180} /></label>
      <h3 className="admin-subhead">Physical address</h3>
      <label>Street address<input value={contactInfo.physical_street} onChange={e => setContactInfo({ ...contactInfo, physical_street: e.target.value })} required maxLength={200} /></label>
      <div className="admin-rate-grid"><label>City<input value={contactInfo.physical_city} onChange={e => setContactInfo({ ...contactInfo, physical_city: e.target.value })} required maxLength={100} /></label><label>State<input value={contactInfo.physical_state} onChange={e => setContactInfo({ ...contactInfo, physical_state: e.target.value })} required maxLength={80} /></label><label>Postal code<input value={contactInfo.physical_postal_code} onChange={e => setContactInfo({ ...contactInfo, physical_postal_code: e.target.value })} required maxLength={20} /></label></div>
      <h3 className="admin-subhead">Mailing address</h3>
      <label>Street or PO box<input value={contactInfo.mailing_street} onChange={e => setContactInfo({ ...contactInfo, mailing_street: e.target.value })} required maxLength={200} /></label>
      <div className="admin-rate-grid"><label>City<input value={contactInfo.mailing_city} onChange={e => setContactInfo({ ...contactInfo, mailing_city: e.target.value })} required maxLength={100} /></label><label>State<input value={contactInfo.mailing_state} onChange={e => setContactInfo({ ...contactInfo, mailing_state: e.target.value })} required maxLength={80} /></label><label>Postal code<input value={contactInfo.mailing_postal_code} onChange={e => setContactInfo({ ...contactInfo, mailing_postal_code: e.target.value })} required maxLength={20} /></label></div>
      {[1, 2].map(index => <div className="admin-contact-educator" key={index}><h3 className="admin-subhead">Educator {index}</h3>
        <label>Full name<input value={contactInfo[`educator_${index}_name` as keyof ContactInfo] as string} onChange={e => setContactInfo({ ...contactInfo, [`educator_${index}_name`]: e.target.value })} required maxLength={120} /></label>
        <div className="admin-rate-grid"><label>Title or name used on site<input value={contactInfo[`educator_${index}_title` as keyof ContactInfo] as string} onChange={e => setContactInfo({ ...contactInfo, [`educator_${index}_title`]: e.target.value })} maxLength={80} /></label><label>Phone<input type="tel" value={contactInfo[`educator_${index}_phone` as keyof ContactInfo] as string} onChange={e => setContactInfo({ ...contactInfo, [`educator_${index}_phone`]: e.target.value })} required maxLength={40} /></label></div>
        <label>Email<input type="email" value={contactInfo[`educator_${index}_email` as keyof ContactInfo] as string} onChange={e => setContactInfo({ ...contactInfo, [`educator_${index}_email`]: e.target.value })} required maxLength={254} /></label>
      </div>)}
      <button className="button">Save contact details</button>
    </form></div><aside><strong>One place to update the public contacts.</strong><p>Changes update the site-wide footer and the contact and registration pages. A new email address here updates public contact links and follow-up instructions; the SMTP sender and recipient remain separately controlled in the Email tab.</p></aside></div>}
  </div></section>;
}
