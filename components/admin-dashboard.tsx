"use client";

import { FormEvent, useEffect, useState } from "react";

const apiUrl = (path: string) => path;
const mediaUrl = (url: string) => url;

type News = { id: number; title: string; summary: string; body: string; published: boolean; updated_at: string };
type Media = { id: number; kind: "photo" | "video"; title: string; caption: string; alt_text: string; url: string; published: boolean; sort_order: number };
type SiteContent = { hours: string; campus_location: string; tuition_2_days: string; tuition_3_days: string; tuition_5_days: string; registration_fee: string; school_year: string };

const initialContent: SiteContent = { hours: "", campus_location: "", tuition_2_days: "", tuition_3_days: "", tuition_5_days: "", registration_fee: "", school_year: "" };

async function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(apiUrl(path), { ...init, credentials: "include", headers });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.detail || "The request could not be completed.");
  return result;
}

export function AdminDashboard() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<"news" | "media" | "details">("news");
  const [news, setNews] = useState<News[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [mediaForm, setMediaForm] = useState({ title: "", caption: "", alt_text: "", url: "", published: true, sort_order: 0 });
  const [editingNews, setEditingNews] = useState<number | null>(null);
  const [newsForm, setNewsForm] = useState({ title: "", summary: "", body: "", published: false });

  async function loadAdmin() {
    const [posts, items, details] = await Promise.all([
      request("/api/admin/news"), request("/api/admin/media"), request("/api/admin/site-content"),
    ]);
    setNews(posts);
    setMedia(items);
    setContent(details);
  }

  useEffect(() => {
    request("/api/admin/session").then(async () => { setSignedIn(true); await loadAdmin(); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    try {
      await request("/api/admin/login", { method: "POST", body: JSON.stringify({ username, password }) });
      await loadAdmin(); setSignedIn(true); setPassword("");
    } catch (err) { setError(err instanceof Error ? err.message : "Sign-in failed."); }
  }

  async function signOut() {
    try { await request("/api/admin/logout", { method: "POST" }); } catch {}
    setSignedIn(false); setNews([]); setMedia([]); setNotice("You are signed out.");
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

  if (loading) return <section className="admin-shell"><div className="admin-panel"><p>Loading admin…</p></div></section>;
  if (!signedIn) return <section className="admin-shell"><div className="admin-login"><span className="eyebrow"><span/> PRIVATE AREA</span><h1>Academy admin</h1><p>Sign in to update the website.</p>
    <form onSubmit={signIn} className="admin-form"><label>Username<input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /></label><button className="button">Sign in <span>↗</span></button></form>
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
  </div></section>;

  return <section className="admin-shell"><div className="admin-panel">
    <div className="admin-heading"><div><span className="eyebrow"><span/> WEBSITE CONTENT</span><h1>Academy admin</h1><p>Updates publish to the public website as soon as you save them.</p></div><button className="admin-secondary" onClick={signOut}>Sign out</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-success" role="status">{notice}</p>}
    <div className="admin-tabs" role="tablist"><button className={tab === "news" ? "active" : ""} onClick={() => setTab("news")}>News</button><button className={tab === "media" ? "active" : ""} onClick={() => setTab("media")}>Photos & videos</button><button className={tab === "details" ? "active" : ""} onClick={() => setTab("details")}>Hours & tuition</button></div>

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
        {selectedMediaId !== null && (() => { const selected = media.find(item => item.id === selectedMediaId); if (!selected) return null; return <div className="media-editor">
          <div className="media-preview">{selected.kind === "photo" ? <img src={mediaUrl(selected.url)} alt={mediaForm.alt_text || selected.title} /> : <iframe src={selected.url} title={mediaForm.title || selected.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />}</div>
          <form className="admin-form" onSubmit={saveMedia}>
            <h3>Edit {selected.kind}</h3>
            <label>Title<input value={mediaForm.title} onChange={event => setMediaForm({ ...mediaForm, title: event.target.value })} required maxLength={180} /></label>
            {selected.kind === "video" && <label>YouTube video link<input type="url" value={mediaForm.url} onChange={event => setMediaForm({ ...mediaForm, url: event.target.value })} required maxLength={500} /></label>}
            <label>Caption<textarea rows={3} value={mediaForm.caption} onChange={event => setMediaForm({ ...mediaForm, caption: event.target.value })} maxLength={500} /></label>
            {selected.kind === "photo" && <label>Alternative text<input value={mediaForm.alt_text} onChange={event => setMediaForm({ ...mediaForm, alt_text: event.target.value })} maxLength={300} /></label>}
            <label>Display order<input type="number" min="0" max="10000" value={mediaForm.sort_order} onChange={event => setMediaForm({ ...mediaForm, sort_order: Number(event.target.value) })} /></label>
            <label className="admin-check"><input type="checkbox" checked={mediaForm.published} onChange={event => setMediaForm({ ...mediaForm, published: event.target.checked })} /> Visible on website</label>
            <div className="admin-actions"><button className="button">Save changes</button><button type="button" className="admin-secondary" onClick={() => setSelectedMediaId(null)}>Close</button></div>
          </form>
        </div>; })()}
        <div className="admin-list">{media.map(item => <article className={selectedMediaId === item.id ? "selected" : ""} key={item.id}><button type="button" className="admin-media-select" onClick={() => editMedia(item)}><span className="admin-media-row">{item.kind === "photo" ? <img src={mediaUrl(item.url)} alt=""/> : <span className="admin-video-icon">▶</span>}<span><strong>{item.title}</strong><small>{item.kind} · {item.published ? "Visible on site" : "Hidden"}</small><small>{item.caption}</small></span></span></button><div className="admin-actions"><button type="button" className="admin-secondary" onClick={() => toggleMedia(item)}>{item.published ? "Hide" : "Publish"}</button><button type="button" className="admin-danger" onClick={() => removeMedia(item)}>Delete</button></div></article>)}</div>
      </div></div>}

    {tab === "details" && <div className="admin-details"><div><h2>Hours, tuition & school year</h2><p>These details appear on the Hours & Tuition page and the home page.</p><form className="admin-form" onSubmit={saveSiteContent}>
      <label>School year<input value={content.school_year} onChange={e => setContent({ ...content, school_year: e.target.value })} required maxLength={40} /></label>
      <label>Hours<input value={content.hours} onChange={e => setContent({ ...content, hours: e.target.value })} required maxLength={180} /></label>
      <label>Campus location<input value={content.campus_location} onChange={e => setContent({ ...content, campus_location: e.target.value })} required maxLength={180} /></label>
      <div className="admin-rate-grid"><label>2-day tuition<input value={content.tuition_2_days} onChange={e => setContent({ ...content, tuition_2_days: e.target.value })} required /></label><label>3-day tuition<input value={content.tuition_3_days} onChange={e => setContent({ ...content, tuition_3_days: e.target.value })} required /></label><label>5-day tuition<input value={content.tuition_5_days} onChange={e => setContent({ ...content, tuition_5_days: e.target.value })} required /></label><label>Registration fee<input value={content.registration_fee} onChange={e => setContent({ ...content, registration_fee: e.target.value })} required /></label></div>
      <button className="button">Save site details</button>
    </form></div><aside><strong>Content goes live when saved.</strong><p>Please confirm tuition, fees, enrollment dates, and availability before publishing changes. Registration applications are stored separately from website content.</p></aside></div>}
  </div></section>;
}
