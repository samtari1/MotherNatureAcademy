"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const API_BASE = "";
type Item = { id: number; kind: "photo" | "video"; title: string; caption: string; alt_text: string; url: string };
const imageUrl = (url: string) => url;

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
      <div className="section-label"><span>02</span><span className="label-line"/> A LOOK AROUND</div>
      <h2>Take a <em>virtual tour.</em></h2>
      <div className="video-frame">{videos.map(item => <iframe key={item.id} src={item.url} title={item.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />)}</div>
      {videos.map(item => item.caption && <p className="campus-video-caption" key={`${item.id}-caption`}>{item.caption}</p>)}
    </div></section>}
  </>;
}
