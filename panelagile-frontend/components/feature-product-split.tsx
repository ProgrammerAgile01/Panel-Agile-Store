"use client";

import { Fragment, useEffect, useMemo, useState, useLayoutEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Download,
  Menu as MenuIcon,
  X,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  Loader2,
  Plus,
  ExternalLink,
  Copy,
  FolderOpen,
  Folder,
  FileText,
  Settings,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

import {
  listPanelCatalogProducts,
  panelListFeaturesByProduct,
  panelListMenusByProduct,
  panelUpdateParentFeaturePrice,
} from "@/lib/api";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

/* ================= Types ================= */
interface Product {
  id: string | number;
  product_code: string;
  name: string;
  icon: string;
  description: string;
  category: string;
}
interface MenuGroup {
  group: string;
  modules: MenuModule[];
}
interface MenuModule {
  name: string;
  menus: MenuItem[];
  submenus?: SubMenuItem[];
}
interface MenuItem {
  name: string;
  id: string;
}
interface SubMenuItem {
  menu: string;
  name: string;
  id: string;
}
interface Feature {
  id: string;
  name: string;
  description: string;
  status: boolean;
  parent_id?: string | number | null;
  item_type?: "FEATURE" | "SUBFEATURE" | string;
  module_name?: string;
  children?: Feature[];
  feature_code?: string;
  parent_code?: string;
  price_addon?: number;
  trial_available?: boolean;
  trial_days?: number | null;
}
interface ApiResponse {
  menus: MenuGroup[];
  features: { global: Feature[]; modules: Record<string, Feature[]> };
}

/* ================= Component ================= */
export function FeatureProductSplit() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Features" | "Menus">(
    "All"
  );
  const [groupByModule, setGroupByModule] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"menus" | "features">("menus");

  const [apiData, setApiData] = useState<Record<string, ApiResponse>>({});

  // bedakan loading auto (boot) vs refresh manual (tombol)
  const [loadingKind, setLoadingKind] = useState<null | "boot" | "refresh">(
    null
  );
  const isRefreshing = loadingKind === "refresh";

  // Flag untuk memastikan auto-read sudah selesai dicek (agar placeholder tidak muncul sebelum waktunya)
  const [bootChecked, setBootChecked] = useState(false);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );

  // edit price modal
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Feature | null>(null);
  const [editPrice, setEditPrice] = useState<string>("0");
  const [isSaving, setIsSaving] = useState(false);

  const selectedProductData = products.find(
    (p) => p.product_code === selectedProduct
  );
  const currentData = selectedProduct ? apiData[selectedProduct] : undefined;

  /* --------- Load products from Panel --------- */
  useEffect(() => {
    (async () => {
      try {
        const json = await listPanelCatalogProducts(undefined, 200);
        const rows = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
          ? json
          : [];
        const mapped: Product[] = rows.map((r: any) => ({
          id: r.id ?? r.product_code ?? r.code ?? crypto.randomUUID(),
          product_code:
            String(r.product_code ?? r.code ?? r.slug ?? "").toUpperCase() ||
            "PRODUCT",
          name: String(
            r.product_name ?? r.name ?? r.title ?? r.product_code ?? "Product"
          ),
          icon: "📦",
          description:
            String(r.description ?? r.product_description ?? "") || "",
          category: String(r.category ?? r.product_category ?? "General"),
        }));
        setProducts(mapped);
        if (!selectedProduct && mapped.length > 0)
          setSelectedProduct(mapped[0].product_code);
      } catch (e: any) {
        console.error(
          "[FeatureProductSplit] Load products error:",
          e?.message || e
        );
        toast.error(e?.message || "Failed to load products from Panel.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------- Sinkron filter type ke tab --------- */
  useEffect(() => {
    if (filterType === "Features") setActiveTab("features");
    if (filterType === "Menus") setActiveTab("menus");
  }, [filterType]);

  /* --------- FETCHER (tahu jenis loading) --------- */
  const handleLoadAPI = async (refresh = false, indicate = true) => {
    if (!selectedProduct) return;
    if (indicate) setLoadingKind(refresh ? "refresh" : "boot");
    try {
      const fjson = await panelListFeaturesByProduct(selectedProduct, refresh);
      const frows: any[] = Array.isArray(fjson?.data)
        ? fjson.data
        : Array.isArray(fjson)
        ? fjson
        : [];
        console.log(fjson.data)
      const { global, modules } = splitFeaturesByModule(frows);

      let menusUI: MenuGroup[] = [];
      try {
        const mjson = await panelListMenusByProduct(selectedProduct, refresh);
        const mrows: any[] = Array.isArray(mjson?.data)
          ? mjson.data
          : Array.isArray(mjson)
          ? mjson
          : [];
        menusUI = buildMenusFromMirror(mrows);
      } catch {
        menusUI = [];
      }

      const payload: ApiResponse = {
        menus: menusUI,
        features: { global, modules },
      };
      setApiData((prev) => ({ ...prev, [selectedProduct]: payload }));
    } catch (e: any) {
      console.error("[FeatureProductSplit] Load Error:", e?.message || e);
      toast.error(e?.message || "Failed to load data.");
    } finally {
      if (indicate) setLoadingKind(null);
      else setBootChecked(true); // ← auto-read selesai dicek (silent)
    }
  };

  /* --------- AUTO READ TANPA REFRESH (ANTI-FLICKER) ---------
     Gunakan useLayoutEffect agar penetapan bootChecked/cache terjadi
     sebelum browser melakukan paint, sehingga placeholder tidak sempat muncul. */
  useLayoutEffect(() => {
    if (!selectedProduct) return;
    setBootChecked(false); // reset saat ganti produk (juga sebelum paint)
    // Jika cache sudah ada → tandai selesai sebelum paint dan hindari fetch
    if (apiData[selectedProduct]) {
      setBootChecked(true);
      return;
    }

    // Catatan: tidak menyalakan loader tombol Load karena indicate=false.
    // (lihat argumen kedua)
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    handleLoadAPI(false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  /* --------- UI helpers --------- */
  const toggleGroup = (g: string) => {
    const s = new Set(expandedGroups);
    s.has(g) ? s.delete(g) : s.add(g);
    setExpandedGroups(s);
  };
  const toggleModule = (m: string) => {
    const s = new Set(expandedModules);
    s.has(m) ? s.delete(m) : s.add(m);
    setExpandedModules(s);
  };
  const expandAll = () => {
    if (currentData?.menus) {
      const gs = new Set(currentData.menus.map((g) => g.group));
      const ms = new Set(
        currentData.menus.flatMap((g) =>
          g.modules.map((m) => `${g.group}-${m.name}`)
        )
      );
      setExpandedGroups(gs);
      setExpandedModules(ms);
    }
  };
  const collapseAll = () => {
    setExpandedGroups(new Set());
    setExpandedModules(new Set());
  };
  const copyToClipboard = (t: string) => {
    navigator.clipboard.writeText(t);
    toast.success("ID copied to clipboard");
  };
  const handleProductSelect = (code: string) => {
    setSelectedProduct(code);
    setIsMobileMenuOpen(false);
  };
  const handleReload = () => handleLoadAPI(true, true);

  /* --------- Debounce search --------- */
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  /* --------- Filtered Views --------- */
  const filteredMenus = useMemo(() => {
    if (!currentData?.menus) return [];
    const q = debouncedQuery.toLowerCase();
    if (!q) return currentData.menus;
    const groups: MenuGroup[] = [];
    for (const g of currentData.menus) {
      const filteredModules: MenuModule[] = [];
      for (const m of g.modules) {
        const menus = m.menus.filter((x) => x.name.toLowerCase().includes(q));
        const submenus = (m.submenus || []).filter((x) =>
          [x.name, x.menu].some((v) => v.toLowerCase().includes(q))
        );
        const modMatch = m.name.toLowerCase().includes(q);
        if (menus.length || submenus.length || modMatch) {
          filteredModules.push({
            name: m.name,
            menus: modMatch ? m.menus : menus,
            submenus: modMatch ? m.submenus : submenus,
          });
        }
      }
      if (filteredModules.length || g.group.toLowerCase().includes(q)) {
        groups.push({
          group: g.group,
          modules: g.group.toLowerCase().includes(q)
            ? g.modules
            : filteredModules,
        });
      }
    }
    return groups;
  }, [currentData?.menus, debouncedQuery]);

  const filteredFeatures = useMemo(() => {
    if (!currentData?.features)
      return {
        global: [] as Feature[],
        modules: {} as Record<string, Feature[]>,
      };
    const q = debouncedQuery.toLowerCase();
    if (!q) return currentData.features;
    const includeFeat = (f: Feature) =>
      [f.name, f.description, f.module_name, f.feature_code]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));

    const global = currentData.features.global
      .map((p) => ({ ...p, children: (p.children || []).filter(includeFeat) }))
      .filter((p) => includeFeat(p) || (p.children?.length ?? 0) > 0);

    const modules: Record<string, Feature[]> = {};
    for (const [mod, arr] of Object.entries(currentData.features.modules)) {
      const kept = arr
        .map((p) => ({
          ...p,
          children: (p.children || []).filter(includeFeat),
        }))
        .filter(
          (p) =>
            includeFeat(p) ||
            (p.children?.length ?? 0) > 0 ||
            mod.toLowerCase().includes(q)
        );
      if (kept.length) modules[mod] = kept;
    }
    return { global, modules };
  }, [currentData?.features, debouncedQuery]);

  /* --------- Export CSV --------- */
  const handleExport = () => {
    if (!currentData) return;
    const rows: string[] = [];
    if (activeTab === "menus") {
      rows.push("Group,Module,Type,Name,ID/Ref");
      for (const g of filteredMenus) {
        for (const m of g.modules) {
          for (const menu of m.menus)
            rows.push(
              [
                csv(g.group),
                csv(m.name),
                "MENU",
                csv(menu.name),
                csv(menu.id),
              ].join(",")
            );
          for (const sm of m.submenus || [])
            rows.push(
              [
                csv(g.group),
                csv(m.name),
                "SUBMENU",
                csv(sm.name),
                csv(sm.id),
              ].join(",")
            );
        }
      }
    } else {
      rows.push(
        "Scope,Module,Type,Name,FeatureCode,Active,PriceAddon,Trial,TrialDays,Description,ID"
      );
      const pushFeat = (scope: string, f: Feature) => {
        rows.push(
          [
            scope,
            csv(f.module_name || ""),
            (f.item_type || "FEATURE").toString().toUpperCase(),
            csv(f.name),
            csv(f.feature_code || ""),
            f.status ? "1" : "0",
            typeof f.price_addon === "number" ? String(f.price_addon) : "0",
            f.trial_available ? "1" : "0",
            f.trial_days ?? "",
            csv(f.description || ""),
            csv(f.id),
          ].join(",")
        );
        for (const c of f.children || []) {
          rows.push(
            [
              scope,
              csv(c.module_name || ""),
              "SUBFEATURE",
              csv(c.name),
              csv(c.feature_code || ""),
              c.status ? "1" : "0",
              typeof c.price_addon === "number" ? String(c.price_addon) : "0",
              c.trial_available ? "1" : "0",
              c.trial_days ?? "",
              csv(c.description || ""),
              csv(c.id),
            ].join(",")
          );
        }
      };
      for (const p of filteredFeatures.global) pushFeat("GLOBAL", p);
      for (const [mod, arr] of Object.entries(filteredFeatures.modules))
        for (const p of arr) pushFeat(mod, p);
    }
    const blob = new Blob([rows.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const baseName = activeTab === "menus" ? "menus_export" : "features_export";
    a.href = url;
    a.download = `${baseName}_${selectedProduct || "product"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* --------- Edit Price --------- */
  const openEditPrice = (f: Feature) => {
    if ((f.item_type || "FEATURE").toUpperCase() !== "FEATURE") return;
    setEditTarget(f);
    setEditPrice(
      typeof f.price_addon === "number" && !isNaN(f.price_addon)
        ? String(f.price_addon)
        : "0"
    );
    setEditOpen(true);
  };
  const submitEditPrice = async () => {
    if (!editTarget || !selectedProduct) return;
    const value = Number(editPrice);
    if (isNaN(value) || value < 0) {
      toast.error("Price must be a non-negative number.");
      return;
    }
    setIsSaving(true);
    try {
      await panelUpdateParentFeaturePrice(
        selectedProduct,
        editTarget.feature_code || editTarget.id,
        value
      );
      toast.success("Price updated.");
      setEditOpen(false);
      setEditTarget(null);
      await handleLoadAPI(false, false); // refresh tabel tanpa muter tombol
    } catch (e: any) {
      toast.error(e?.message || "Failed to update price.");
    } finally {
      setIsSaving(false);
    }
  };

  /* --------- Mappers --------- */
  function mapMirrorFeatureToUI(f: any): Feature {
    const id =
      String(
        f.id ?? f.feature_code ?? f.code ?? Math.random().toString(36).slice(2)
      ) || "";
    const name =
      String(
        f.name ??
          f.feature_name ??
          f.title ??
          f.slug ??
          f.feature_code ??
          `Feature ${id}`
      ) || "";
    const baseDesc = String(f.description ?? "") || "";
    const price =
      typeof f.price_addon !== "undefined" ? Number(f.price_addon) : undefined;
    const trialAvail =
      typeof f.trial_available !== "undefined"
        ? !!f.trial_available
        : undefined;
    const trialDays =
      typeof f.trial_days !== "undefined" ? Number(f.trial_days) : undefined;
    const extras: string[] = [];
    if (typeof price !== "undefined")
      extras.push(`Price Add-on: $${(price ?? 0).toFixed(2)}`);
    if (typeof trialAvail !== "undefined")
      extras.push(
        `Trial: ${trialAvail ? "Available" : "Not available"}${
          trialAvail && trialDays ? ` (${trialDays} days)` : ""
        }`
      );
    const description = [baseDesc, extras.join(" | ")]
      .filter(Boolean)
      .join(" — ");
    const active = !(
      f.is_active === false ||
      f.status === "Inactive" ||
      f.status === "Disabled"
    );
    return {
      id,
      name,
      description,
      status: active,
      parent_id: f.parent_id ?? null,
      item_type: String(f.item_type ?? f.type ?? "FEATURE").toUpperCase(),
      module_name:
        f.module_name ?? f.module ?? f.group ?? f.category ?? "General",
      feature_code: f.feature_code ?? f.code ?? undefined,
      parent_code: f.parent_code ?? f.menu_parent_code ?? undefined,
      price_addon: price,
      trial_available: trialAvail,
      trial_days: trialDays ?? null,
    };
  }

  function splitFeaturesByModule(features: any[]) {
    const mapped: Feature[] = (features || []).map(mapMirrorFeatureToUI);
    const parentIndex = new Map<string, Feature>();
    for (const f of mapped) {
      const t = String(f.item_type || "FEATURE").toUpperCase();
      if (t === "SUBFEATURE") continue;
      const p: Feature = { ...f, children: [] };
      const keys = new Set<string>(
        [
          String(f.id || ""),
          String(f.feature_code || ""),
          String((f as any).code || ""),
        ].filter(Boolean)
      );
      for (const k of keys) parentIndex.set(k, p);
    }
    for (const f of mapped) {
      if (String(f.item_type || "FEATURE").toUpperCase() !== "SUBFEATURE")
        continue;
      const candidateKeys = [
        String(f.parent_code || ""),
        String(f.parent_id || ""),
      ].filter(Boolean);
      let parent: Feature | undefined;
      for (const k of candidateKeys) {
        parent = parentIndex.get(k);
        if (parent) break;
      }
      if (parent) (parent.children ||= []).push({ ...f, children: undefined });
    }
    const global: Feature[] = [];
    const modules: Record<string, Feature[]> = {};
    const seen = new Set<Feature>();
    for (const p of parentIndex.values()) {
      if (seen.has(p)) continue;
      seen.add(p);
      const mod = p.module_name || "General";
      if (!mod || mod === "Global") global.push(p);
      else (modules[mod] ||= []).push(p);
    }
    Object.keys(modules).forEach((k) => {
      modules[k].sort((a, b) => a.name.localeCompare(b.name));
      modules[k].forEach((p) =>
        p.children?.sort((a, b) => a.name.localeCompare(b.name))
      );
    });
    global.sort((a, b) => a.name.localeCompare(b.name));
    return { global, modules };
  }

  function buildMenusFromMirror(rows: any[]): MenuGroup[] {
    if (!Array.isArray(rows) || rows.length === 0) return [];
    const normType = (t: any): "GROUP" | "MODULE" | "MENU" | "SUBMENU" => {
      const s = String(t ?? "menu").toUpperCase();
      if (s === "GROUP") return "GROUP";
      if (s === "MODULE") return "MODULE";
      if (s === "SUBMENU") return "SUBMENU";
      return "MENU";
    };
    type Node = {
      id: string | number;
      parent_id: string | number | null;
      type: "GROUP" | "MODULE" | "MENU" | "SUBMENU";
      title: string;
      product_code?: string;
      module_name?: string | null;
    };
    const flat: Node[] = [];
    const looksFlat =
      rows.length > 0 &&
      !("children" in (rows[0] ?? {})) &&
      "id" in (rows[0] ?? {});
    const looksTree = rows.length > 0 && "children" in (rows[0] ?? {});
    const pushFlat = (r: any) => {
      flat.push({
        id: r.id ?? r.code ?? crypto.randomUUID(),
        parent_id:
          r.parent_id != null
            ? r.parent_id
            : r.parent
            ? r.parent.id ?? null
            : null,
        type: normType(r.type ?? r.item_type),
        title: String(r.title ?? r.name ?? r.menu ?? "Menu"),
        product_code: r.product_code,
        module_name: r.module_name ?? r.module ?? null,
      });
    };
    if (looksFlat) for (const r of rows) pushFlat(r);
    else if (looksTree) {
      const dfs = (node: any, parentId: any = null) => {
        const n: Node = {
          id: node.id ?? node.code ?? crypto.randomUUID(),
          parent_id: parentId,
          type: normType(node.type ?? node.item_type),
          title: String(node.title ?? node.name ?? "Menu"),
          product_code: node.product_code,
          module_name: node.module_name ?? node.module ?? null,
        };
        flat.push(n);
        if (Array.isArray(node.children))
          for (const ch of node.children) dfs(ch, n.id);
      };
      for (const root of rows) dfs(root, null);
    } else return [];

    const byId = new Map<string | number, Node>();
    for (const n of flat) byId.set(n.id, n);
    const getAncestorByType = (
      start: Node,
      want: "GROUP" | "MODULE" | "MENU"
    ): Node | null => {
      let cur: Node | null = start;
      while (cur) {
        if (cur.type === want) return cur;
        cur =
          cur.parent_id != null
            ? (byId.get(cur.parent_id) as Node) ?? null
            : null;
      }
      return null;
    };

    type ModuleBucket = {
      name: string;
      menus: MenuItem[];
      submenus: SubMenuItem[];
    };
    const groupBuckets = new Map<string, Map<string, ModuleBucket>>();

    for (const n of flat) {
      if (n.type === "GROUP" || n.type === "MODULE") continue;
      const groupNode = getAncestorByType(n, "GROUP");
      const moduleNode = getAncestorByType(n, "MODULE");
      const groupName =
        (groupNode?.title?.trim() || "") !== "" ? groupNode!.title : "General";
      const moduleName =
        (moduleNode?.title?.trim() || "") !== ""
          ? moduleNode!.title
          : (n.module_name && String(n.module_name).trim()) || "General";

      if (!groupBuckets.has(groupName)) groupBuckets.set(groupName, new Map());
      const modulesMap = groupBuckets.get(groupName)!;
      if (!modulesMap.has(moduleName))
        modulesMap.set(moduleName, {
          name: moduleName,
          menus: [],
          submenus: [],
        });
      const bucket = modulesMap.get(moduleName)!;

      if (n.type === "MENU")
        bucket.menus.push({ id: String(n.id), name: n.title });
      else if (n.type === "SUBMENU") {
        const parentMenu = getAncestorByType(n, "MENU");
        bucket.submenus.push({
          id: String(n.id),
          name: n.title,
          menu: parentMenu?.title ?? "Menu",
        });
      }
    }

    const groups: MenuGroup[] = [];
    for (const [gName, modMap] of groupBuckets.entries()) {
      const modules: MenuModule[] = [];
      for (const [, bucket] of modMap.entries()) {
        modules.push({
          name: bucket.name,
          menus: bucket.menus,
          submenus: bucket.submenus.length ? bucket.submenus : undefined,
        });
      }
      modules.sort((a, b) => a.name.localeCompare(b.name));
      groups.push({ group: gName, modules });
    }
    groups.sort((a, b) => a.group.localeCompare(b.group));
    return groups;
  }

  /* ===================== UI ===================== */
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-[260px] 
        bg-gradient-to-b from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }
        flex flex-col border-r border-slate-700/50 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent`}
      >
        <div className="py-4 px-3 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wider text-slate-300 mb-1">
                Products
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-slate-700/50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {products.map((p) => (
            <button
              key={p.id}
              className={`w-full h-[72px] rounded-xl p-3 transition-all duration-200 text-left flex items-center gap-3 group
              ${
                selectedProduct === p.product_code
                  ? "bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-600/50 shadow-lg shadow-slate-900/20 ring-1 ring-slate-500/30"
                  : "bg-slate-800/60 hover:bg-slate-700/70 border border-transparent hover:border-slate-600/30"
              }`}
              onClick={() => {
                setSelectedProduct(p.product_code);
              }}
            >
              <div
                className={`${
                  selectedProduct === p.product_code
                    ? "bg-gradient-to-br from-slate-600 to-slate-700 shadow-md"
                    : "bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-slate-600 group-hover:to-slate-700"
                } w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0 transition-all duration-200`}
              >
                {p.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className={`${
                    selectedProduct === p.product_code
                      ? "text-white"
                      : "text-slate-100 group-hover:text-white"
                  } font-semibold text-sm truncate transition-colors duration-200`}
                >
                  {p.name}
                </h3>
                <p
                  className={`${
                    selectedProduct === p.product_code
                      ? "text-slate-300"
                      : "text-slate-400 group-hover:text-slate-300"
                  } text-xs truncate transition-colors duration-200`}
                >
                  {p.description}
                </p>
              </div>
              {selectedProduct === p.product_code && (
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              )}
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-slate-700/50">
          <Button className="w-full h-10 rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-6 border-b border-border/50 bg-card/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <MenuIcon className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  Features & Menus for {selectedProductData?.name}
                </h1>
                <p className="text-muted-foreground">
                  Load features and menus from configured API endpoint
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  // disable saat refresh manual saja
                  disabled={isRefreshing}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1">
                {["All", "Features", "Menus"].map((filter) => (
                  <Button
                    key={filter}
                    variant={
                      filterType === (filter as any) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setFilterType(filter as any)}
                    className={
                      filterType === filter
                        ? "bg-purple-600 hover:bg-purple-700"
                        : ""
                    }
                    disabled={isRefreshing}
                  >
                    {filter}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background">
                <span className="text-sm whitespace-nowrap">
                  Group by Module
                </span>
                <Switch
                  checked={groupByModule}
                  onCheckedChange={setGroupByModule}
                  disabled={isRefreshing}
                  aria-label="Group features and menus by module"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={isRefreshing || !currentData}
                aria-label="Export current view to CSV"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-1" /> Export CSV
              </Button>

              <Button
                size="sm"
                onClick={() => handleLoadAPI(true, true)}
                disabled={isRefreshing || !selectedProduct}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 font-medium"
                aria-label="Load data"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}{" "}
                Load
              </Button>
            </div>
          </div>

          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Data fitur & menu bersifat <strong>read-only</strong> (mirror
                dari Warehouse ke Panel). Hanya harga parent feature yang bisa
                diubah.
              </span>
              <Button variant="ghost" size="sm" onClick={handleReload}>
                <ExternalLink className="h-4 w-4 mr-1" /> Refresh mirror
              </Button>
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Placeholder tampil HANYA jika: auto-read sudah selesai dicek & data memang kosong */}
          {bootChecked && !currentData ? (
            <Card className="glass-morphism">
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground">
                  <Settings className="h-16 w-16 mx-auto mb-6 opacity-50" />
                  <h3 className="text-xl font-semibold mb-3">Connect & Load</h3>
                  <p className="mb-6 max-w-md mx-auto">
                    Click <strong>Load</strong> to fetch Menus and Features for
                    this product.
                  </p>
                  <Button
                    onClick={() => handleLoadAPI(true, true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Load
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : currentData ? (
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as any)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="menus">Menus</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
              </TabsList>

              {/* MENUS */}
              <TabsContent value="menus" className="space-y-4">
                <Card className="glass-morphism shadow-lg rounded-xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Menu Structure</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={expandAll}>
                          Expand All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={collapseAll}
                        >
                          Collapse All
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredMenus.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No menus mirrored</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredMenus.map((group) => (
                          <div key={group.group} className="border rounded-lg">
                            <button
                              className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg"
                              onClick={() => toggleGroup(group.group)}
                              aria-expanded={expandedGroups.has(group.group)}
                              aria-label={`${group.group} group, ${
                                expandedGroups.has(group.group)
                                  ? "expanded"
                                  : "collapsed"
                              }`}
                            >
                              {expandedGroups.has(group.group) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <FolderOpen className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">{group.group}</span>
                              <Badge
                                variant="outline"
                                className="ml-auto bg-purple-50 text-purple-700 border-purple-200"
                              >
                                Group
                              </Badge>
                            </button>

                            {expandedGroups.has(group.group) && (
                              <div className="pl-6 pb-2">
                                {group.modules.map((module) => (
                                  <div
                                    key={module.name}
                                    className="border-l-2 border-muted ml-2"
                                  >
                                    <button
                                      className="w-full flex items-center gap-3 p-2 hover:bg-muted/30 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded"
                                      onClick={() =>
                                        toggleModule(
                                          `${group.group}-${module.name}`
                                        )
                                      }
                                      aria-expanded={expandedModules.has(
                                        `${group.group}-${module.name}`
                                      )}
                                      aria-label={`${module.name} module, ${
                                        expandedModules.has(
                                          `${group.group}-${module.name}`
                                        )
                                          ? "expanded"
                                          : "collapsed"
                                      }`}
                                    >
                                      {expandedModules.has(
                                        `${group.group}-${module.name}`
                                      ) ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                      <Folder className="h-4 w-4 text-indigo-600" />
                                      <span className="font-medium">
                                        {module.name}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="ml-auto bg-indigo-50 text-indigo-700 border-indigo-200"
                                      >
                                        Module
                                      </Badge>
                                    </button>

                                    {expandedModules.has(
                                      `${group.group}-${module.name}`
                                    ) && (
                                      <div className="pl-6 space-y-1">
                                        {module.menus.map((menu) => (
                                          <div
                                            key={menu.id}
                                            className="flex items-center gap-3 p-2 hover:bg-muted/20 transition-colors rounded"
                                          >
                                            <div className="w-4" />
                                            <FileText className="h-4 w-4 text-green-600" />
                                            <span>{menu.name}</span>
                                            <Badge
                                              variant="secondary"
                                              className="ml-auto bg-green-50 text-green-700"
                                            >
                                              Menu
                                            </Badge>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                copyToClipboard(menu.id)
                                              }
                                              aria-label={`Copy menu ID ${menu.id}`}
                                            >
                                              <Copy className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ))}
                                        {module.submenus?.map((submenu) => (
                                          <div
                                            key={submenu.id}
                                            className="flex items-center gap-3 p-2 hover:bg-muted/20 transition-colors rounded"
                                          >
                                            <div className="w-8" />
                                            <FileText className="h-4 w-4 text-orange-600" />
                                            <span className="text-sm">
                                              {submenu.name}
                                            </span>
                                            <Badge
                                              variant="outline"
                                              className="ml-auto text-xs bg-orange-50 text-orange-700 border-orange-200"
                                            >
                                              Submenu
                                            </Badge>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                copyToClipboard(submenu.id)
                                              }
                                              aria-label={`Copy submenu ID ${submenu.id}`}
                                            >
                                              <Copy className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* FEATURES */}
              <TabsContent value="features" className="space-y-6">
                <Card className="glass-morphism shadow-lg rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                      Global Features ({filteredFeatures.global.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredFeatures.global.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>No global features available</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>ID</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredFeatures.global.map((feature) => (
                            <Fragment key={feature.id}>
                              <TableRow>
                                <TableCell className="font-medium">
                                  {feature.name}
                                </TableCell>
                                <TableCell>{feature.description}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      feature.status ? "default" : "secondary"
                                    }
                                    className={
                                      feature.status
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-gray-600"
                                    }
                                  >
                                    {feature.status ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        copyToClipboard(feature.id)
                                      }
                                      className="font-mono text-xs hover:bg-muted"
                                      aria-label={`Copy feature ID ${feature.id}`}
                                    >
                                      {feature.id}
                                      <Copy className="h-3 w-3 ml-1" />
                                    </Button>
                                    {(feature.item_type || "FEATURE") ===
                                      "FEATURE" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditPrice(feature)}
                                        aria-label="Edit parent price"
                                      >
                                        <Pencil className="h-3 w-3 mr-1" /> Edit
                                        Price
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>

                              {feature.children?.map((child) => (
                                <TableRow
                                  key={child.id}
                                  className="bg-muted/30"
                                >
                                  <TableCell className="pl-8 flex items-center gap-2">
                                    <span className="text-muted-foreground">
                                      ↳
                                    </span>
                                    {child.name}
                                    <Badge
                                      variant="outline"
                                      className="ml-2 text-xs"
                                    >
                                      Subfeature
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {child.description}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        child.status ? "default" : "secondary"
                                      }
                                      className={
                                        child.status
                                          ? "bg-green-600 hover:bg-green-700"
                                          : "bg-gray-600"
                                      }
                                    >
                                      {child.status ? "Active" : "Inactive"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(child.id)}
                                      className="font-mono text-xs hover:bg-muted"
                                      aria-label={`Copy feature ID ${child.id}`}
                                    >
                                      {child.id}
                                      <Copy className="h-3 w-3 ml-1" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Module Features</h3>
                  {Object.entries(filteredFeatures.modules).map(
                    ([moduleName, features]) => (
                      <Card
                        key={moduleName}
                        className="glass-morphism shadow-lg rounded-xl"
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            {moduleName} ({features.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>ID</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {features.map((feature) => (
                                <Fragment key={feature.id}>
                                  <TableRow>
                                    <TableCell className="font-medium">
                                      {feature.name}
                                    </TableCell>
                                    <TableCell>{feature.description}</TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          feature.status
                                            ? "default"
                                            : "secondary"
                                        }
                                        className={
                                          feature.status
                                            ? "bg-green-600 hover:bg-green-700"
                                            : "bg-gray-600"
                                        }
                                      >
                                        {feature.status ? "Active" : "Inactive"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            copyToClipboard(feature.id)
                                          }
                                          className="font-mono text-xs hover:bg-muted"
                                          aria-label={`Copy feature ID ${feature.id}`}
                                        >
                                          {feature.id}
                                          <Copy className="h-3 w-3 ml-1" />
                                        </Button>
                                        {(feature.item_type || "FEATURE") ===
                                          "FEATURE" && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              openEditPrice(feature)
                                            }
                                            aria-label="Edit parent price"
                                          >
                                            <Pencil className="h-3 w-3 mr-1" />{" "}
                                            Edit Price
                                          </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>

                                  {feature.children?.map((child) => (
                                    <TableRow
                                      key={child.id}
                                      className="bg-muted/30"
                                    >
                                      <TableCell className="pl-8 flex items-center gap-2">
                                        <span className="text-muted-foreground">
                                          ↳
                                        </span>
                                        {child.name}
                                        <Badge
                                          variant="outline"
                                          className="ml-2 text-xs"
                                        >
                                          Subfeature
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">
                                        {child.description}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant={
                                            child.status
                                              ? "default"
                                              : "secondary"
                                          }
                                          className={
                                            child.status
                                              ? "bg-green-600 hover:bg-green-700"
                                              : "bg-gray-600"
                                          }
                                        >
                                          {child.status ? "Active" : "Inactive"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            copyToClipboard(child.id)
                                          }
                                          className="font-mono text-xs hover:bg-muted"
                                          aria-label={`Copy feature ID ${child.id}`}
                                        >
                                          {child.id}
                                          <Copy className="h-3 w-3 ml-1" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </Fragment>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : null}
        </div>
      </div>

      {/* EDIT PRICE MODAL */}
      <Dialog open={editOpen} onOpenChange={(o) => !isSaving && setEditOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Parent Price</DialogTitle>
            <DialogDescription>
              Hanya fitur induk (item_type=FEATURE) yang bisa diubah harganya.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label>Feature</Label>
              <div className="text-sm font-medium">
                {editTarget?.name}{" "}
                <span className="text-muted-foreground">
                  ({editTarget?.feature_code || editTarget?.id})
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price_addon">Price Add-on</Label>
              <Input
                id="price_addon"
                type="number"
                min={0}
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                Masukkan angka ≥ 0. Hanya berlaku untuk parent feature.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={isSaving}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={submitEditPrice} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ===== helpers ===== */
function csv(v: any) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n"))
    return `"${s.replace(/"/g, '""')}"`;
  return s;
}
