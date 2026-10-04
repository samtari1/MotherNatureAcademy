import Link from "next/link";
import { ArrowUpRight, Leaf, Sun, Footprints, Heart, MapPin, Sparkles } from "lucide-react";
import { HomeHours } from "@/components/public-site-details";

export default function HomePage() {
  return <>
    <section className="hero">
      <div className="hero-image" role="img" aria-label="Sunlight falling across a green woodland trail" />
      <div className="hero-shade" />
      <div className="hero-content container">
        <div className="hero-copy"><div className="eyebrow eyebrow-light"><span />A nature preschool in Moore County</div><h1>Room to roam.<br /><em>Room to grow.</em></h1><p>A playful, hands-on beginning to a lifetime of learning—rooted in nature, guided by curiosity.</p><div className="hero-actions"><Link className="button button-cream" href="/register">Explore enrollment <ArrowUpRight size={17} /></Link><Link className="hero-secondary" href="/program">Discover our approach <span>↓</span></Link></div></div>
        <div className="hero-note"><span className="note-icon"><Leaf size={17} /></span><span>Little learners.<br /><strong>Big, beautiful outdoors.</strong></span></div>
      </div>
      <div className="hero-caption">CARTHAGE, NORTH CAROLINA <span>·</span> AGES 2½–5</div>
    </section>

    <section className="welcome section-pad"><div className="container welcome-grid"><div className="section-label"><span>01</span><span className="label-line" /> THE MN A DIFFERENCE</div><div className="welcome-copy"><h2>Childhood is a time<br />to <em>wonder.</em></h2><p className="lead">At Mother Nature Academy, the world outside is our classroom.</p><p>On our private farm, children spend their mornings exploring, imagining, building confidence, and learning through play. With caring educators close by, everyday discoveries become the start of something wonderful.</p><Link className="text-link" href="/program">Get to know our program <span>↗</span></Link></div><div className="welcome-art"><div className="art-blob"><span className="sun-disc"/><span className="art-hill hill-a"/><span className="art-hill hill-b"/><span className="art-stem">✳</span></div><span className="art-caption">A childhood connected<br />to the natural world.</span></div></div></section>

    <section className="values-band"><div className="container values-grid"><article><span className="value-icon"><Footprints /></span><h3>Learn by doing</h3><p>Real experiences invite children to explore, practice, and make discoveries for themselves.</p></article><article><span className="value-icon"><Heart /></span><h3>Grow with care</h3><p>We meet each child where they are, helping them feel safe, capable, and understood.</p></article><article><span className="value-icon"><Sun /></span><h3>Be outdoors</h3><p>Trails, gardens, and open-ended play give young learners space to move and wonder.</p></article></div></section>

    <section className="outdoors section-pad"><div className="container outdoors-grid"><div className="outdoors-visual"><div className="outdoor-photo photo-one"/><div className="outdoor-photo photo-two"/><div className="photo-stamp"><Sparkles size={18}/><span>Made for<br />curiosity</span></div></div><div className="outdoors-copy"><div className="section-label"><span>02</span><span className="label-line" /> OUR LEARNING LANDSCAPE</div><h2>Nature makes<br />a <em>beautiful teacher.</em></h2><p>There’s a lot to learn from a muddy puddle, a trail of tiny tracks, or a garden taking shape. Our outdoor spaces offer room for big ideas, little hands, and the kind of play children remember.</p><Link className="text-link" href="/campus">Take a look around <span>↗</span></Link></div></div></section>

    <section className="approach-panel"><div className="container approach-inner"><div><div className="eyebrow eyebrow-light"><span /> CURIOUS MINDS, CONFIDENT BEGINNINGS</div><h2>Play is serious<br /><em>learning.</em></h2></div><div><p>We bring together child-led exploration, thoughtful guidance, and the best learning materials we can offer: time, space, and the natural world. Children follow their interests while building the social, physical, language, and thinking skills that help them thrive.</p><Link className="button button-cream" href="/curriculum">How learning grows here <ArrowUpRight size={17}/></Link></div></div></section>

    <section className="quick-info section-pad"><div className="container quick-grid"><div className="section-label"><span>03</span><span className="label-line" /> A LITTLE PRACTICAL INFO</div><div className="quick-detail"><span className="quick-kicker">OUR MORNING</span><h2>Good days start<br />at <em>9 o’clock.</em></h2><HomeHours /><Link className="text-link" href="/hours">Hours & tuition <span>↗</span></Link></div><div className="quick-cta"><MapPin size={22}/><p>Curious if we might be the right fit for your family?</p><Link className="button" href="/register">Start a conversation <ArrowUpRight size={16}/></Link></div></div></section>

    <section className="closing-cta"><div className="container closing-inner"><span className="closing-flower">✳</span><p>Every great adventure starts somewhere.</p><h2>Let’s find your<br /><em>child’s next trail.</em></h2><Link className="button button-cream" href="/register">Ask about enrollment <ArrowUpRight size={17}/></Link></div></section>
  </>;
}
