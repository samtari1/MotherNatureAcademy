import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageIntro } from "@/components/page-intro";
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
    <section className="campus-gallery"><div className="container">
      <div className="section-label"><span>01</span><span className="label-line"/> LIFE ON THE FARM</div>
      <h2>Little corners of <em>campus.</em></h2>
      <div className="campus-gallery-grid">
        <figure><div><Image src="/images/pond.jpg" alt="Pond and trees on the academy grounds" fill sizes="(max-width: 720px) 100vw, 50vw" /></div><figcaption>Time outside by the pond</figcaption></figure>
        <figure><div><Image src="/images/garden.png" alt="Rows of leafy plants growing in the garden" fill sizes="(max-width: 720px) 100vw, 50vw" /></div><figcaption>Growing and noticing in the garden</figcaption></figure>
        <figure><div><Image src="/images/chicken-coop.jpg" alt="Chickens in their coop" fill sizes="(max-width: 720px) 100vw, 50vw" /></div><figcaption>Our chicken coop</figcaption></figure>
        <figure><div><Image src="/images/rabbits.jpg" alt="Rabbits resting in their enclosure" fill sizes="(max-width: 720px) 100vw, 50vw" /></div><figcaption>Rabbits on the farm</figcaption></figure>
        <figure><div><Image src="/images/library.jpg" alt="Books and a quiet reading corner" fill sizes="(max-width: 720px) 100vw, 50vw" /></div><figcaption>A quiet reading nook</figcaption></figure>
        <figure><div><Image src="/images/mudkitchen.jpg" alt="Outdoor mud kitchen play space" fill sizes="(max-width: 720px) 100vw, 50vw" /></div><figcaption>Outdoor pretend play</figcaption></figure>
      </div>
    </div></section>
    <section className="campus-list"><div className="container">
      <div className="section-label"><span>02</span><span className="label-line"/> LITTLE PLACES, BIG IDEAS</div>
      <h2>Some of the places<br/>we <em>love to explore.</em></h2>
      <div className="campus-grid">{places.map(([Icon, title, body]: any) => <article key={title}><span><Icon size={20}/></span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div>
    </div></section>
    <section className="campus-video"><div className="container">
      <div className="section-label"><span>03</span><span className="label-line"/> A LOOK AROUND</div>
      <h2>Take a <em>virtual tour.</em></h2>
      <div className="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/LZVVfnhUSSg" title="Mother Nature Academy virtual campus tour" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>
    </div></section>
    <section className="callout-band"><div className="container callout-inner"><p>See if the campus feels like a place your child would love.</p><Link className="button" href="/contact">Plan a tour <span>↗</span></Link></div></section>
  </>;
}
