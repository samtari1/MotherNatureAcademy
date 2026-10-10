"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type Dispatch, type DragEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type SetStateAction } from "react";

export type PageCopyMap = Record<string, Record<string, string>>;
export type PageBlockType = "text" | "image" | "video" | "callout";
export type PageImageFit = "cover" | "contain" | "fill" | "none" | "scale-down";
export type ElementLayout = { x: number; y: number; width: number; height: number; unit?: "free" };
export type CopyElementLayout = { x: number; y: number; width: number; height: number; unit?: "free" };
export type VisualElementStyle = { font_size?: number; color?: string; background_color?: string; background_image?: string; text_align?: "left" | "center" | "right"; font_weight?: "normal" | "500" | "600" | "700"; link_url?: string; link_label?: string; image_url?: string; image_alt?: string; text_content?: string; hidden?: boolean; height?: number; x?: number; y?: number; width?: number };
export type PageBlock = { id: string; type: PageBlockType; heading: string; body: string; background: string; layout?: "standard" | "image-left" | "image-right" | "centered"; parent_id?: string; floating_position?: { x: number; y: number; width: number; height: number }; element_layout?: Record<string, ElementLayout>; image_url?: string; image_alt?: string; image_fit?: PageImageFit; caption?: string; video_url?: string; button_label?: string; button_url?: string };
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

function visualPageSlug() {
  return window.location.pathname.split("/").filter(Boolean).pop() || "home";
}

function findVisualCallout(element: HTMLElement) {
  return element.closest<HTMLElement>(".page-builder-callout,.callout-band,.closing-cta,.quick-cta")
    ?? element.closest<HTMLElement>('[class*="callout"],[class*="cta"]');
}

function findVisualSection(element: HTMLElement) {
  return findVisualCallout(element) ?? element.closest<HTMLElement>("section");
}

function preserveElementFlowSpace(element: HTMLElement) {
  const parent = element.parentElement;
  if (!parent) return;
  const measuredHeight = parent.getBoundingClientRect().height;
  const existingMinHeight = Number.parseFloat(parent.style.minHeight) || 0;
  parent.style.minHeight = `${Math.max(measuredHeight, existingMinHeight)}px`;
}

function applyFreeCopyLayout(element: HTMLElement, canvas: HTMLElement, layout: CopyElementLayout) {
  element.style.position = "absolute";
  element.style.display = "inline-block";
  element.style.boxSizing = "border-box";
  element.style.zIndex = "2";
  const containingBlock = element.offsetParent instanceof HTMLElement ? element.offsetParent : canvas;
  const canvasRect = canvas.getBoundingClientRect();
  const containingRect = containingBlock.getBoundingClientRect();
  const left = containingRect.left - canvasRect.left + containingBlock.clientLeft - containingBlock.scrollLeft;
  const top = containingRect.top - canvasRect.top + containingBlock.clientTop - containingBlock.scrollTop;
  element.style.left = `${layout.x - left}px`;
  element.style.top = `${layout.y - top}px`;
  element.style.width = `${layout.width}px`;
  element.style.minHeight = `${layout.height}px`;
}

function visualElementKey(element: HTMLElement, root: HTMLElement) {
  const copyKey = element.closest<HTMLElement>("[data-copy-element]")?.dataset.copyElement;
  if (copyKey) return `copy:${copyKey}`;
  const parts: string[] = [];
  let current: HTMLElement | null = element;
  while (current && current !== root) {
    const tag = current.tagName.toLowerCase();
    const peers = current.parentElement ? Array.from(current.parentElement.children).filter(peer => peer.tagName === current?.tagName) : [];
    parts.unshift(`${tag}:${peers.indexOf(current) + 1}`);
    current = current.parentElement;
  }
  return parts.join("/").slice(0, 500);
}

function visualElementLabel(element: HTMLElement) {
  const textNode = Array.from(element.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
  return textNode?.textContent?.trim() ?? (element.childElementCount === 0 ? element.textContent ?? "" : "");
}

function backgroundImageUrl(backgroundImage: string) {
  const match = backgroundImage.match(/url\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/);
  return (match?.[1] ?? match?.[2] ?? match?.[3] ?? "").trim();
}

function directTextContent(element: HTMLElement) {
  return Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent ?? "").join("").trim();
}

function setDirectTextContent(element: HTMLElement, value: string) {
  const nodes = Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
  if (nodes.length) {
    nodes[0].textContent = value;
    nodes.slice(1).forEach(node => node.textContent = "");
  } else if (element.childElementCount === 0) element.textContent = value;
  else element.insertBefore(document.createTextNode(value), element.firstChild);
}

