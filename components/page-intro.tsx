import Link from "next/link";
import { PageCopy, PageCopyTitle } from "@/components/page-copy";

export function PageIntro({ page, eyebrow, title, intro }: { page: string; eyebrow: string; title: string; intro: string }) {
  return <section className="page-intro"><div className="container"><div className="eyebrow"><span /><PageCopy page={page} field="intro_eyebrow" fallback={eyebrow} /></div><h1><PageCopyTitle page={page} fallback={title} /></h1><p><PageCopy page={page} field="intro_text" fallback={intro} /></p><Link className="text-link" href="/register">Ask us about joining <span>↗</span></Link></div></section>;
}
