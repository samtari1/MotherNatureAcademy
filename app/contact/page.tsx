import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { ContactCards } from "@/components/contact-details";
import { PageBlocks, PageCopy, PageCopyTitle } from "@/components/page-copy";
export const metadata: Metadata = { title: "Contact" };
export default function ContactPage(){return <><PageIntro page="contact" eyebrow="GET IN TOUCH" title="We’d love to\nhear from you." intro="Questions about the program, tuition, or visiting the campus? Reach out and we’ll help you find the information you need."/><section className="section-pad contact-section"><div className="container contact-layout"><div className="contact-main"><div className="section-label"><span>01</span><span className="label-line"/> CONTACT THE ACADEMY</div><h2><PageCopyTitle page="contact" field="section_title" fallback="Let’s start\na conversation." /></h2><p className="lead"><PageCopy page="contact" field="section_body" /></p><Link className="button" href="/register">Send an inquiry <span>↗</span></Link></div><ContactCards /></div></section><PageBlocks page="contact" /></>}
