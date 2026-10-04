import Link from "next/link";
import { Sprout, MapPin, Phone, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Link className="brand brand-light" href="/"><span className="brand-mark"><Sprout size={25} /></span><span className="brand-text"><strong>Mother Nature</strong><small>ACADEMY</small></span></Link>
          <p>A little more room to grow.<br />Outdoor learning for curious young minds.</p>
        </div>
        <div className="footer-contact">
          <h3>Come say hello</h3>
          <p><MapPin size={16} /> Carthage, North Carolina</p>
          <p><Phone size={16} /> <a href="tel:+19109862836">(910) 986-2836</a></p>
          <p><Mail size={16} /> <a href="mailto:Laura@MotherNatureAcademy.com">Email the academy</a></p>
        </div>
        <div className="footer-links">
          <h3>Explore</h3>
          <Link href="/program">Our approach</Link><Link href="/curriculum">Curriculum</Link><Link href="/hours">Hours & tuition</Link><Link href="/register">Registration inquiry</Link>
        </div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Mother Nature Academy LLC</span><span>Made for little explorers and the people who love them.</span></div>
    </footer>
  );
}
