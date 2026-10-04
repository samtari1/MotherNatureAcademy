"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const mapPlaces = [
  { title: "Indoor classroom (proposed)", description: "An indoor learning space shown as proposed on the original drawing.", x: 45, y: 45 },
  { title: "Berry garden", description: "A place to watch plants grow and notice the seasons.", x: 3.5, y: 88 },
  { title: "Loose-parts bin", description: "Open-ended materials for building, sorting, and making.", x: 48.5, y: 51 },
  { title: "Mud kitchen", description: "A space for mixing, pouring, and imaginative outdoor play.", x: 51.8, y: 38.5 },
  { title: "Owl’s library", description: "Books and a quiet corner for stories and discovery.", x: 55.6, y: 41.5 },
  { title: "Chicken coop", description: "A place to observe and learn about caring for animals.", x: 57.2, y: 28 },
  { title: "Large-block building center", description: "Blocks and building materials for big ideas and teamwork.", x: 58.4, y: 40.5 },
  { title: "Dramatic-play area", description: "A place for children to invent stories and play together.", x: 46.5, y: 34 },
  { title: "Solar-panel pavilion", description: "A covered space for math, art, and hands-on activities.", x: 58.7, y: 46 },
  { title: "Sand and water play", description: "A place to scoop, pour, and experiment.", x: 64, y: 52 },
  { title: "Music wall", description: "Outdoor instruments and sounds to explore.", x: 61.5, y: 44 },
  { title: "Educator’s home", description: "Shown as a landmark on the original illustration; this is a private residence, not a student activity area.", x: 57, y: 57 },
] as const;

export function CampusMap() {
  const [activePlace, setActivePlace] = useState<number | null>(null);
  const placeRefs = useRef<Array<HTMLDetailsElement | null>>([]);

  function focusPlace(index: number) {
    const place = placeRefs.current[index];
    if (place) {
      place.open = true;
      place.querySelector("summary")?.focus();
    }
  }

  return <section className="campus-map-section"><div className="container">
    <div className="section-label"><span>01</span><span className="label-line"/> A HAND-DRAWN LOOK AROUND</div>
    <h2>A little map of <em>our place.</em></h2>
    <p className="campus-map-intro">This hand-drawn campus illustration comes from the academy’s earlier website. Some features or labels may have changed, so use it as a glimpse of campus rather than a walking map.</p>
    <div className="campus-map-layout">
      <figure className="campus-map-figure"><div className="campus-map-image-wrap"><a href="/images/campus-map.jpg" target="_blank" rel="noreferrer" aria-label="Open the full-size hand-drawn campus map in a new tab"><Image src="/images/campus-map.jpg" alt="Hand-drawn map of Mother Nature Academy showing the classrooms, gardens, pond, outdoor learning areas, trails, and pavilion." width={3060} height={1980} sizes="(max-width: 900px) 100vw, 68vw" priority={false} /></a>
        {mapPlaces.map((place, index) => <button key={place.title} type="button" className={`campus-map-marker${activePlace === index ? " active" : ""}`} style={{ left: `${place.x}%`, top: `${place.y}%` }} onMouseEnter={() => setActivePlace(index)} onMouseLeave={() => setActivePlace(null)} onFocus={() => setActivePlace(index)} onBlur={() => setActivePlace(null)} onClick={() => focusPlace(index)} aria-label={`Highlight ${place.title} in the campus key`} title={place.title}>{index + 1}</button>)}
      </div><figcaption>Hover over a numbered place to highlight it. Tap or click the map to open the full-size drawing.</figcaption></figure>
      <aside className="campus-map-key"><h3>Campus places</h3><p>Hover or focus a place to find it on the map.</p><div className="campus-map-places">{mapPlaces.map((place, index) => <details key={place.title} ref={element => { placeRefs.current[index] = element; }} onMouseEnter={() => setActivePlace(index)} onMouseLeave={() => setActivePlace(null)} onFocus={() => setActivePlace(index)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setActivePlace(null); }}><summary className={activePlace === index ? "active" : ""}><span>{String(index + 1).padStart(2, "0")}</span>{place.title}</summary><p>{place.description}</p></details>)}</div></aside>
    </div>
  </div></section>;
}
