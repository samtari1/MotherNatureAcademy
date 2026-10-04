"use client";

import { useEffect, useState } from "react";

const API_BASE = "";
type Post = { id: number; title: string; summary: string; body: string; created_at: string };

export function PublicNews() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fetch(`${API_BASE}/api/news`)
      .then(response => response.ok ? response.json() : [])
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoaded(true));
  }, []);

  return <section className="news-section"><div className="container">
    <div className="section-label"><span>01</span><span className="label-line"/> FROM THE ACADEMY</div>
    <h2>News & <em>notes.</em></h2>
    {!loaded ? <p className="news-empty">Loading academy updates…</p> : posts.length === 0 ? <p className="news-empty">There are no current updates. Please check back soon.</p> :
      <div className="news-grid">{posts.map(post => <article className="news-card" key={post.id}>
        <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</time>
        <h3>{post.title}</h3>{post.summary && <p className="news-summary">{post.summary}</p>}
        <div className="news-body">{post.body}</div>
      </article>)}</div>}
  </div></section>;
}
