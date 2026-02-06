import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";

const $ = (sel) => document.querySelector(sel);
const treeEl = $("#tree");
const statusEl = $("#status");
const searchEl = $("#search");

mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });

async function loadJson() {
  const res = await fetch("./assets/docs-tree.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load docs-tree.json: ${res.status}`);
  return res.json();
}

function escapeHtml(s) {
  return (s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function buildIndex(node, index = new Map()) {
  index.set(node.id, node);
  (node.children || []).forEach((c) => buildIndex(c, index));
  return index;
}

function nodeMatches(node, q) {
  if (!q) return true;
  const hay = (node.title + " " + node.brief + " " + node.url).toLowerCase();
  return hay.includes(q);
}

function renderTree(node, q) {
  const kids = node.children || [];
  const visibleKids = kids
    .map((c) => renderTree(c, q))
    .filter((x) => x !== null);

  const selfVisible = nodeMatches(node, q);
  const anyChildVisible = visibleKids.length > 0;

  if (!selfVisible && !anyChildVisible) return null;

  const hasChildren = kids.length > 0;
  const wrapper = document.createElement("div");
  wrapper.className = "node";
  wrapper.dataset.id = node.id;

  const row = document.createElement("div");
  row.className = "row";

  const toggle = document.createElement("button");
  toggle.className = "toggle";
  toggle.textContent = hasChildren ? "+" : "•";
  if (!hasChildren) toggle.disabled = true;

  const content = document.createElement("div");
  content.style.flex = "1 1 auto";

  const title = document.createElement("div");
  title.className = "title";
  title.textContent = node.title;

  const brief = document.createElement("div");
  brief.className = "brief";
  brief.textContent = node.brief;

  const meta = document.createElement("div");
  meta.className = "meta";

  const link = document.createElement("a");
  link.className = "link";
  link.href = node.url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "open";

  const copy = document.createElement("button");
  copy.className = "copy";
  copy.textContent = "copy link";
  copy.addEventListener("click", async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(node.url);
      copy.textContent = "copied";
      setTimeout(() => (copy.textContent = "copy link"), 900);
    } catch {
      copy.textContent = "failed";
      setTimeout(() => (copy.textContent = "copy link"), 900);
    }
  });

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = node.stability || "stable";

  meta.append(link, copy, badge);
  content.append(title, brief, meta);
  row.append(toggle, content);
  wrapper.append(row);

  const childrenWrap = document.createElement("div");
  childrenWrap.className = "children";
  childrenWrap.hidden = true;

  visibleKids.forEach((childEl) => childrenWrap.append(childEl));
  if (visibleKids.length) wrapper.append(childrenWrap);

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    childrenWrap.hidden = !childrenWrap.hidden;
    toggle.textContent = childrenWrap.hidden ? "+" : "–";
  });

  title.addEventListener("click", () => window.open(node.url, "_blank", "noreferrer"));

  // auto-expand when filtering so matches are visible
  if (q && visibleKids.length) {
    childrenWrap.hidden = false;
    toggle.textContent = "–";
  }

  return wrapper;
}

function slugToTitle(slug) {
  const acr = new Map([
    ["dwh", "DWH"], ["etl", "ETL"], ["ui", "UI"], ["sdk", "SDK"], ["api", "API"], ["eula", "EULA"],
  ]);
  return slug.split("-").map(w => acr.get(w.toLowerCase()) || (w ? (w[0].toUpperCase()+w.slice(1)) : "")).join(" ");
}

function shortBrief(brief, maxWords=8){
  const words = (brief || "").replaceAll(".", "").split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(" ");
}

function safeId(id){
  return id.replace(/[^A-Za-z0-9_]/g, "_");
}

function buildMermaidFromTree(root){
  const lines = ["flowchart TD"];
  const nodes = [];
  const edges = [];
  const clicks = [];
  function walk(node, parent=null){
    const mid = safeId(node.id);
    const label = `${node.title}\\n${shortBrief(node.brief)}`;
    nodes.push(`  ${mid}["${label.replaceAll('"','\\\"')}"]`);
    if(parent) edges.push(`  ${safeId(parent.id)} --> ${mid}`);
    clicks.push(`  click ${mid} "${node.url}" _blank`);
    (node.children || []).forEach(c => walk(c, node));
  }
  walk(root);
  return [...lines, ...nodes, ...edges, ...clicks].join("\n");
}

async function renderMermaid(root){
  const code = buildMermaidFromTree(root);
  $("#mermaid-src").textContent = code;
  const { svg } = await mermaid.render("diagramSvg", code);
  $("#diagram").innerHTML = svg;
}

function countNodes(node){
  return 1 + (node.children||[]).reduce((a,c)=>a+countNodes(c),0);
}

(async function init(){
  const root = await loadJson();
  const total = countNodes(root);
  statusEl.textContent = `${total} nodes`;
  const index = buildIndex(root);

  function rerender(){
    treeEl.innerHTML = "";
    const q = (searchEl.value || "").trim().toLowerCase();
    const tree = renderTree(root, q);
    if (tree) treeEl.append(tree);
    else treeEl.textContent = "No matches.";
  }

  searchEl.addEventListener("input", rerender);

  rerender();
  await renderMermaid(root);

  // highlight on hash change: #<nodeId>
  window.addEventListener("hashchange", () => {
    const id = location.hash.slice(1);
    if (!id) return;
    const el = treeEl.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  });
})();
