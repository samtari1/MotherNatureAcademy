"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const API_BASE = "";
type Item = { id: number; kind: "photo" | "video"; title: string; caption: string; alt_text: string; url: string };
const imageUrl = (url: string) => url;
const watchUrl = (url: string) => {
  try {
    const id = new URL(url).pathname.split("/").filter(Boolean).at(-1);
    return id ? `https://www.youtube.com/watch?v=${encodeURIComponent(id)}` : url;
  } catch { return url; }
};

export function CampusMedia() {
  const [photos, setPhotos] = useState<Item[]>([]);
  const [videos, setVideos] = useState<Item[]>([]);
  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE.replace(/\/+$/, "")}/api/media?kind=photo`).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE.replace(/\/+$/, "")}/api/media?kind=video`).then(r => r.ok ? r.json() : []),
    ]).then(([photoItems, videoItems]) => {
      setPhotos(Array.isArray(photoItems) ? photoItems : []);
      setVideos(Array.isArray(videoItems) ? videoItems : []);
    }).catch(() => {});
  }, []);

  return <>
    <section className="campus-gallery"><div className="container">
      <div className="section-label"><span>01</span><span className="label-line"/> LIFE ON THE FARM</div>
      <h2>Little corners of <em>campus.</em></h2>
      {photos.length > 0 ? <div className="campus-gallery-grid">{photos.map(item =>
        <figure key={item.id}><div><Image src={item.url} alt={item.alt_text || item.title} fill sizes="(max-width: 720px) 100vw, 50vw" unoptimized={item.url.startsWith("/media/")} /></div><figcaption>{item.caption || item.title}</figcaption></figure>
      )}</div> : <p>Campus photos will be available soon.</p>}
    </div></section>
    {videos.length > 0 && <section className="campus-video"><div className="container">
      <div className="section-label"><span>02</span><span className="label-line"/> WATCH & LEARN</div>
      <h2>Outdoor learning, <em>on screen.</em></h2>
      <p className="campus-video-intro">Take a look around Mother Nature Academy and explore perspectives from other nature-based preschool programs.</p>
      <div className="campus-video-grid">{videos.map(item => <article className="campus-video-card" key={item.id}>
        <div className="video-frame"><iframe src={item.url} title={item.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>
        <h3>{item.title}</h3>{item.caption && <p>{item.caption}</p>}
        <a href={watchUrl(item.url)} target="_blank" rel="noreferrer">Watch on YouTube <span aria-hidden="true">↗</span></a>
      </article>)}</div>
    </div></section>}
  </>;
}
