import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { sendExtensionMessage } from "../../types/Messages";

type SavedItem = { id: string; title: string; url: string; collection?: string; savedAt: string; source?: "bookmark" | "saved" };

function domainOf(url: string) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } }

function flattenBookmarks(nodes: chrome.bookmarks.BookmarkTreeNode[], folders: string[] = []): SavedItem[] {
  const items: SavedItem[] = [];
  nodes.forEach((node) => {
    if (node.url) items.push({ id: `bookmark-${node.id}`, title: node.title || node.url, url: node.url, collection: folders.filter(Boolean).slice(-1)[0] || "Bookmarks", savedAt: new Date().toISOString(), source: "bookmark" });
    if (node.children) items.push(...flattenBookmarks(node.children, node.title ? [...folders, node.title] : folders));
  });
  return items;
}

const SavedView: React.FC = () => {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState("All");
  const [newCollection, setNewCollection] = useState("");
  const [customCollections, setCustomCollections] = useState<string[]>([]);
  const [notice, setNotice] = useState("");

  const refresh = () => chrome.storage.local.get(["savedItems", "savedCollections"], (data) => { setItems(Array.isArray(data.savedItems) ? data.savedItems : []); setCustomCollections(Array.isArray(data.savedCollections) ? data.savedCollections : []); });
  useEffect(() => { refresh(); const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => { if (area !== "local") return; if (changes.savedItems) setItems(changes.savedItems.newValue || []); if (changes.savedCollections) setCustomCollections(changes.savedCollections.newValue || []); }; chrome.storage.onChanged.addListener(listener); return () => chrome.storage.onChanged.removeListener(listener); }, []);
  const collections = useMemo(() => ["All", ...Array.from(new Set(["Inbox", ...customCollections, ...items.map((item) => item.collection || "Inbox")])).sort()], [items, customCollections]);
  const filtered = items.filter((item) => (collection === "All" || (item.collection || "Inbox") === collection) && `${item.title} ${item.url}`.toLowerCase().includes(query.toLowerCase()));
  const persist = (next: SavedItem[]) => chrome.storage.local.set({ savedItems: next });
  const saveCurrent = async () => { const response = await sendExtensionMessage("saved.saveCurrent"); setNotice(response.ok ? ((response.data as any)?.alreadySaved ? "This page is already saved" : "Saved to Inbox") : response.error || "Could not save page"); };
  const importBookmarks = () => chrome.permissions.request({ permissions: ["bookmarks"] }, async (granted) => {
    if (!granted) { setNotice("Bookmark access was not enabled"); return; }
    const tree = await chrome.bookmarks.getTree();
    const imported = flattenBookmarks(tree);
    const seen = new Set(items.map((item) => item.url));
    const unique = imported.filter((item) => !seen.has(item.url));
    persist([...unique, ...items]);
    setNotice(`Imported ${unique.length} bookmark${unique.length === 1 ? "" : "s"}`);
  });
  const move = (id: string, target: string) => persist(items.map((item) => item.id === id ? { ...item, collection: target || "Inbox" } : item));
  const remove = (id: string) => { if (window.confirm("Remove this saved page from FocusTab?")) persist(items.filter((item) => item.id !== id)); };

  return (
    <div className="h-full overflow-y-auto px-8 pb-20 pt-24 text-white custom-scrollbar">
      <div className="mx-auto w-full max-w-[1120px]">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="eyebrow">Bookmarks and saved pages</div><h1 className="mt-2 text-4xl font-semibold">Everything worth returning to.</h1><p className="mt-2 text-white/55">Private, searchable and organised on this device.</p></div><div className="flex gap-2"><button onClick={importBookmarks} className="glass-panel px-4 py-2.5 text-sm">Import Brave bookmarks</button><button onClick={saveCurrent} className="mint-button flex items-center gap-2 px-4 py-2.5 text-sm"><Plus className="h-4 w-4"/>Save current page</button></div></div>
        <div className="mt-6 grid gap-4 md:grid-cols-[220px_1fr]">
          <aside className="glass-panel h-fit p-4"><div className="text-xs uppercase tracking-widest text-white/40">Collections</div><div className="mt-2 space-y-1">{collections.map((name) => <button key={name} onClick={() => setCollection(name)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${collection === name ? "bg-emerald-300/20 text-emerald-100" : "text-white/65 hover:bg-white/5"}`}><span className="truncate">{name}</span><span className="text-xs text-white/35">{name === "All" ? items.length : items.filter((item) => (item.collection || "Inbox") === name).length}</span></button>)}</div><div className="mt-3 flex gap-1"><input value={newCollection} onChange={(e) => setNewCollection(e.target.value)} placeholder="New collection" className="min-w-0 flex-1 rounded-lg bg-black/20 px-2 py-1.5 text-xs outline-none"/><button onClick={() => { const name = newCollection.trim(); if (name) { const next = Array.from(new Set([...customCollections, name])); chrome.storage.local.set({ savedCollections: next }); setCollection(name); setNewCollection(""); } }} className="rounded-lg bg-white/10 px-2">＋</button></div></aside>
          <section><div className="glass-panel flex items-center gap-3 px-4 py-3"><Search className="h-4.5 w-4.5 text-white/55"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search saved pages and bookmarks…" className="flex-1 bg-transparent text-sm outline-none"/></div><div className="mt-3 space-y-2">{filtered.map((item) => <article key={item.id} className="glass-panel flex items-center gap-3 px-4 py-3"><button onClick={() => chrome.tabs.create({ url: item.url })} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 font-semibold">{item.title.charAt(0).toUpperCase()}</button><button onClick={() => chrome.tabs.create({ url: item.url })} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm text-white/90">{item.title}</span><span className="block truncate text-xs text-white/40">{domainOf(item.url)}</span></button><select value={item.collection || "Inbox"} onChange={(e) => move(item.id, e.target.value)} className="max-w-[150px] rounded-lg bg-[#1b2823] px-2 py-1.5 text-xs">{collections.filter((name) => name !== "All").map((name) => <option key={name}>{name}</option>)}{collection !== "All" && !collections.includes(collection) && <option>{collection}</option>}</select><button onClick={() => remove(item.id)} className="text-white/35 hover:text-white" aria-label={`Remove ${item.title}`}><X className="h-4 w-4"/></button></article>)}{filtered.length === 0 && <div className="flex items-center justify-between rounded-xl bg-black/15 px-4 py-3 text-sm text-white/50"><span>{items.length ? "No saved pages match this view." : "Nothing saved yet."}</span><button onClick={items.length ? () => setQuery("") : saveCurrent} className="text-emerald-200">{items.length ? "Clear search" : "Save this page"}</button></div>}</div></section>
        </div>
        {notice && <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-emerald-200 px-4 py-2 text-sm font-medium text-emerald-950">{notice}</div>}
      </div>
    </div>
  );
};

export default SavedView;
