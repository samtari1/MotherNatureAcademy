"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type Dispatch, type DragEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type SetStateAction } from "react";

export type PageCopyMap = Record<string, Record<string, string>>;
export type PageBlockType = "text" | "image" | "video" | "callout";
export type ElementLayout = { x: number; y: number; width: number; height: number; unit?: "free" };
export type CopyElementLayout = { x: number; y: number; width: number; height: number; unit?: "free" };
export type PageBlock = { id: string; type: PageBlockType; heading: string; body: string; background: string; layout?: "standard" | "image-left" | "image-right" | "centered"; element_layout?: Record<string, ElementLayout>; image_url?: string; image_alt?: string; caption?: string; video_url?: string; button_label?: string; button_url?: string };
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
const PageLayoutContext = createContext<{ data: Record<string, Record<string, CopyElementLayout>>; setData: Dispatch<SetStateAction<Record<string, Record<string, CopyElementLayout>>>> }>({ data: {}, setData: () => {} });
const PageBlocksContext = createContext<{ data: Record<string, PageBlock[]>; setData: Dispatch<SetStateAction<Record<string, PageBlock[]>>> }>({ data: {}, setData: () => {} });
const VisualEditContext = createContext(false);

function postVisualEdit(message: Record<string, unknown>) {
  if (window.parent !== window) window.parent.postMessage({ source: "mna-visual-editor", ...message }, window.location.origin);
}

export function PageCopyProvider({ children }: { children: ReactNode }) {
  const [copy, setCopy] = useState(defaultPageCopy);
  const [layouts, setLayouts] = useState<Record<string, Record<string, CopyElementLayout>>>({});
  const [blocks, setBlocks] = useState<Record<string, PageBlock[]>>({});
  const [visualEdit, setVisualEdit] = useState(false);
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("visualEdit") === "1";
    if (requested) fetch("/api/admin/session", { credentials: "include" }).then(response => setVisualEdit(response.ok)).catch(() => {});
    fetch("/api/page-content").then(response => response.ok ? response.json() : null).then((saved: Record<string, Record<string, unknown>> | null) => {
      if (!saved) return;
      setCopy(current => Object.fromEntries(Object.entries(current).map(([page, fields]) => {
        const savedFields = saved[page] ?? {};
        const textFields = Object.fromEntries(Object.entries(savedFields).filter(([, value]) => typeof value === "string")) as Record<string, string>;
        return [page, { ...fields, ...textFields }];
      })));
      setBlocks(Object.fromEntries(Object.entries(saved).map(([page, fields]) => [page, Array.isArray(fields.blocks) ? fields.blocks as PageBlock[] : []])));
      setLayouts(Object.fromEntries(Object.entries(saved).map(([page, fields]) => [page, fields.element_layouts && typeof fields.element_layouts === "object" ? fields.element_layouts as Record<string, CopyElementLayout> : {}])));
    }).catch(() => {});
  }, []);
  useLayoutEffect(() => {
    const canvas = document.querySelector<HTMLElement>("main.page-layout-canvas");
    if (!canvas) return;
    canvas.style.minHeight = "";
    const maxBottom = Object.values(layouts).flatMap(page => Object.values(page)).reduce((bottom, item) => item.unit === "free" ? Math.max(bottom, item.y + item.height) : bottom, 0);
    if (maxBottom > canvas.scrollHeight) canvas.style.minHeight = `${maxBottom}px`;
  }, [layouts]);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.source !== "mna-admin") return;
      if (event.data.type === "replace-page-blocks" && Array.isArray(event.data.blocks)) setBlocks(current => ({ ...current, [event.data.page]: event.data.blocks }));
      if (event.data.type === "replace-page-copy" && event.data.copy && typeof event.data.copy === "object") setCopy(current => ({ ...current, [event.data.page]: { ...current[event.data.page], ...event.data.copy } }));
      if (event.data.type === "replace-page-layouts" && event.data.layouts && typeof event.data.layouts === "object") setLayouts(current => ({ ...current, [event.data.page]: event.data.layouts }));
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  return <PageCopyContext.Provider value={copy}><PageLayoutContext.Provider value={{ data: layouts, setData: setLayouts }}><PageBlocksContext.Provider value={{ data: blocks, setData: setBlocks }}><VisualEditContext.Provider value={visualEdit}>{children}{visualEdit && <VisualEditToolbar />}</VisualEditContext.Provider></PageBlocksContext.Provider></PageLayoutContext.Provider></PageCopyContext.Provider>;
}