function applyVisualElementStyle(element: HTMLElement, values: VisualElementStyle) {
  if (typeof values.font_size === "number") element.style.fontSize = `${values.font_size}px`;
  if (typeof values.height === "number") element.style.height = `${values.height}px`;
  if (typeof values.hidden === "boolean") element.style.display = values.hidden ? "none" : "";
  if (values.color) element.style.color = values.color;
  if (values.background_color) element.style.backgroundColor = values.background_color;
  if (values.background_image) element.style.backgroundImage = `url(${JSON.stringify(values.background_image)})`;
  if (values.background_image === "") element.style.backgroundImage = "none";
  if (typeof values.x === "number" && typeof values.y === "number" && typeof values.width === "number" && typeof values.height === "number") {
    const canvas = element.closest<HTMLElement>("main.page-layout-canvas");
    const parent = element.offsetParent instanceof HTMLElement ? element.offsetParent : element.parentElement;
    if (canvas && parent) {
      preserveElementFlowSpace(element);
      if (window.getComputedStyle(parent).position === "static") parent.style.position = "relative";
      const canvasRect = canvas.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      element.style.position = "absolute";
      element.style.left = `${values.x - (parentRect.left - canvasRect.left + parent.clientLeft - parent.scrollLeft)}px`;
      element.style.top = `${values.y - (parentRect.top - canvasRect.top + parent.clientTop - parent.scrollTop)}px`;
      element.style.width = `${values.width}px`;
      element.style.height = `${values.height}px`;
      element.style.zIndex = "2";
      if (element instanceof HTMLImageElement) element.style.objectFit = "cover";
      else element.style.backgroundSize = "cover";
    }
  }
  if (values.text_align) element.style.textAlign = values.text_align;
  if (values.font_weight) element.style.fontWeight = values.font_weight;
  if (typeof values.text_content === "string") setDirectTextContent(element, values.text_content);
  if (element instanceof HTMLAnchorElement && typeof values.link_url === "string") values.link_url ? element.href = values.link_url : element.removeAttribute("href");
  if (element instanceof HTMLImageElement) {
    if (values.image_url) element.src = values.image_url;
    if (typeof values.image_alt === "string") element.alt = values.image_alt;
  }
  if ((element instanceof HTMLAnchorElement || element instanceof HTMLButtonElement) && typeof values.link_label === "string") {
    const textNode = Array.from(element.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
    if (textNode) textNode.textContent = values.link_label;
    else if (element.childElementCount === 0) element.textContent = values.link_label;
    else element.insertBefore(document.createTextNode(values.link_label), element.firstChild);
  }
}

function postVisualEdit(message: Record<string, unknown>) {
  if (window.parent !== window) window.parent.postMessage({ source: "mna-visual-editor", ...message }, window.location.origin);
}

export function PageCopyProvider({ children }: { children: ReactNode }) {
  const [copy, setCopy] = useState(defaultPageCopy);
  const [layouts, setLayouts] = useState<Record<string, Record<string, CopyElementLayout>>>({});
  const [visualElements, setVisualElements] = useState<Record<string, Record<string, VisualElementStyle>>>({});
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
      setVisualElements(Object.fromEntries(Object.entries(saved).map(([page, fields]) => [page, fields.visual_elements && typeof fields.visual_elements === "object" ? fields.visual_elements as Record<string, VisualElementStyle> : {}])));
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
      if (event.data.type === "replace-visual-elements" && event.data.elements && typeof event.data.elements === "object") setVisualElements(current => ({ ...current, [event.data.page]: event.data.elements }));
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("main.page-layout-canvas");
    if (!root) return;
    const activeRoot = root;
    const page = visualPageSlug();
    const applySaved = () => root.querySelectorAll<HTMLElement>("*").forEach(element => {
      if (element.closest(".visual-edit-toolbar,.visual-property-panel,.visual-copy-tools,.visual-element-tools,.visual-block-controls")) return;
      const values = visualElements[page]?.[visualElementKey(element, root)];
      if (values) applyVisualElementStyle(element, values);
    });
    applySaved();
    const observer = new MutationObserver(applySaved);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [visualElements]);
  return <PageCopyContext.Provider value={copy}><PageLayoutContext.Provider value={{ data: layouts, setData: setLayouts }}><PageBlocksContext.Provider value={{ data: blocks, setData: setBlocks }}><VisualEditContext.Provider value={visualEdit}>{children}{visualEdit && <><VisualEditToolbar /><VisualElementInspector valueMap={visualElements} setValueMap={setVisualElements} /></>}</VisualEditContext.Provider></PageBlocksContext.Provider></PageLayoutContext.Provider></PageCopyContext.Provider>;
}

function colorInputValue(value: string) {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^rgba\([^)]*,\s*0\)$/.test(value)) return "#ffffff";
  const rgb = value.match(/\d+/g)?.slice(0, 3).map(channel => Number(channel).toString(16).padStart(2, "0"));
  return rgb?.length === 3 ? `#${rgb.join("")}` : "#ffffff";
}

