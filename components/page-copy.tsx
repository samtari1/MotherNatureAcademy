"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type PageCopyMap = Record<string, Record<string, string>>;
export type PageField = { key: string; label: string; multiline?: boolean };
export type EditablePage = { slug: string; label: string; fields: PageField[] };

export const editablePages: EditablePage[] = [
  { slug: "home", label: "Home", fields: [
    { key: "hero_eyebrow", label: "Hero eyebrow" }, { key: "hero_title", label: "Hero headline (use a new line to split it)" }, { key: "hero_intro", label: "Hero introduction", multiline: true }, { key: "hero_note", label: "Hero note" },
    { key: "welcome_label", label: "Welcome section label" }, { key: "welcome_title", label: "Welcome headline (use a new line to split it)" }, { key: "welcome_lead", label: "Welcome lead", multiline: true }, { key: "welcome_body", label: "Welcome paragraph", multiline: true },
    { key: "values_one_title", label: "Value 1 heading" }, { key: "values_one_body", label: "Value 1 text", multiline: true }, { key: "values_two_title", label: "Value 2 heading" }, { key: "values_two_body", label: "Value 2 text", multiline: true }, { key: "values_three_title", label: "Value 3 heading" }, { key: "values_three_body", label: "Value 3 text", multiline: true },
    { key: "outdoors_title", label: "Outdoor section headline (use a new line to split it)" }, { key: "outdoors_body", label: "Outdoor section text", multiline: true }, { key: "approach_title", label: "Approach headline (use a new line to split it)" }, { key: "approach_body", label: "Approach text", multiline: true },
    { key: "quick_title", label: "Hours section headline (use a new line to split it)" }, { key: "quick_cta", label: "Hours section callout", multiline: true }, { key: "closing_tagline", label: "Closing tagline" }, { key: "closing_title", label: "Closing headline (use a new line to split it)" },
  ]},
  { slug: "program", label: "Outdoor Preschool Program", fields: [
    { key: "intro_eyebrow", label: "Page eyebrow" }, { key: "intro_title", label: "Page headline (use a new line to split it)" }, { key: "intro_text", label: "Page introduction", multiline: true },
    { key: "section_title", label: "Program section headline (use a new line to split it)" }, { key: "section_lead", label: "Program lead", multiline: true }, { key: "section_body", label: "Program description", multiline: true }, { key: "landscape_title", label: "Outdoor landscape headline (use a new line to split it)" }, { key: "landscape_body", label: "Outdoor landscape text", multiline: true }, { key: "readiness_title", label: "Kindergarten readiness headline (use a new line to split it)" }, { key: "readiness_body", label: "Kindergarten readiness text", multiline: true },
  ]},
  { slug: "curriculum", label: "Curriculum", fields: [
    { key: "intro_eyebrow", label: "Page eyebrow" }, { key: "intro_title", label: "Page headline (use a new line to split it)" }, { key: "intro_text", label: "Page introduction", multiline: true }, { key: "section_title", label: "Learning section headline (use a new line to split it)" }, { key: "section_lead", label: "Learning lead", multiline: true }, { key: "section_body", label: "Learning description", multiline: true }, { key: "centers_title", label: "Learning centers headline (use a new line to split it)" },
  ]},
  { slug: "campus", label: "Outdoor Campus", fields: [
    { key: "intro_eyebrow", label: "Page eyebrow" }, { key: "intro_title", label: "Page headline (use a new line to split it)" }, { key: "intro_text", label: "Page introduction", multiline: true }, { key: "feature_title", label: "Campus feature headline (use a new line to split it)" }, { key: "feature_body", label: "Campus feature text", multiline: true }, { key: "feature_note", label: "Campus visit note", multiline: true }, { key: "places_title", label: "Places section headline (use a new line to split it)" },
  ]},
  { slug: "contact", label: "Contact", fields: [
    { key: "intro_eyebrow", label: "Page eyebrow" }, { key: "intro_title", label: "Page headline (use a new line to split it)" }, { key: "intro_text", label: "Page introduction", multiline: true }, { key: "section_title", label: "Contact section headline (use a new line to split it)" }, { key: "section_body", label: "Contact section text", multiline: true },
  ]},
  { slug: "hours", label: "Hours & Tuition", fields: [
    { key: "intro_eyebrow", label: "Page eyebrow" }, { key: "intro_title", label: "Page headline (use a new line to split it)" }, { key: "intro_text", label: "Page introduction", multiline: true },
  ]},
  { slug: "register", label: "Registration", fields: [
    { key: "intro_eyebrow", label: "Page eyebrow" }, { key: "intro_title", label: "Page headline (use a new line to split it)" }, { key: "intro_text", label: "Page introduction", multiline: true }, { key: "aside_title", label: "Application sidebar headline (use a new line to split it)" }, { key: "aside_body", label: "Application sidebar text", multiline: true },
  ]},
  { slug: "policies", label: "Policies", fields: [ { key: "intro_eyebrow", label: "Page eyebrow" }, { key: "intro_title", label: "Page headline (use a new line to split it)" }, { key: "intro_text", label: "Page introduction", multiline: true } ]},
  { slug: "calendar", label: "Calendar", fields: [ { key: "intro_eyebrow", label: "Page eyebrow" }, { key: "intro_title", label: "Page headline (use a new line to split it)" }, { key: "intro_text", label: "Page introduction", multiline: true } ]},
  { slug: "news", label: "News", fields: [ { key: "intro_eyebrow", label: "Page eyebrow" }, { key: "intro_title", label: "Page headline (use a new line to split it)" }, { key: "intro_text", label: "Page introduction", multiline: true } ]},
];

