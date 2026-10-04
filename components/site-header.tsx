"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  ["Our approach", "/program"],
  ["Curriculum", "/curriculum"],
  ["A day outdoors", "/campus"],
  ["Hours & tuition", "/hours"],
  ["Calendar", "/calendar"],
  ["News", "/news"],
  ["Contact", "/contact"],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Mother Nature Academy home" onClick={() => setOpen(false)}>
          <span className="brand-logo"><Image src="/images/mna-logo.png" alt="" width={56} height={56} priority /></span>
          <span className="brand-text"><strong>Mother Nature</strong><small>ACADEMY · CARTHAGE, NC</small></span>
        </Link>
        <button className="menu-toggle" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? "main-nav open" : "main-nav"} aria-label="Main navigation">
          {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          <Link className="button button-small" href="/register" onClick={() => setOpen(false)}>Request a place <span aria-hidden="true">↗</span></Link>
        </nav>
      </div>
    </header>
  );
}
