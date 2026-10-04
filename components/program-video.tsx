"use client";

import { useEffect, useState } from "react";

type Video = { id: number; title: string; caption: string; url: string };

export function ProgramVideo() {
  const [video, setVideo] = useState<Video | null>(null);
  useEffect(() => {
    fetch("/api/media?kind=video")
      .then(response => response.ok ? response.json() : [])
      .then(items => {
        if (Array.isArray(items)) setVideo(items.find((item: Video) => item.url.includes("ptkID2k091I")) ?? null);
      })
      .catch(() => {});
  }, []);

  if (!video) return null;
  return <section className="program-video-section"><div className="container program-video-layout">
    <div><span className="eyebrow"><span/> A FOREST SCHOOL PERSPECTIVE</span><h2>Learning from<br/><em>the wider world.</em></h2>
      <p>The original program page shared this introduction to forest-school learning. It offers a look at the child-led outdoor education approach that helped inspire the academy.</p>
      {video.caption && <p className="program-video-caption">{video.caption}</p>}
    </div>
    <div className="video-frame"><iframe src={video.url} title={video.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>
  </div></section>;
}