export const defaultPageCopy: PageCopyMap = {
  home: {
    hero_eyebrow: "A nature preschool in Moore County", hero_title: "Room to roam.\nRoom to grow.", hero_intro: "A playful, hands-on beginning to a lifetime of learning—rooted in nature, guided by curiosity.", hero_note: "Little learners.\nBig, beautiful outdoors.",
    welcome_label: "THE MN A DIFFERENCE", welcome_title: "Childhood is a time\nto wonder.", welcome_lead: "At Mother Nature Academy, the world outside is our classroom.", welcome_body: "On our private farm, children spend their mornings exploring, imagining, building confidence, and learning through play. With caring educators close by, everyday discoveries become the start of something wonderful.",
    values_one_title: "Learn by doing", values_one_body: "Real experiences invite children to explore, practice, and make discoveries for themselves.", values_two_title: "Grow with care", values_two_body: "We meet each child where they are, helping them feel safe, capable, and understood.", values_three_title: "Be outdoors", values_three_body: "Trails, gardens, and open-ended play give young learners space to move and wonder.",
    outdoors_title: "Nature makes\na beautiful teacher.", outdoors_body: "There’s a lot to learn from a muddy puddle, a trail of tiny tracks, or a garden taking shape. Our outdoor spaces offer room for big ideas, little hands, and the kind of play children remember.", approach_title: "Play is serious\nlearning.", approach_body: "We bring together child-led exploration, thoughtful guidance, and the best learning materials we can offer: time, space, and the natural world. Children follow their interests while building the social, physical, language, and thinking skills that help them thrive.", quick_title: "Good days start\nat 9 o’clock.", quick_cta: "Curious if we might be the right fit for your family?", closing_tagline: "Every great adventure starts somewhere.", closing_title: "Let’s find your\nchild’s next trail.",
  },
  program: { intro_eyebrow: "OUR PROGRAM", intro_title: "A little wild.\nA lot of learning.", intro_text: "For children ages 2½ to 5, Mother Nature Academy builds confidence, competence, and kindergarten readiness through outdoor play, hands-on discovery, and caring guidance.", section_title: "Learning grows\nfrom experience.", section_lead: "A pinecone can become a question. A question can become the beginning of a day’s learning.", section_body: "Mother Nature Academy offers an outdoor preschool for children ages 2½ to 5. Children spend their program morning exploring a natural setting, learning through movement, play, conversation, and direct experience.", landscape_title: "Outside is where\nthe day unfolds.", landscape_body: "On the academy’s 6.5-acre farm, children can move between the nature trail, gardens, building materials, mud kitchen, books, and open-ended play spaces. Each place offers a different way to wonder, practice, and connect.", readiness_title: "Kindergarten readiness\nwith a strong foundation.", readiness_body: "Readiness is more than knowing a list of facts. It grows through the everyday ways children think, communicate, move, and take part." },
  curriculum: { intro_eyebrow: "CURRICULUM", intro_title: "Follow the question.\nFind the learning.", intro_text: "A flexible, play-based approach brings children’s curiosity together with the skills they’ll carry forward.", section_title: "Hands busy.\nMinds at work.", section_lead: "A child fascinated by deer tracks might count them, compare them, wonder where they lead, and make a story about what happened.", section_body: "That’s the spirit of project-based, child-centered learning. We draw inspiration from the work of Reggio Emilia, Jean Piaget, and Maria Montessori, while adapting experiences to the children in front of us.", centers_title: "Many paths into\nsomething new." },
  campus: { intro_eyebrow: "OUR CAMPUS", intro_title: "The outdoors is\nour classroom.", intro_text: "Our learning spaces sit on a private farm in Carthage, North Carolina, with places to build, pretend, notice, make, and explore.", feature_title: "A landscape made\nfor little explorers.", feature_body: "From the nature trail to the mud kitchen, every corner offers a different invitation. Children can follow an idea, find a friend, and turn an ordinary morning into a story of their own.", feature_note: "Campus visits are arranged by appointment. Please contact us to plan a tour.", places_title: "Some of the places\nwe love to explore." },
  contact: { intro_eyebrow: "GET IN TOUCH", intro_title: "We’d love to\nhear from you.", intro_text: "Questions about the program, tuition, or visiting the campus? Reach out and we’ll help you find the information you need.", section_title: "Let’s start\na conversation.", section_body: "The campus is located on a private farm. Visits are arranged by appointment, so please get in touch before stopping by." },
  hours: { intro_eyebrow: "HOURS & TUITION", intro_title: "A good morning,\nat your own rhythm.", intro_text: "A few practical details to help you picture how Mother Nature Academy could fit into your family’s week." },
  register: { intro_eyebrow: "ENROLLMENT", intro_title: "A place to begin\nsomething wonderful.", intro_text: "Use this form to apply for enrollment at Mother Nature Academy. The academy will review your application and contact you about availability and next steps.", aside_title: "Let’s get\nstarted.", aside_body: "This is an application, not a confirmed enrollment. The academy will contact you after reviewing the information." },
  policies: { intro_eyebrow: "FAMILY INFORMATION", intro_title: "A little more about\nhow we care.", intro_text: "A practical overview of outdoor learning and family policies at Mother Nature Academy." },
  calendar: { intro_eyebrow: "ACADEMIC CALENDAR", intro_title: "A year of little\nmilestones.", intro_text: "See important dates, breaks, and program days for the current school year. Past calendars remain available for reference." },
  news: { intro_eyebrow: "FROM THE ACADEMY", intro_title: "A few things\ngrowing here.", intro_text: "News, reminders, and little moments from Mother Nature Academy." },
};