function VisualElementInspector({ valueMap, setValueMap }: { valueMap: Record<string, Record<string, VisualElementStyle>>; setValueMap: Dispatch<SetStateAction<Record<string, Record<string, VisualElementStyle>>>> }) {
  const pageBlocks = useContext(PageBlocksContext);
  const [selected, setSelected] = useState<HTMLElement | null>(null);
  const [values, setValues] = useState<VisualElementStyle>({});
  const [imageUploadStatus, setImageUploadStatus] = useState("");
  const keyRef = useRef("");
  const pageRef = useRef("");
  const selectedRef = useRef<HTMLElement | null>(null);
  const valueMapRef = useRef(valueMap);
  selectedRef.current = selected;
  valueMapRef.current = valueMap;
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("main.page-layout-canvas");
    if (!root) return;
    const activeRoot = root;
    function selectElement(event: MouseEvent) {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (!target) return;
      if (target.closest(".visual-edit-toolbar,.visual-property-panel,.visual-copy-tools,.visual-element-tools,.visual-image-move-handle,.visual-image-resize-handle,.visual-block-controls,.visual-section-editor-controls,.visual-section-resize-handle,input,textarea,select")) return;
      const clearSelection = () => {
        selectedRef.current?.classList.remove("visual-element-selected");
        selectedRef.current = null;
        setSelected(null);
      };
      if (!activeRoot.contains(target) || target === activeRoot) {
        clearSelection();
        return;
      }
      // Make a callout a generous click target: clicking its background or
      // copy selects the whole callout. Links and images remain independently
      // selectable so their destination/source can still be edited.
      const callout = findVisualCallout(target);
      const specificElement = target.closest<HTMLElement>("img") ?? target.closest<HTMLElement>("button") ?? target.closest<HTMLElement>("a");
      const element = specificElement ?? callout ?? target.closest<HTMLElement>("main.page-layout-canvas *");
      if (!element || element === activeRoot || ["SCRIPT", "STYLE", "SVG", "PATH", "IFRAME"].includes(element.tagName)) {
        clearSelection();
        return;
      }
      if (element instanceof HTMLAnchorElement || element instanceof HTMLButtonElement || target.closest("a,button")) {
        event.preventDefault();
        event.stopPropagation();
      }
      selectedRef.current?.classList.remove("visual-element-selected");
      const page = visualPageSlug();
      const key = visualElementKey(element, activeRoot);
      pageRef.current = page; keyRef.current = key;
      element.dataset.visualKey = key;
      element.classList.add("visual-element-selected");
      setSelected(element);
      const saved = valueMapRef.current[page]?.[key] ?? {};
      const computed = window.getComputedStyle(element);
      const backgroundImage = saved.background_image ?? backgroundImageUrl(computed.backgroundImage);
      setValues({
        ...saved,
        font_size: saved.font_size ?? (Number.parseFloat(computed.fontSize) || 16),
        color: saved.color ?? colorInputValue(computed.color),
        background_color: saved.background_color ?? colorInputValue(computed.backgroundColor),
        background_image: backgroundImage,
        text_align: saved.text_align ?? (computed.textAlign === "center" || computed.textAlign === "right" ? computed.textAlign : "left"),
        font_weight: saved.font_weight ?? (["500", "600", "700"].includes(computed.fontWeight) ? computed.fontWeight as VisualElementStyle["font_weight"] : "normal"),
        ...(element instanceof HTMLAnchorElement ? { link_url: saved.link_url ?? element.getAttribute("href") ?? "", link_label: saved.link_label ?? visualElementLabel(element) } : {}),
        ...(element instanceof HTMLButtonElement ? { link_label: saved.link_label ?? visualElementLabel(element) } : {}),
        ...(element instanceof HTMLImageElement ? { image_url: saved.image_url ?? element.getAttribute("src") ?? "", image_alt: saved.image_alt ?? element.alt } : {}),
        ...(element instanceof HTMLImageElement ? {} : { text_content: saved.text_content ?? directTextContent(element) }),
      });
    }
    document.addEventListener("click", selectElement, true);
    return () => { document.removeEventListener("click", selectElement, true); selectedRef.current?.classList.remove("visual-element-selected"); };
  }, []);
  useEffect(() => {
    if (!selected) return;
    const image = selected;
    const canvas = image.closest<HTMLElement>("main.page-layout-canvas");
    if (!canvas) return;
    const activeCanvas = canvas;
    const root = document.querySelector<HTMLElement>("main.page-layout-canvas");
    if (!root) return;
    const key = keyRef.current;
    const saved = valueMapRef.current[pageRef.current]?.[key] ?? {};
    const startRect = image.getBoundingClientRect();
    const canvasRect = activeCanvas.getBoundingClientRect();
    const initial = {
      x: saved.x ?? startRect.left - canvasRect.left,
      y: saved.y ?? startRect.top - canvasRect.top,
      width: saved.width ?? startRect.width,
      height: saved.height ?? startRect.height,
    };
    const moveButton = document.createElement("button");
    const resizeButton = document.createElement("button");
    moveButton.type = resizeButton.type = "button";
    moveButton.className = "visual-image-move-handle";
    resizeButton.className = "visual-image-resize-handle";
    moveButton.textContent = "⠿";
    resizeButton.textContent = "↘";
    moveButton.title = "Drag to move selected element";
    resizeButton.title = "Drag to resize selected element";
    moveButton.setAttribute("aria-label", "Drag to move selected element");
    resizeButton.setAttribute("aria-label", "Drag to resize selected element");
    document.body.append(moveButton, resizeButton);
    let geometry = { ...initial };
    function apply(next: typeof initial) {
      geometry = next;
      const parent = image.offsetParent instanceof HTMLElement ? image.offsetParent : image.parentElement;
      if (!parent) return;
      preserveElementFlowSpace(image);
      if (window.getComputedStyle(parent).position === "static") parent.style.position = "relative";
      const rect = parent.getBoundingClientRect();
      const canvasNow = activeCanvas.getBoundingClientRect();
      image.style.position = "absolute";
      image.style.left = `${next.x - (rect.left - canvasNow.left + parent.clientLeft - parent.scrollLeft)}px`;
      image.style.top = `${next.y - (rect.top - canvasNow.top + parent.clientTop - parent.scrollTop)}px`;
      image.style.width = `${next.width}px`;
      image.style.height = `${next.height}px`;
      if (image instanceof HTMLImageElement) image.style.objectFit = "cover";
      else if (window.getComputedStyle(image).backgroundImage !== "none") image.style.backgroundSize = "cover";
      image.style.zIndex = "2";
      syncHandles();
    }
    function syncHandles() {
      const rect = image.getBoundingClientRect();
      moveButton.style.left = `${rect.left - 12}px`;
      moveButton.style.top = `${rect.top - 12}px`;
      resizeButton.style.left = `${rect.right - 12}px`;
      resizeButton.style.top = `${rect.bottom - 12}px`;
    }
    function drag(event: PointerEvent, mode: "move" | "resize") {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startY = event.clientY;
      const origin = { ...geometry };
      function onMove(pointer: PointerEvent) {
        const dx = pointer.clientX - startX;
        const dy = pointer.clientY - startY;
        apply(mode === "move"
          ? { ...origin, x: origin.x + dx, y: origin.y + dy }
          : { ...origin, width: Math.max(40, origin.width + dx), height: Math.max(40, origin.height + dy) });
      }
      function onUp() {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        const patch = { x: Math.round(geometry.x), y: Math.round(geometry.y), width: Math.round(geometry.width), height: Math.round(geometry.height) };
        setValueMap(current => ({ ...current, [pageRef.current]: { ...current[pageRef.current], [key]: { ...current[pageRef.current]?.[key], ...patch } } }));
        postVisualEdit({ type: "visual-element-change", page: pageRef.current, key, patch });
      }
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp, { once: true });
    }
    const onScroll = () => syncHandles();
    moveButton.addEventListener("pointerdown", event => drag(event, "move"));
    resizeButton.addEventListener("pointerdown", event => drag(event, "resize"));
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    syncHandles();
    return () => {
      moveButton.remove(); resizeButton.remove();
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [selected, setValueMap]);
  const calloutTarget = selected ? findVisualCallout(selected) : null;
  const sectionTarget = selected ? findVisualSection(selected) : null;
  useEffect(() => {
    if (!sectionTarget) return;
    const target = sectionTarget;
    const root = document.querySelector<HTMLElement>("main.page-layout-canvas");
    if (!root) return;
    const activeRoot = root;
    const originalPosition = target.style.position;
    if (window.getComputedStyle(target).position === "static") target.style.position = "relative";
    const controls = document.createElement("div");
    controls.className = "visual-section-editor-controls";
    const deleteButton = calloutTarget ? document.createElement("button") : null;
    if (deleteButton) {
      deleteButton.type = "button";
      deleteButton.className = "visual-delete-callout";
      deleteButton.textContent = "Delete callout";
    }
    const handle = document.createElement("div");
    handle.className = "visual-section-resize-handle";
    handle.title = "Drag this bottom border up or down to resize the section";
    handle.setAttribute("role", "separator");
    handle.setAttribute("aria-label", "Drag the section bottom border to resize its height");
    handle.textContent = "↕ Drag bottom border to resize";
    if (deleteButton) controls.append(deleteButton);
    target.appendChild(controls);
    target.appendChild(handle);
    function onDelete() {
      if (!calloutTarget || !window.confirm("Delete this callout from the page? Save the page to publish this change.")) return;
      const blockId = target.closest<HTMLElement>("[data-page-block-id]")?.dataset.pageBlockId;
      if (blockId) {
        postVisualEdit({ type: "delete-block", page: pageRef.current, blockId });
      } else {
        const page = pageRef.current;
        const key = visualElementKey(target, activeRoot);
        target.dataset.visualKey = key;
        applyVisualElementStyle(target, { hidden: true });
        setValueMap(current => ({ ...current, [page]: { ...current[page], [key]: { ...current[page]?.[key], hidden: true } } }));
        postVisualEdit({ type: "visual-element-change", page, key, patch: { hidden: true } });
      }
      selectedRef.current?.classList.remove("visual-element-selected");
      selectedRef.current = null;
      setSelected(null);
    }
    function onPointerDown(event: PointerEvent) {
      event.preventDefault();
      event.stopPropagation();
      const startY = event.clientY;
      const startHeight = target.getBoundingClientRect().height;
      target.style.height = `${startHeight}px`;
      function onPointerMove(pointer: PointerEvent) {
        target.style.height = `${Math.max(80, startHeight + pointer.clientY - startY)}px`;
      }
      function onPointerUp() {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        const height = Math.round(target.getBoundingClientRect().height);
        const page = pageRef.current;
        const key = visualElementKey(target, activeRoot);
        target.dataset.visualKey = key;
        setValueMap(current => ({ ...current, [page]: { ...current[page], [key]: { ...current[page]?.[key], height } } }));
        postVisualEdit({ type: "visual-element-change", page, key, patch: { height } });
      }
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp, { once: true });
    }
    deleteButton?.addEventListener("click", onDelete);
    handle.addEventListener("pointerdown", onPointerDown);
    return () => {
      deleteButton?.removeEventListener("click", onDelete);
      handle.removeEventListener("pointerdown", onPointerDown);
      controls.remove();
      handle.remove();
      target.style.position = originalPosition;
    };
  }, [calloutTarget, sectionTarget, setValueMap]);
  function update<K extends keyof VisualElementStyle>(key: K, value: VisualElementStyle[K]) {
    if (!selected) return;
    const patch = { [key]: value } as Pick<VisualElementStyle, K>;
    const next = { ...values, ...patch };
    setValues(next);
    applyVisualElementStyle(selected, patch);
    setValueMap(current => ({ ...current, [pageRef.current]: { ...current[pageRef.current], [keyRef.current]: { ...current[pageRef.current]?.[keyRef.current], ...patch } } }));
    postVisualEdit({ type: "visual-element-change", page: pageRef.current, key: keyRef.current, patch });
  }
  if (!selected) return null;
  const isAnchor = selected instanceof HTMLAnchorElement;
  const isImage = selected instanceof HTMLImageElement;
  const isButton = selected instanceof HTMLButtonElement;
  const hasBackgroundImage = Boolean(values.background_image);
  const canEditText = !(selected instanceof HTMLImageElement) && (directTextContent(selected).length > 0 || selected.childElementCount === 0);
  const sectionId = selected.closest<HTMLElement>("[data-page-block-id]")?.dataset.pageBlockId;
  const imageBlock = isImage && sectionId ? (pageBlocks.data[pageRef.current] ?? []).find(block => block.id === sectionId && block.type === "image") : undefined;
  const isCallout = Boolean(calloutTarget);
  function deleteCallout() {
    if (!calloutTarget || !window.confirm("Delete this callout from the page? Save the page to publish this change.")) return;
    const blockId = calloutTarget.closest<HTMLElement>("[data-page-block-id]")?.dataset.pageBlockId;
    if (blockId) {
      postVisualEdit({ type: "delete-block", page: pageRef.current, blockId });
    } else {
      const root = document.querySelector<HTMLElement>("main.page-layout-canvas");
      if (!root) return;
      const key = visualElementKey(calloutTarget, root);
      calloutTarget.dataset.visualKey = key;
      applyVisualElementStyle(calloutTarget, { hidden: true });
      setValueMap(current => ({ ...current, [pageRef.current]: { ...current[pageRef.current], [key]: { ...current[pageRef.current]?.[key], hidden: true } } }));
      postVisualEdit({ type: "visual-element-change", page: pageRef.current, key, patch: { hidden: true } });
    }
    selected?.classList.remove("visual-element-selected");
    selectedRef.current = null;
    setSelected(null);
  }
  function deleteSelectedElement() {
    if (!selected || !window.confirm("Hide this element from the page? Save visual changes to publish the removal.")) return;
    const root = document.querySelector<HTMLElement>("main.page-layout-canvas");
    if (!root) return;
    const key = visualElementKey(selected, root);
    selected.dataset.visualKey = key;
    applyVisualElementStyle(selected, { hidden: true });
    setValueMap(current => ({ ...current, [pageRef.current]: { ...current[pageRef.current], [key]: { ...current[pageRef.current]?.[key], hidden: true } } }));
    postVisualEdit({ type: "visual-element-change", page: pageRef.current, key, patch: { hidden: true } });
    selected.classList.remove("visual-element-selected");
    selectedRef.current = null;
    setSelected(null);
  }
  return <aside className="visual-property-panel" data-visual-ui>
    <div className="visual-property-heading"><div><strong>Selected element</strong><small>{selected.tagName.toLowerCase()} · {selected.dataset.visualLabel ?? selected.dataset.copyElement ?? "page content"}</small></div><div className="visual-property-actions">{isCallout && <button type="button" className="visual-delete-callout" onClick={deleteCallout}>Delete callout</button>}<button type="button" className="visual-panel-close" aria-label="Close element settings" title="Close settings" onClick={() => { selected.classList.remove("visual-element-selected"); selectedRef.current = null; setSelected(null); }}>×</button></div></div>
    <details className="visual-settings-group" open><summary>Typography</summary><div className="visual-property-row"><label>Size<input type="number" min="8" max="120" value={values.font_size ?? 16} onChange={event => update("font_size", Math.max(8, Math.min(120, Number(event.target.value) || 16)))} /></label><label>Weight<select value={values.font_weight ?? "normal"} onChange={event => update("font_weight", event.target.value as VisualElementStyle["font_weight"])}><option value="normal">Regular</option><option value="500">Medium</option><option value="600">Semibold</option><option value="700">Bold</option></select></label></div><div className="visual-property-row"><label>Text color<input type="color" value={colorInputValue(values.color ?? "#26382f")} onChange={event => update("color", event.target.value)} /></label><label>Alignment<select value={values.text_align ?? "left"} onChange={event => update("text_align", event.target.value as VisualElementStyle["text_align"])}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label></div></details>
    {canEditText && <details className="visual-settings-group" open><summary>Text</summary><label>Content<textarea rows={4} maxLength={4000} value={values.text_content ?? ""} onChange={event => update("text_content", event.target.value)} /></label></details>}
    <details className="visual-settings-group"><summary>Background</summary><label>Color<input type="color" value={colorInputValue(values.background_color ?? "#ffffff")} onChange={event => update("background_color", event.target.value)} /></label></details>
    {(isAnchor || isButton) && <details className="visual-settings-group"><summary>{isAnchor ? "Link" : "Button"}</summary>{isAnchor && <label>Destination<input value={values.link_url ?? ""} onChange={event => update("link_url", event.target.value)} /></label>}<label>Label<input value={values.link_label ?? ""} onChange={event => update("link_label", event.target.value)} /></label></details>}
    {(isImage || hasBackgroundImage) && <details className="visual-settings-group" open><summary>Image</summary>{isImage ? <><img className="visual-image-edit-preview" src={values.image_url ?? selected.getAttribute("src") ?? ""} alt="" /><label>Image source URL<input value={values.image_url ?? ""} onChange={event => update("image_url", event.target.value)} /></label><label>Alternative text<input value={values.image_alt ?? ""} onChange={event => update("image_alt", event.target.value)} /></label></> : <><div className="visual-image-edit-preview visual-image-edit-background" style={{ backgroundImage: values.background_image ? `url(${JSON.stringify(values.background_image)})` : "none" }} role="img" aria-label="Selected background image preview" /><label>Image source URL<input value={values.background_image ?? ""} onChange={event => update("background_image", event.target.value)} /></label></>}</details>}
    <button type="button" className="visual-delete-element" onClick={deleteSelectedElement}>Delete selected element</button>
    {sectionId && !isCallout && <button type="button" className="visual-remove-section" onClick={() => { if (!window.confirm("Delete this section from the page? Save the page to publish this change.")) return; postVisualEdit({ type: "delete-block", page: pageRef.current, blockId: sectionId }); selected.classList.remove("visual-element-selected"); selectedRef.current = null; setSelected(null); }}>Delete section</button>}
    <p>Changes publish when saved in the admin page.</p>
  </aside>;
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
    element.style.position = ""; element.style.left = ""; element.style.top = ""; element.style.width = ""; element.style.minHeight = "";
    preserveElementFlowSpace(element);
    applyFreeCopyLayout(element, canvas, layout);
  }, [layout]);
  function adjust(event: ReactPointerEvent<HTMLButtonElement>, mode: "move" | "resize") {
    event.preventDefault(); event.stopPropagation();
    const element = event.currentTarget.closest<HTMLElement>("[data-copy-element]");
    const canvas = document.querySelector<HTMLElement>("main.page-layout-canvas");
    if (!element || !canvas) return;
    const activeCanvas = canvas;
    const activeElement = element;
    const canvasRect = canvas.getBoundingClientRect(); const visualRect = element.getBoundingClientRect();
    const visualX = visualRect.left - canvasRect.left; const visualY = visualRect.top - canvasRect.top;
    const current: CopyElementLayout = { x: layout?.unit === "free" ? layout.x : visualX, y: layout?.unit === "free" ? layout.y : visualY, width: layout?.unit === "free" ? layout.width : visualRect.width, height: layout?.unit === "free" ? layout.height : visualRect.height, unit: "free" };
    preserveElementFlowSpace(activeElement);
    const startX = event.clientX; const startY = event.clientY;
    function apply(next: CopyElementLayout) {
      applyFreeCopyLayout(activeElement, activeCanvas, next);
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
  const [open, setOpen] = useState(false);
  return <aside className="visual-edit-toolbar"><button type="button" className="visual-add-toggle" aria-label="Add content" aria-expanded={open} onClick={() => setOpen(value => !value)}>＋</button>{open && <div className="visual-add-menu"><strong>Add to page</strong><span>New text, image, and video items start in the center. Drag them into place when ready.</span>{(["text", "image", "video", "callout"] as PageBlockType[]).map(type => <button type="button" key={type} onClick={() => { const canvas = document.querySelector<HTMLElement>("main.page-layout-canvas"); const bounds = canvas?.getBoundingClientRect(); const size = type === "video" ? { width: 420, height: 250 } : type === "image" ? { width: 360, height: 230 } : type === "text" ? { width: 340, height: 64 } : { width: 340, height: 170 }; const position = type !== "callout" && bounds ? { x: Math.max(12, (bounds.width - size.width) / 2), y: Math.max(12, window.scrollY + (window.innerHeight - size.height) / 2 - bounds.top), ...size } : undefined; postVisualEdit({ type: "add-block", page: new URLSearchParams(window.location.search).get("page") || window.location.pathname.split("/").filter(Boolean).pop() || "home", blockType: type, ...(position ? { floatingPosition: position } : {}) }); setOpen(false); }}>＋ {type}</button>)}</div>}</aside>;
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

const imageFitOptions: { value: PageImageFit; label: string }[] = [
  { value: "cover", label: "Crop to fill" },
  { value: "contain", label: "Fit whole image" },
  { value: "fill", label: "Stretch to fill" },
  { value: "none", label: "Original size" },
  { value: "scale-down", label: "Scale down if needed" },
];

function pageImageStyle(block: PageBlock) {
  const fit = block.image_fit ?? "cover";
  return fit === "none"
    ? { width: "auto", height: "auto", maxWidth: "none", maxHeight: "none", objectFit: "none" as const }
    : { width: "100%", height: "100%", maxWidth: "100%", maxHeight: "100%", objectFit: fit };
}

export function PageBlocks({ page }: { page: string }) {
  const blocksContext = useContext(PageBlocksContext);
  const blocks = blocksContext.data[page] ?? [];
  const visualEdit = useContext(VisualEditContext);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [imageUploadStatus, setImageUploadStatus] = useState<Record<string, string>>({});
  if (!blocks.length) return null;
  function reorderBlocks(event: DragEvent<HTMLElement>, targetId: string) {
    event.preventDefault();
    event.stopPropagation();
    if (!draggedBlockId || draggedBlockId === targetId) return;
    const target = blocks.find(item => item.id === targetId);
    const movingBlock = blocks.find(item => item.id === draggedBlockId);
    if (target?.type === "callout" && !target.parent_id && movingBlock && movingBlock.type !== "callout") {
      updateBlock(movingBlock.id, { parent_id: target.id });
      setDraggedBlockId(null);
      return;
    }
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
  async function uploadPageImage(blockId: string, file: File) {
    setImageUploadStatus(current => ({ ...current, [blockId]: "Uploading image…" }));
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await fetch("/api/admin/page-images", { method: "POST", credentials: "include", body: form });
      const result = await response.json().catch(() => ({})) as { url?: string; detail?: string };
      if (!response.ok || !result.url) throw new Error(result.detail || "Could not upload the image.");
      updateBlock(blockId, { image_url: result.url });
      setImageUploadStatus(current => ({ ...current, [blockId]: "Image uploaded." }));
    } catch (error) {
      setImageUploadStatus(current => ({ ...current, [blockId]: error instanceof Error ? error.message : "Could not upload the image." }));
    }
  }
  function beginElementAdjust(event: ReactPointerEvent<HTMLButtonElement>, block: PageBlock, slot: string, mode: "move" | "resize") {
    event.preventDefault();
    event.stopPropagation();
    const canvas = event.currentTarget.closest(".page-builder-inner");
    if (!(canvas instanceof HTMLElement)) return;
    const canvasRect = canvas.getBoundingClientRect();
    if (!canvas.classList.contains("page-builder-positioned")) canvas.style.minHeight = `${canvasRect.height}px`;
    canvas.classList.add("page-builder-positioned");
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
  function renderNestedBlock(block: PageBlock) {
    const embedUrl = block.type === "video" ? embedVideoUrl(block.video_url ?? "") : "";
    return <article key={block.id} data-page-block-id={block.id} className={`page-builder-nested-block page-builder-${block.type}`}>
      {block.type === "text" ? <p className="page-builder-nested-single-text" contentEditable={visualEdit} suppressContentEditableWarning onBlur={event => visualEdit && updateBlock(block.id, { body: event.currentTarget.innerText })}>{block.body || (visualEdit ? "Click to edit text" : "")}</p> : <>
      {block.type === "image" && block.image_url && <figure className={`page-builder-image-fit-${block.image_fit ?? "cover"}`}><img src={block.image_url} alt={block.image_alt ?? ""} style={{ objectFit: block.image_fit ?? "cover" }} />{(block.caption || visualEdit) && <figcaption contentEditable={visualEdit} suppressContentEditableWarning onBlur={event => visualEdit && updateBlock(block.id, { caption: event.currentTarget.innerText })}>{block.caption || "Click to add a caption"}</figcaption>}</figure>}
      {block.type === "video" && embedUrl && <div className="page-builder-video"><iframe src={embedUrl} title={block.heading || "Mother Nature Academy video"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>}
      {(block.heading || block.body || visualEdit) && <div className="page-builder-nested-copy"><h3 contentEditable={visualEdit} suppressContentEditableWarning onBlur={event => visualEdit && updateBlock(block.id, { heading: event.currentTarget.innerText })}>{block.heading || (visualEdit ? "Click to add a heading" : "")}</h3><p contentEditable={visualEdit} suppressContentEditableWarning onBlur={event => visualEdit && updateBlock(block.id, { body: event.currentTarget.innerText })}>{block.body || (visualEdit ? "Click to add text" : "")}</p></div>}
      </>}
      {visualEdit && <div className="visual-nested-controls">{block.type === "image" && <><label>Image URL<input value={block.image_url ?? ""} onChange={event => updateBlock(block.id, { image_url: event.target.value })} /></label><label>Display style<select value={block.image_fit ?? "cover"} onChange={event => updateBlock(block.id, { image_fit: event.target.value as PageBlock["image_fit"] })}>{imageFitOptions.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label></>}{block.type === "video" && <label>YouTube URL<input value={block.video_url ?? ""} onChange={event => updateBlock(block.id, { video_url: event.target.value })} /></label>}<button type="button" draggable onDragStart={() => setDraggedBlockId(block.id)} onDragEnd={() => setDraggedBlockId(null)} title="Drag this element onto another callout to move it">⠿ Move to another callout</button><button type="button" onClick={() => { if (window.confirm("Remove this element from the callout? Save the page to publish the change.")) postVisualEdit({ type: "delete-block", page, blockId: block.id }); }}>Remove element</button></div>}
    </article>;
  }
  return <div className="page-builder-sections">{blocks.filter(block => !block.parent_id).map(block => {
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
    const floating = Boolean(block.floating_position && !block.parent_id);
    const floatingText = floating && block.type === "text";
    const floatingImage = floating && block.type === "image";
    const floatingVideo = floating && block.type === "video";
    const hasCalloutCopy = Boolean(block.heading || block.body || block.button_label);
    const emptyCallout = block.type === "callout" && !hasCalloutCopy && !blocks.some(child => child.parent_id === block.id);
    const float = block.floating_position;
    return <section data-page-block-id={block.id} className={`page-builder-block page-builder-${block.type} page-builder-layout-${layout}${positioned ? " page-builder-custom-layout" : ""}${emptyCallout ? " page-builder-empty-callout" : ""}${floating ? " page-builder-floating-element" : ""}${floatingText ? " page-builder-floating-text" : ""}${floatingImage ? " page-builder-floating-image" : ""}${floatingVideo ? " page-builder-floating-video" : ""}${visualEdit && floatingVideo ? " visual-video-editable" : ""}${draggedBlockId === block.id ? " visual-block-dragging" : ""}`} key={block.id} style={{ backgroundColor: background, color: readableTextColor(background), ...(floating && float ? { left: float.x, top: float.y, width: float.width, ...(!floatingText ? { height: float.height } : { minHeight: float.height }) } : {}) }} onDragOver={event => visualEdit && event.preventDefault()} onDrop={event => {
      if (visualEdit && floatingImage && event.dataTransfer.files.length) {
        event.preventDefault(); event.stopPropagation(); void uploadPageImage(block.id, event.dataTransfer.files[0]); return;
      }
      if (visualEdit) reorderBlocks(event, block.id);
    }}>
      <div className={`container page-builder-inner${positioned ? " page-builder-positioned" : ""}`}>
        {floatingText ? <p className="page-builder-single-text" contentEditable={visualEdit} suppressContentEditableWarning onBlur={event => visualEdit && updateBlock(block.id, { body: event.currentTarget.innerText })} data-visual-label="Text">{block.body || (visualEdit ? "Click to edit text" : "")}</p> : floatingImage ? block.image_url ? <figure className="page-builder-image-only" data-layout-slot="media" style={slotStyle("media")}><img src={block.image_url} alt={block.image_alt ?? ""} style={pageImageStyle(block)} />{block.caption && <figcaption contentEditable={visualEdit} suppressContentEditableWarning onBlur={event => visualEdit && updateBlock(block.id, { caption: event.currentTarget.innerText })} data-visual-label="image caption">{block.caption}</figcaption>}{tools("media")}</figure> : visualEdit && <div className="page-builder-media-placeholder page-builder-image-placeholder" data-layout-slot="media">Drop an image here, or hover to upload</div> : floatingVideo ? embedUrl ? <div className="page-builder-video page-builder-video-only" data-layout-slot="media" style={slotStyle("media")}><iframe src={embedUrl} title="Mother Nature Academy video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />{tools("media")}</div> : visualEdit && <div className="page-builder-media-placeholder page-builder-video-placeholder" data-layout-slot="media">Add a YouTube URL in the video controls</div> : <>
        {block.type === "image" && block.image_url && <figure className={`page-builder-image-fit-${block.image_fit ?? "cover"}`} data-layout-slot="media" style={slotStyle("media")}><img src={block.image_url} alt={block.image_alt ?? ""} style={{ objectFit: block.image_fit ?? "cover" }} />{(block.caption || visualEdit) && <figcaption contentEditable={visualEdit} suppressContentEditableWarning onBlur={event => visualEdit && updateBlock(block.id, { caption: event.currentTarget.innerText })} data-visual-label="image caption">{block.caption || (visualEdit ? "Click to add a caption" : "")}</figcaption>}{tools("media")}</figure>}
        {visualEdit && !block.image_url && block.type === "image" && <div className="page-builder-media-placeholder" data-layout-slot="media">Add an image URL in the controls</div>}
        {block.type === "video" && embedUrl && <div className="page-builder-video" data-layout-slot="media" style={slotStyle("media")}><iframe src={embedUrl} title={block.heading || "Mother Nature Academy video"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />{tools("media")}</div>}
        {visualEdit && !embedUrl && block.type === "video" && <div className="page-builder-media-placeholder" data-layout-slot="media">Add a YouTube URL in the controls</div>}
        {(block.type !== "callout" || hasCalloutCopy) && <div className="page-builder-copy" data-layout-slot="copy" style={slotStyle("copy")}><h2 contentEditable={visualEdit} suppressContentEditableWarning onBlur={event => visualEdit && updateBlock(block.id, { heading: event.currentTarget.innerText })} data-visual-label="section heading">{block.heading || (block.type !== "callout" && visualEdit ? "Click to add a heading" : "")}</h2><p contentEditable={visualEdit} suppressContentEditableWarning onBlur={event => visualEdit && updateBlock(block.id, { body: event.currentTarget.innerText })} data-visual-label="section text">{block.body || (block.type !== "callout" && visualEdit ? "Click to add section text" : "")}</p>{block.type === "callout" && block.button_label && block.button_url && <a className="button" href={block.button_url}>{block.button_label} <span>↗</span></a>}{tools("copy")}</div>}
        </>}
      </div>
      {block.type === "callout" && blocks.some(child => child.parent_id === block.id) && <div className="page-builder-nested-elements">{blocks.filter(child => child.parent_id === block.id).map(renderNestedBlock)}</div>}
      {visualEdit && floatingImage && <div className="visual-block-controls visual-image-only-controls" contentEditable={false}><label>Image URL<input value={block.image_url ?? ""} onChange={event => updateBlock(block.id, { image_url: event.target.value })} /></label><label>Alt text<input value={block.image_alt ?? ""} onChange={event => updateBlock(block.id, { image_alt: event.target.value })} /></label><label>Display style<select value={block.image_fit ?? "cover"} onChange={event => updateBlock(block.id, { image_fit: event.target.value as PageBlock["image_fit"] })}>{imageFitOptions.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label><label className="visual-image-upload">Upload from this device<input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void uploadPageImage(block.id, file); }} /></label>{imageUploadStatus[block.id] && <span className="visual-image-upload-status" role="status">{imageUploadStatus[block.id]}</span>}</div>}
      {visualEdit && floatingVideo && <div className="visual-block-controls visual-video-only-controls" contentEditable={false}><label>YouTube URL<input value={block.video_url ?? ""} onChange={event => updateBlock(block.id, { video_url: event.target.value })} /></label></div>}
      {visualEdit && !floatingText && !floatingImage && !floatingVideo && <div className="visual-block-controls" contentEditable={false}><label title="Change section background">Background<input type="color" value={background} onChange={event => { const color = event.target.value; const section = event.currentTarget.closest(".page-builder-block"); if (section instanceof HTMLElement) { section.style.backgroundColor = color; section.style.color = readableTextColor(color); } updateBlock(block.id, { background: color }); }} /></label>{block.type === "image" && <><label>Image URL<input value={block.image_url ?? ""} onChange={event => updateBlock(block.id, { image_url: event.target.value })} /></label><label>Alt text<input value={block.image_alt ?? ""} onChange={event => updateBlock(block.id, { image_alt: event.target.value })} /></label><label>Display style<select value={block.image_fit ?? "cover"} onChange={event => updateBlock(block.id, { image_fit: event.target.value as PageBlock["image_fit"] })}>{imageFitOptions.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label></>}{block.type === "video" && <label>YouTube URL<input value={block.video_url ?? ""} onChange={event => updateBlock(block.id, { video_url: event.target.value })} /></label>}<button type="button" draggable onDragStart={() => setDraggedBlockId(block.id)} onDragEnd={() => setDraggedBlockId(null)} title="Drag this handle onto another section to reorder">⠿ Drag section</button><button type="button" onClick={() => { if (window.confirm(`Delete this ${block.type === "callout" ? "callout" : "section"} from the page? Save the page to publish this change.`)) postVisualEdit({ type: "delete-block", page, blockId: block.id }); }}>{block.type === "callout" ? "Delete callout" : "Remove section"}</button><span>Use ⠿ and ↘ handles to move or resize content.</span></div>}
    </section>;
  })}</div>;
}
