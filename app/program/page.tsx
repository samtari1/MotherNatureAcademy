import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { PodcastPlayer } from "@/components/podcast-player";
import { ProgramVideo } from "@/components/program-video";
import { PageBlocks, PageCopy, PageCopyTitle } from "@/components/page-copy";
import { Leaf, Compass, Hand, Sprout, Search, Users, Footprints } from "lucide-react";

export const metadata: Metadata = { title: "Outdoor Preschool Program" };

export default function ProgramPage() {
  return <>
    <PageIntro page="program" eyebrow="OUR PROGRAM" title="A little wild.\nA lot of learning." intro="For children ages 2½ to 5, Mother Nature Academy builds confidence, competence, and kindergarten readiness through outdoor play, hands-on discovery, and caring guidance." />

    <section className="section-pad content-section"><div className="container split-content">
      <div><div className="section-label"><span>01</span><span className="label-line"/> OUR OUTDOOR PRESCHOOL</div><h2><PageCopyTitle page="program" field="section_title" fallback="Learning grows\nfrom experience." /></h2></div>
      <div className="prose">
        <p className="lead"><PageCopy page="program" field="section_lead" /></p>
        <p><PageCopy page="program" field="section_body" /></p>
        <p>Our approach draws inspiration from nature and forest preschools: children have room to explore, make choices, test ideas, and build capability in a real environment. Educators stay close, observe what captures each child’s attention, and offer materials, questions, and support at the right moment.</p>
        <p>Play is meaningful work. Children practice coordination, persistence, communication, problem-solving, and caring for one another as they build, pretend, notice changes, and follow their own questions.</p>
        <Link className="text-link" href="/curriculum">Explore our curriculum <span>↗</span></Link>
      </div>
    </div></section>

    <section className="program-landscape"><div className="container program-landscape-grid">
      <div className="program-landscape-image" role="img" aria-label="Children’s outdoor learning spaces at Mother Nature Academy" />
      <div><span className="eyebrow"><span/> A MORNING WITH ROOM TO EXPLORE</span><h2><PageCopyTitle page="program" field="landscape_title" fallback="Outside is where\nthe day unfolds." /></h2>
        <p><PageCopy page="program" field="landscape_body" /></p>
        <p>A walk can turn into noticing animal tracks. Children might compare shapes, count what they find, draw a map, tell a story, or bring a question back to the group. Everyday discoveries invite many kinds of learning at once.</p>
        <Link className="text-link" href="/campus">See the campus and its learning spaces <span>↗</span></Link>
      </div>
    </div></section>

    <section className="program-ready"><div className="container program-ready-grid">
      <div><div className="section-label"><span>02</span><span className="label-line"/> CONFIDENCE FOR WHAT COMES NEXT</div><h2><PageCopyTitle page="program" field="readiness_title" fallback="Kindergarten readiness\nwith a strong foundation." /></h2></div>
      <div className="prose"><p className="lead"><PageCopy page="program" field="readiness_body" /></p>
        <p>Our educators support the skills children carry into their next classroom: curiosity, independence, listening, expressing ideas, working through a challenge, and joining a community. When children are interested in something, that interest can make room for early math, language, science, creativity, and new vocabulary.</p>
        <p>Families may have different questions about what their child should know before kindergarten. We welcome those conversations and can talk about how the child’s experiences connect with the expectations of the schools they may attend.</p>
      </div>
    </div></section>

    <section className="program-cards"><div className="container program-card-grid">
      <article><span><Leaf/></span><h3>All morning outdoors</h3><p>Fresh air, open space, and hands-on experiences on a private farm.</p></article>
      <article><span><Compass/></span><h3>Guided by wonder</h3><p>Children’s questions and interests shape meaningful explorations.</p></article>
      <article><span><Hand/></span><h3>Learning through play</h3><p>Building, creating, pretending, and practicing real skills every day.</p></article>
      <article><span><Sprout/></span><h3>Room to become</h3><p>Support for growing independence, relationships, and readiness for what comes next.</p></article>
    </div></section>

    <section className="program-practice"><div className="container"><div className="section-label"><span>03</span><span className="label-line"/> LITTLE MOMENTS, LASTING SKILLS</div><h2>What learning can<br/><em>look like outside.</em></h2>
      <div className="program-practice-grid">
        <article><span><Search/></span><div><h3>Notice & investigate</h3><p>Children look closely, ask questions, compare what they find, and share new ideas.</p></div></article>
        <article><span><Footprints/></span><div><h3>Move & make</h3><p>Climbing, carrying, building, pouring, and creating give growing bodies useful challenges.</p></div></article>
        <article><span><Users/></span><div><h3>Learn with one another</h3><p>A mixed-age group makes space for imitation, collaboration, leadership, and helping.</p></div></article>
      </div>
    </div></section>

    <ProgramVideo />
    <PodcastPlayer />
    <section className="callout-band"><div className="container callout-inner"><p>Want to see whether our program feels right for your family?</p><div className="program-callout-actions"><Link className="text-link" href="/hours">View hours & tuition <span>↗</span></Link><Link className="button" href="/register">Ask us a question <span>↗</span></Link></div></div></section>
    <PageBlocks page="program" />
  </>;
}