const PageCopyContext = createContext<PageCopyMap>(defaultPageCopy);

export function PageCopyProvider({ children }: { children: ReactNode }) {
  const [copy, setCopy] = useState(defaultPageCopy);
  useEffect(() => {
    fetch("/api/page-content").then(response => response.ok ? response.json() : null).then((saved: PageCopyMap | null) => {
      if (!saved) return;
      setCopy(current => Object.fromEntries(Object.entries(current).map(([page, fields]) => [page, { ...fields, ...(saved[page] ?? {}) }])));
    }).catch(() => {});
  }, []);
  return <PageCopyContext.Provider value={copy}>{children}</PageCopyContext.Provider>;
}

export function PageCopy({ page, field, fallback, className }: { page: string; field: string; fallback?: string; className?: string }) {
  const copy = useContext(PageCopyContext);
  const text = copy[page]?.[field] ?? fallback ?? "";
  return <span className={className} style={{ whiteSpace: "pre-line" }}>{text}</span>;
}

export function PageCopyTitle({ page, field = "intro_title", fallback }: { page: string; field?: string; fallback: string }) {
  const copy = useContext(PageCopyContext);
  const lines = (copy[page]?.[field] ?? fallback).split("\n");
  return <>{lines.slice(0, -1).map((line, index) => <span key={index}>{line}<br /></span>)}<em>{lines.at(-1)}</em></>;
}
