import Link from "next/link";
import Image from "next/image";
import { FooterContactInfo, FooterCopyright } from "@/components/contact-details";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Link className="brand brand-light" href="/"><span className="brand-logo"><Image src="/images/mna-logo.png" alt="" width={56} height={56} /></span><span className="brand-text"><strong>Mother Nature</strong><small>ACADEMY</small></span></Link>
          <p>A little more room to grow.<br />Outdoor learning for curious young minds.</p>
        </div>
        <div className="footer-contact">
          <h3>Come say hello</h3>
          <FooterContactInfo />
        </div>
        <div className="footer-links">
          <h3>Explore</h3>
          <Link href="/program">Our approach</Link><Link href="/curriculum">Curriculum</Link><Link href="/hours">Hours & tuition</Link><Link href="/calendar">Academic calendar</Link><Link href="/policies">Policies & handbook</Link><Link href="/news">News & notes</Link><Link href="/register">Registration inquiry</Link><Link href="/admin">Academy admin</Link>
        </div>
      </div>
      <div className="footer-bottom"><FooterCopyright /><span>Made for little explorers and the people who love them.</span></div>
    </footer>
  );
}