function VisualCopyElement({ page, field, children, className }: { page: string; field: string; children: ReactNode; className?: string }) {
  const visualEdit = useContext(VisualEditContext);
  const layoutContext = useContext(PageLayoutContext);
  const layout = layoutContext.data[page]?.[field];
  const elementRef = useRef<HTMLSpanElement | null>(null);
  useLayoutEffect(() => {
    const element = elementRef.current;
    const canvas = document.querySelector<HTMLElement>("main.page-layout-canvas");
    if (!element || !canvas || layout?.unit !== "free") return;
    element.style.left = ""; element.style.top = ""; element.style.width = ""; element.style.minHeight = "";
    const natural = element.getBoundingClientRect(); const canvasRect = canvas.getBoundingClientRect();
    element.style.position = "relative"; element.style.display = "inline-block"; element.style.boxSizing = "border-box";
    element.style.left = `${layout.x - (natural.left - canvasRect.left)}px`;
    element.style.top = `${layout.y - (natural.top - canvasRect.top)}px`;
    element.style.width = `${layout.width}px`; element.style.minHeight = `${layout.height}px`;
  }, [layout]);
  function adjust(event: ReactPointerEvent<HTMLButtonElement>, mode: "move" | "resize") {
    event.preventDefault(); event.stopPropagation();
    const element = event.currentTarget.closest<HTMLElement>("[data-copy-element]");
    const canvas = document.querySelector<HTMLElement>("main.page-layout-canvas");
    if (!element || !canvas) return;
    const activeElement = element;
    const canvasRect = canvas.getBoundingClientRect(); const visualRect = element.getBoundingClientRect();
    const visualX = visualRect.left - canvasRect.left; const visualY = visualRect.top - canvasRect.top;
    element.style.left = ""; element.style.top = ""; element.style.width = ""; element.style.minHeight = "";
    const naturalRect = element.getBoundingClientRect();
    const current: CopyElementLayout = { x: layout?.unit === "free" ? layout.x : visualX, y: layout?.unit === "free" ? layout.y : visualY, width: layout?.unit === "free" ? layout.width : visualRect.width, height: layout?.unit === "free" ? layout.height : visualRect.height, unit: "free" };
    const originX = naturalRect.left - canvasRect.left; const originY = naturalRect.top - canvasRect.top;
    const startX = event.clientX; const startY = event.clientY;
    function apply(next: CopyElementLayout) {
      activeElement.style.position = "relative"; activeElement.style.display = "inline-block"; activeElement.style.boxSizing = "border-box";
      activeElement.style.left = `${next.x - originX}px`; activeElement.style.top = `${next.y - originY}px`; activeElement.style.width = `${next.width}px`; activeElement.style.minHeight = `${next.height}px`;
      return next;
    }
    apply(current);
    const initial = { ...current };
    let final = { ...current };
    function onMove(pointer: PointerEvent) {
      const next = { ...initial, unit: "free" as const };
      if (mode === "move") {
        next.x = initial.x + pointer.clientX - startX;
        next.y = initial.y + pointer.clientY - startY;
      } else {
        next.width = Math.max(40, Math.min(5000, initial.width + pointer.clientX - startX));
        next.height = Math.max(24, Math.min(3000, initial.height + pointer.clientY - startY));
      }
      apply(next);
      final = next;
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp);
      layoutContext.setData(saved => ({ ...saved, [page]: { ...saved[page], [field]: final } }));
      postVisualEdit({ type: "copy-layout-change", page, field, layout: final });
    }
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp, { once: true });
  }
  const style = layout && layout.unit !== "free" ? { position: "relative" as const, display: "inline-block", boxSizing: "border-box" as const, left: `${layout.x}%`, top: `${layout.y}px`, width: `${layout.width}%`, minHeight: `${layout.height}px` } : undefined;
  return <span ref={elementRef} className={`visual-copy-element${visualEdit ? " visual-copy-editing" : ""}${className ? ` ${className}` : ""}`} data-copy-element={`${page}:${field}`} style={style}>{children}{visualEdit && <span className="visual-copy-tools" contentEditable={false}><button type="button" title="Drag to move freely across the page" aria-label={`Move ${field.replaceAll("_", " ")}`} onPointerDown={event => adjust(event, "move")}>⠿</button><button type="button" className="visual-copy-resize" title="Drag to resize freely" aria-label={`Resize ${field.replaceAll("_", " ")}`} onPointerDown={event => adjust(event, "resize")}>↘</button></span>}</span>;
}

