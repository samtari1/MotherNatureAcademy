import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { CampusMedia } from "@/components/campus-media";
import { CampusMap } from "@/components/campus-map";
import { Cherry, Boxes, CookingPot, Bird, Blocks, Theater, Sun, Waves, Music, Route, Egg } from "lucide-react";

export const metadata: Metadata = { title: "Our Outdoor Campus" };

const places = [
  [Route, "Nature trail", "A winding path for walks, noticing, and little adventures."],
  [Cherry, "Berry garden", "A place to watch things grow and get close to the seasons."],
  [Egg, "Chicken coop", "A chance to observe animals and learn about caring for living things."],
  [Boxes, "Loose parts", "Open-ended materials for building, sorting, and imagining."],
  [CookingPot, "Mud kitchen", "Mix, pour, serve, and make something entirely your own."],
  [Bird, "Owl’s library", "Books and a cozy spot for a quieter kind of exploring."],
  [Blocks, "Big builds", "Large blocks and poles turn teamwork into towering ideas."],
  [Theater, "Dramatic play", "Stories come alive when children make the world their own."],
  [Sun, "Pavilion", "A sheltered place for math, making, and creative work."],
  [Waves, "Sand & water", "Scoop, splash, test, and discover."],
  [Music, "Music wall", "Find rhythms in instruments and sounds all around."],
];

export default function CampusPage() {
  return <>
    <PageIntro eyebrow="OUR CAMPUS" title={<>The outdoors is<br/><em>our classroom.</em></>} intro="Our learning spaces sit on a private farm in Carthage, North Carolina, with places to build, pretend, notice, make, and explore." />
    <section className="campus-feature"><div className="container campus-feature-inner">
      <div className="campus-image" role="img" aria-label="Outdoor mud kitchen at Mother Nature Academy" />
      <div className="campus-feature-copy"><div className="eyebrow"><span/> SIX AND A HALF ACRES OF POSSIBILITY</div>
        <h2>A landscape made<br/>for <em>little explorers.</em></h2>
        <p>From the nature trail to the mud kitchen, every corner offers a different invitation. Children can follow an idea, find a friend, and turn an ordinary morning into a story of their own.</p>
        <p className="quiet-note">Campus visits are arranged by appointment. Please contact us to plan a tour.</p>
        <Link className="button" href="/contact">Arrange a visit <span>↗</span></Link>
      </div>
    </div></section>
    <CampusMap />
    <CampusMedia />
    <section className="campus-list"><div className="container">
      <div className="section-label"><span>02</span><span className="label-line"/> LITTLE PLACES, BIG IDEAS</div>
      <h2>Some of the places<br/>we <em>love to explore.</em></h2>
      <div className="campus-grid">{places.map(([Icon, title, body]: any) => <article key={title}><span><Icon size={20}/></span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div>
    </div></section>
    <section className="callout-band"><div className="container callout-inner"><p>See if the campus feels like a place your child would love.</p><Link className="button" href="/contact">Plan a tour <span>↗</span></Link></div></section>
  </>;
}
