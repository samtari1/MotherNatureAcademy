import Link from "next/link";
import { ArrowUpRight, Leaf, Sun, Footprints, Heart, MapPin, Sparkles } from "lucide-react";
import { HomeHours } from "@/components/public-site-details";
import { PageCopy, PageCopyTitle } from "@/components/page-copy";

export default function HomePage() {
  return <>
    <section className="hero">
      <div className="hero-image" role="img" aria-label="Sunlight falling across a green woodland trail" />
      <div className="hero-shade" />
      <div className="hero-content container">
        <div className="hero-copy"><div className="eyebrow eyebrow-light"><span /><PageCopy page="home" field="hero_eyebrow" /></div><h1><PageCopyTitle page="home" field="hero_title" fallback="Room to roam.\nRoom to grow." /></h1><p><PageCopy page="home" field="hero_intro" /></p><div className="hero-actions"><Link className="button button-cream" href="/register">Explore enrollment <ArrowUpRight size={17} /></Link><Link className="hero-secondary" href="/program">Discover our approach <span>↓</span></Link></div></div>
        <div className="hero-note"><span className="note-icon"><Leaf size={17} /></span><span><PageCopy page="home" field="hero_note" /></span></div>
      </div>
      <div className="hero-caption">CARTHAGE, NORTH CAROLINA <span>·</span> AGES 2½–5</div>
    </section>

    <section className="welcome section-pad"><div className="container welcome-grid"><div className="section-label"><span>01</span><span className="label-line" /> <PageCopy page="home" field="welcome_label" /></div><div className="welcome-copy"><h2><PageCopyTitle page="home" field="welcome_title" fallback="Childhood is a time\nto wonder." /></h2><p className="lead"><PageCopy page="home" field="welcome_lead" /></p><p><PageCopy page="home" field="welcome_body" /></p><Link className="text-link" href="/program">Get to know our program <span>↗</span></Link></div><div className="welcome-art"><div className="art-blob"><span className="sun-disc"/><span className="art-hill hill-a"/><span className="art-hill hill-b"/><span className="art-stem">✳</span></div><span className="art-caption">A childhood connected<br />to the natural world.</span></div></div></section>

    <section className="values-band"><div className="container values-grid"><article><span className="value-icon"><Footprints /></span><h3><PageCopy page="home" field="values_one_title" /></h3><p><PageCopy page="home" field="values_one_body" /></p></article><article><span className="value-icon"><Heart /></span><h3><PageCopy page="home" field="values_two_title" /></h3><p><PageCopy page="home" field="values_two_body" /></p></article><article><span className="value-icon"><Sun /></span><h3><PageCopy page="home" field="values_three_title" /></h3><p><PageCopy page="home" field="values_three_body" /></p></article></div></section>

    <section className="outdoors section-pad"><div className="container outdoors-grid"><div className="outdoors-visual"><div className="outdoor-photo photo-one"/><div className="outdoor-photo photo-two"/><div className="photo-stamp"><Sparkles size={18}/><span>Made for<br />curiosity</span></div></div><div className="outdoors-copy"><div className="section-label"><span>02</span><span className="label-line" /> OUR LEARNING LANDSCAPE</div><h2><PageCopyTitle page="home" field="outdoors_title" fallback="Nature makes\na beautiful teacher." /></h2><p><PageCopy page="home" field="outdoors_body" /></p><Link className="text-link" href="/campus">Take a look around <span>↗</span></Link></div></div></section>

    <section className="approach-panel"><div className="container approach-inner"><div><div className="eyebrow eyebrow-light"><span /> CURIOUS MINDS, CONFIDENT BEGINNINGS</div><h2><PageCopyTitle page="home" field="approach_title" fallback="Play is serious\nlearning." /></h2></div><div><p><PageCopy page="home" field="approach_body" /></p><Link className="button button-cream" href="/curriculum">How learning grows here <ArrowUpRight size={17}/></Link></div></div></section>

    <section className="quick-info section-pad"><div className="container quick-grid"><div className="section-label"><span>03</span><span className="label-line" /> A LITTLE PRACTICAL INFO</div><div className="quick-detail"><span className="quick-kicker">OUR MORNING</span><h2><PageCopyTitle page="home" field="quick_title" fallback="Good days start\nat 9 o’clock." /></h2><HomeHours /><Link className="text-link" href="/hours">Hours & tuition <span>↗</span></Link></div><div className="quick-cta"><MapPin size={22}/><p><PageCopy page="home" field="quick_cta" /></p><Link className="button" href="/register">Start a conversation <ArrowUpRight size={16}/></Link></div></div></section>

    <section className="closing-cta"><div className="container closing-inner"><span className="closing-flower">✳</span><p><PageCopy page="home" field="closing_tagline" /></p><h2><PageCopyTitle page="home" field="closing_title" fallback="Let’s find your\nchild’s next trail." /></h2><Link className="button button-cream" href="/register">Ask about enrollment <ArrowUpRight size={17}/></Link></div></section>
  </>;
}