function VisualEditToolbar() {
  return <aside className="visual-edit-toolbar"><strong>Visual editing</strong><span>Use ⠿ to move existing copy freely across the page and ↘ to resize it. Drag added content with its section handle.</span><div>{(["text", "image", "video", "callout"] as PageBlockType[]).map(type => <button type="button" key={type} onClick={() => postVisualEdit({ type: "add-block", page: new URLSearchParams(window.location.search).get("page") || window.location.pathname.split("/").filter(Boolean).pop() || "home", blockType: type })}>+ {type}</button>)}</div><small>Save changes in the admin window.</small></aside>;
}

export function PageCopy({ page, field, fallback, className }: { page: string; field: string; fallback?: string; className?: string }) {
  const copy = useContext(PageCopyContext);
  const visualEdit = useContext(VisualEditContext);
  const text = copy[page]?.[field] ?? fallback ?? "";
  return <VisualCopyElement page={page} field={field}><span className={`${className ?? ""}${visualEdit ? " visual-editable-text" : ""}`} style={{ whiteSpace: "pre-line" }} contentEditable={visualEdit} suppressContentEditableWarning onBlur={event => visualEdit && postVisualEdit({ type: "copy-change", page, field, value: event.currentTarget.innerText.replace(/\n$/, "") })} data-visual-label={visualEdit ? field.replaceAll("_", " ") : undefined}>{text}</span></VisualCopyElement>;
}

export function PageCopyTitle({ page, field = "intro_title", fallback }: { page: string; field?: string; fallback: string }) {
  const copy = useContext(PageCopyContext);
  const visualEdit = useContext(VisualEditContext);
  const lines = (copy[page]?.[field] ?? fallback).split("\n");
  return <VisualCopyElement page={page} field={field}><span className={visualEdit ? "visual-editable-text" : undefined} contentEditable={visualEdit} suppressContentEditableWarning onBlur={event => visualEdit && postVisualEdit({ type: "copy-change", page, field, value: event.currentTarget.innerText.replace(/\n$/, "") })} data-visual-label={visualEdit ? field.replaceAll("_", " ") : undefined}>{lines.slice(0, -1).map((line, index) => <span key={index}>{line}<br /></span>)}<em>{lines.at(-1)}</em></span></VisualCopyElement>;
}

function embedVideoUrl(url: string) {
  try {
    const parsed = new URL(url);
    let videoId = "";
    if (parsed.hostname === "youtu.be") videoId = parsed.pathname.slice(1);
    else if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(parsed.hostname)) videoId = parsed.pathname === "/watch" ? parsed.searchParams.get("v") ?? "" : parsed.pathname.startsWith("/embed/") ? parsed.pathname.split("/embed/")[1]?.split("/")[0] ?? "" : "";
    return /^[A-Za-z0-9_-]{6,20}$/.test(videoId) ? `https://www.youtube.com/embed/${videoId}` : "";
  } catch { return ""; }
}

function readableTextColor(hex: string) {
  const channels = hex.slice(1).match(/.{2}/g)?.map(channel => parseInt(channel, 16) / 255) ?? [1, 1, 1];
  const luminance = channels.map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  return luminance < 0.38 ? "#fffefa" : "#26382f";
}

