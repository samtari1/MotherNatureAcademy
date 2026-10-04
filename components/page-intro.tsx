import Link from "next/link";
import type { ReactNode } from "react";

export function PageIntro({ eyebrow, title, intro }: { eyebrow: string; title: ReactNode; intro: string }) {
  return <section className="page-intro"><div className="container"><div className="eyebrow"><span />{eyebrow}</div><h1>{title}</h1><p>{intro}</p><Link className="text-link" href="/register">Ask us about joining <span>↗</span></Link></div></section>;
}
