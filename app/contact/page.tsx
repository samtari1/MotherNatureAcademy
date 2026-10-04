import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { ContactCards } from "@/components/contact-details";
export const metadata: Metadata = { title: "Contact" };
export default function ContactPage(){return <><PageIntro eyebrow="GET IN TOUCH" title={<>We’d love to<br/><em>hear from you.</em></>} intro="Questions about the program, tuition, or visiting the campus? Reach out and we’ll help you find the information you need."/><section className="section-pad contact-section"><div className="container contact-layout"><div className="contact-main"><div className="section-label"><span>01</span><span className="label-line"/> CONTACT THE ACADEMY</div><h2>Let’s start<br/><em>a conversation.</em></h2><p className="lead">The campus is located on a private farm. Visits are arranged by appointment, so please get in touch before stopping by.</p><Link className="button" href="/register">Send an inquiry <span>↗</span></Link></div><ContactCards /></div></section></>}