export function PageBlocks({ page }: { page: string }) {
  const blocksContext = useContext(PageBlocksContext);
  const blocks = blocksContext.data[page] ?? [];
  const visualEdit = useContext(VisualEditContext);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  if (!blocks.length) return null;
  function reorderBlocks(event: DragEvent<HTMLElement>, targetId: string) {
    event.preventDefault();
    if (!draggedBlockId || draggedBlockId === targetId) return;
    const next = [...blocks];
    const from = next.findIndex(item => item.id === draggedBlockId);
    const to = next.findIndex(item => item.id === targetId);
    if (from < 0 || to < 0) return;
    const [moving] = next.splice(from, 1);
    next.splice(to, 0, moving);
    setDraggedBlockId(null);
    postVisualEdit({ type: "block-order", page, ids: next.map(item => item.id) });
  }
  function updateBlock(id: string, patch: Partial<PageBlock>) {
    blocksContext.setData(current => ({ ...current, [page]: (current[page] ?? []).map(block => block.id === id ? { ...block, ...patch } : block) }));
    postVisualEdit({ type: "block-update", page, blockId: id, patch });
  }
  function beginElementAdjust(event: ReactPointerEvent<HTMLButtonElement>, block: PageBlock, slot: string, mode: "move" | "resize") {
    event.preventDefault();
    event.stopPropagation();
    const canvas = event.currentTarget.closest(".page-builder-inner");
    if (!(canvas instanceof HTMLElement)) return;
    canvas.classList.add("page-builder-positioned");
    const canvasRect = canvas.getBoundingClientRect();
    const slots = Array.from(canvas.querySelectorAll<HTMLElement>("[data-layout-slot]"));
    const layouts: Record<string, ElementLayout> = {};
    const measured = slots.map(element => {
      const rect = element.getBoundingClientRect();
      return { element, rect, name: element.dataset.layoutSlot };
    });
    for (const { element, rect, name } of measured) {
      if (!name) continue;
      const previous = block.element_layout?.[name];
      layouts[name] = previous?.unit === "free" ? previous : previous
        ? { x: previous.x / 100 * canvasRect.width, y: previous.y / 100 * canvasRect.height, width: previous.width / 100 * canvasRect.width, height: previous.height / 100 * canvasRect.height, unit: "free" }
        : { x: rect.left - canvasRect.left, y: rect.top - canvasRect.top, width: rect.width, height: rect.height, unit: "free" };
    }
    for (const { element, name } of measured) {
      if (!name) continue;
      element.style.position = "absolute";
      element.style.left = `${layouts[name].x}px`;
      element.style.top = `${layouts[name].y}px`;
      element.style.width = `${layouts[name].width}px`;
      element.style.height = `${layouts[name].height}px`;
    }
    const initial = { ...layouts[slot] };
    const startX = event.clientX;
    const startY = event.clientY;
    const target = slots.find(element => element.dataset.layoutSlot === slot);
    if (!target) return;
    const activeTarget = target;
    function onMove(pointer: PointerEvent) {
      const dx = pointer.clientX - startX;
      const dy = pointer.clientY - startY;
      const next = { ...initial, unit: "free" as const };
      if (mode === "move") {
        next.x = initial.x + dx;
        next.y = initial.y + dy;
      } else {
        next.width = Math.max(40, Math.min(5000, initial.width + dx));
        next.height = Math.max(40, Math.min(3000, initial.height + dy));
      }
      activeTarget.style.left = `${next.x}%`;
      activeTarget.style.top = `${next.y}%`;
      activeTarget.style.width = `${next.width}%`;
      activeTarget.style.height = `${next.height}%`;
      layouts[slot] = next;
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      updateBlock(block.id, { element_layout: layouts });
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  }
  return <div className="page-builder-sections">{blocks.map(block => {
    const background = /^#[0-9a-fA-F]{6}$/.test(block.background) ? block.background : "#fffefa";
    const embedUrl = block.type === "video" ? embedVideoUrl(block.video_url ?? "") : "";
    const layout = block.layout ?? (block.type === "image" || block.type === "video" ? "image-left" : block.type === "callout" ? "centered" : "standard");
    const slots = [
      ...(block.type === "image" && block.image_url ? ["media"] : []),
      ...(block.type === "video" && embedUrl ? ["media"] : []),
      ...(["text", "image", "video", "callout"].includes(block.type) ? ["copy"] : []),
    ];
    const positioned = Boolean(block.element_layout && Object.keys(block.element_layout).length);
    const slotStyle = (slot: string) => {
      const item = block.element_layout?.[slot];
      return item ? { position: "absolute" as const, left: item.unit === "free" ? `${item.x}px` : `${item.x}%`, top: item.unit === "free" ? `${item.y}px` : `${item.y}%`, width: item.unit === "free" ? `${item.width}px` : `${item.width}%`, height: item.unit === "free" ? `${item.height}px` : `${item.height}%`, zIndex: 2 } : undefined;
    };
    const tools = (slot: string) => visualEdit && <div className="visual-element-tools" contentEditable={false}><button type="button" title="Drag to move this element" aria-label="Move element" onPointerDown={event => beginElementAdjust(event, block, slot, "move")}>⠿</button><button type="button" className="visual-element-resize" title="Drag to resize this element" aria-label="Resize element" onPointerDown={event => beginElementAdjust(event, block, slot, "resize")}>↘</button></div>;
    return <section className={`page-builder-block page-builder-${block.type} page-builder-layout-${layout}${positioned ? " page-builder-custom-layout" : ""}${draggedBlockId === block.id ? " visual-block-dragging" : ""}`} key={block.id} style={{ backgroundColor: background, color: readableTextColor(background) }} onDragOver={event => visualEdit && event.preventDefault()} onDrop={event => visualEdit && reorderBlocks(event, block.id)}>
      <div className={`container page-builder-inner${positioned ? " page-builder-positioned" : ""}`}>
        {block.type === "image" && block.image_url && <figure data-layout-slot="media" style={slotStyle("media")}><img src={block.image_url} alt={block.image_alt ?? ""} />{(block.caption || visualEdit) && <figcaption contentEditable={visualEdit} suppressContentEditableWarning onBlur={event => visualEdit && updateBlock(block.id, { caption: event.currentTarget.innerText })} data-visual-label="image caption">{block.caption || (visualEdit ? "Click to add a caption" : "")}</figcaption>}{tools("media")}</figure>}
        {block.type === "video" && embedUrl && <div className="page-builder-video" data-layout-slot="media" style={slotStyle("media")}><iframe src={embedUrl} title={block.heading || "Mother Nature Academy video"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />{tools("media")}</div>}
        <div className="page-builder-copy" data-layout-slot="copy" style={slotStyle("copy")}><h2 contentEditable={visualEdit} suppressContentEditableWarning onBlur={event => visualEdit && updateBlock(block.id, { heading: event.currentTarget.innerText })} data-visual-label="section heading">{block.heading || (visualEdit ? "Click to add a heading" : "")}</h2><p contentEditable={visualEdit} suppressContentEditableWarning onBlur={event => visualEdit && updateBlock(block.id, { body: event.currentTarget.innerText })} data-visual-label="section text">{block.body || (visualEdit ? "Click to add section text" : "")}</p>{block.type === "callout" && block.button_label && block.button_url && <a className="button" href={block.button_url}>{block.button_label} <span>↗</span></a>}{tools("copy")}</div>
      </div>
      {visualEdit && <div className="visual-block-controls" contentEditable={false}><label title="Change section background">Background<input type="color" value={background} onChange={event => { const color = event.target.value; const section = event.currentTarget.closest(".page-builder-block"); if (section instanceof HTMLElement) { section.style.backgroundColor = color; section.style.color = readableTextColor(color); } updateBlock(block.id, { background: color }); }} /></label>{block.type === "image" && <><label>Image URL<input value={block.image_url ?? ""} onChange={event => updateBlock(block.id, { image_url: event.target.value })} /></label><label>Alt text<input value={block.image_alt ?? ""} onChange={event => updateBlock(block.id, { image_alt: event.target.value })} /></label></>}{block.type === "video" && <label>YouTube URL<input value={block.video_url ?? ""} onChange={event => updateBlock(block.id, { video_url: event.target.value })} /></label>}<button type="button" draggable onDragStart={() => setDraggedBlockId(block.id)} onDragEnd={() => setDraggedBlockId(null)} title="Drag this handle onto another section to reorder">⠿ Drag section</button><button type="button" onClick={() => postVisualEdit({ type: "delete-block", page, blockId: block.id })}>Remove section</button><span>Use ⠿ and ↘ handles to move or resize content.</span></div>}
    </section>;
  })}</div>;
}
