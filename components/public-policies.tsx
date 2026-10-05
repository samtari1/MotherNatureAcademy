"use client";

import { useEffect, useState } from "react";

type PolicySection = { id: number; title: string; body: string; sort_order: number };

export function PublicPolicies() {
  const [sections, setSections] = useState<PolicySection[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fetch("/api/policies")
      .then(response => response.ok ? response.json() : [])
      .then(data => setSections(Array.isArray(data) ? data : []))
      .catch(() => setSections([]))
      .finally(() => setLoaded(true));
  }, []);

  return <section className="policy-section"><div className="container">
    <div className="policy-tools"><p>These summaries are a starting point for families. Please confirm current details and individual plans directly with the academy.</p><button className="button policy-print" type="button" onClick={() => window.print()}>Print / save as PDF <span aria-hidden="true">↗</span></button></div>
    {!loaded ? <p>Loading family policies…</p> : sections.length === 0 ? <p>Policy information is being updated. Please contact the academy for current guidance.</p> :
      <div className="policy-grid">{sections.map((section, index) => <article className="policy-card" key={section.id}>
        <span className="policy-number">{String(index + 1).padStart(2, "0")}</span><h2>{section.title}</h2><p>{section.body}</p>
      </article>)}</div>}
    <aside className="policy-note"><strong>Health information & enrollment forms</strong><p>The registration application includes an encrypted section for relevant child health details. Those details are available only in the signed-in admin area and are not sent by email. Emergency plans, medication procedures, and pickup authorizations should still be discussed directly with the educators.</p></aside>
  </div></section>;
}
