"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { whListFeaturesByProduct, whListMenusByProduct } from "@/lib/api";

/* ======================================================================
   Types (sesuai UI)
   ====================================================================== */
interface Product {
  id: string;
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
}

interface ApiResponse {
  menus: MenuGroup[];
  features: {
    global: Feature[];
    modules: Record<string, Feature[]>;
  };
}

/* ======================================================================
   Produk di sidebar (UI tetap)
   ====================================================================== */
const products: Product[] = [
  {
    id: "rentvix",
    name: "RentVix Pro",
    icon: "🚗",
    description: "Vehicle rental management system",
    category: "Rental",
  },
  {
    id: "absen",
    name: "Absen Pro",
    icon: "👥",
    description: "Employee attendance management",
    category: "HR",
  },
];

/* ======================================================================
   Konfigurasi “mock” hanya untuk enable tombol (UI logic yang ada).
   Kita set true agar tombol Load API aktif; endpoint string tidak dipakai.
   ====================================================================== */
const mockApiConfigs: Record<
  string,
  { endpoint: string; configured: boolean }
> = {
  rentvix: { endpoint: "warehouse", configured: true },
  absen: { endpoint: "warehouse", configured: true },
};

/* ======================================================================
   Mapper dari data Warehouse/AppGenerate -> ApiResponse (struktur UI)
   ====================================================================== */

// Normalisasi 1 feature dari AppGenerate
function mapAGFeatureToUI(f: any): Feature {
  const id =
    String(
      f.id ??
        f.feature_id ??
        f.feature_code ??
        f.code ??
        Math.random().toString(36).slice(2)
    ) || "";
  const name =
    String(f.name ?? f.feature_name ?? f.title ?? f.slug ?? `Feature ${id}`) ||
    "";
  const description =
    String(f.description ?? f.feature_description ?? "") || "";
  // kebanyakan upstream punya is_active / status
  const status =
    f.is_active === false || f.status === "Inactive" || f.status === "Disabled"
      ? false
      : true;
  return { id, name, description, status };
}

// Bagi features menjadi global vs modules
function splitFeaturesByModule(features: any[]): {
  global: Feature[];
  modules: Record<string, Feature[]>;
} {
  const global: Feature[] = [];
  const modules: Record<string, Feature[]> = {};
  for (const raw of features || []) {
    const ui = mapAGFeatureToUI(raw);
    // cari nama modul di berbagai kemungkinan field
    const moduleName =
      raw.module_name ??
      raw.module ??
      raw.group ??
      raw.category ??
      raw.product_module ??
      null;

    if (!moduleName) {
      global.push(ui);
    } else {
      const key = String(moduleName);
      if (!modules[key]) modules[key] = [];
      modules[key].push(ui);
    }
  }
  return { global, modules };
}

// Susun struktur MenuGroup dari data menu mentah
function buildMenusToUI(menus: any[]): MenuGroup[] {
  if (!Array.isArray(menus) || !menus.length) return [];

  // Kita identifikasi level via parent_id + type
  const byId: Record<string, any> = {};
  for (const m of menus) {
    const id = String(m.id ?? m.menu_id ?? Math.random().toString(36).slice(2));
    byId[id] = { ...m, __id: id };
  }

  // Buat map children
  const children: Record<string, any[]> = {};
  function addChild(pid: string | null, node: any) {
    const key = pid === null ? "root" : String(pid);
    if (!children[key]) children[key] = [];
    children[key].push(node);
  }
  for (const node of Object.values(byId)) {
    const pid = node.parent_id ?? node.parentId ?? null;
    addChild(pid, node);
  }

  // groups: type=group atau level=1 tanpa parent
  const roots = children["root"] || [];

  // Jika tidak ada deklarasi group/module formal, fallback 1 group “Menus”
  if (!roots.length) {
    const flatMenus: MenuItem[] = menus.map((m) => ({
      id: String(m.code ?? m.route_name ?? m.id ?? Math.random()),
      name: String(m.title ?? m.name ?? "Menu"),
    }));
    return [
      {
        group: "Menus",
        modules: [{ name: "General", menus: flatMenus }],
      },
    ];
  }

  const groups: MenuGroup[] = [];
  for (const g of roots) {
    const gname = String(g.title ?? g.name ?? "Group");
    const gId = String(g.id ?? g.menu_id ?? g.__id);

    const moduleNodes = (children[gId] || []).filter(
      (x) =>
        (x.type ?? "").toString().toLowerCase() === "module" ||
        (x.level ?? 2) >= 2
    );

    // Jika tidak ada module, treat semua anak sebagai menu
    if (!moduleNodes.length) {
      const menusInGroup: MenuItem[] = (children[gId] || []).map((m) => ({
        id: String(m.code ?? m.route_name ?? m.id ?? Math.random()),
        name: String(m.title ?? m.name ?? "Menu"),
      }));
      groups.push({
        group: gname,
        modules: [{ name: "General", menus: menusInGroup }],
      });
      continue;
    }

    const modulesUI: MenuModule[] = [];
    for (const mod of moduleNodes) {
      const mid = String(mod.id ?? mod.menu_id ?? mod.__id);
      const mname = String(mod.title ?? mod.name ?? "Module");

      const menuNodes = (children[mid] || []).filter(
        (x) =>
          (x.type ?? "").toString().toLowerCase() === "menu" ||
          (x.level ?? 3) >= 3
      );

      const menusUI: MenuItem[] = menuNodes.map((mn) => ({
        id: String(mn.code ?? mn.route_name ?? mn.id ?? Math.random()),
        name: String(mn.title ?? mn.name ?? "Menu"),
      }));

      // submenus (optional)
      const submenus: SubMenuItem[] = [];
      for (const mn of menuNodes) {
        const mnid = String(mn.id ?? mn.menu_id ?? mn.__id);
        const subs = (children[mnid] || []).filter(
          (x) =>
            (x.type ?? "").toString().toLowerCase() === "submenu" ||
            (x.level ?? 4) >= 4
        );
        for (const s of subs) {
          submenus.push({
            menu: String(mn.title ?? mn.name ?? "Menu"),
            id: String(s.code ?? s.route_name ?? s.id ?? Math.random()),
            name: String(s.title ?? s.name ?? "Submenu"),
          });
        }
      }

      modulesUI.push({
        name: mname,
        menus: menusUI,
        submenus: submenus.length ? submenus : undefined,
      });
    }

    groups.push({ group: gname, modules: modulesUI });
  }

  return groups;
}

/* ======================================================================
   COMPONENT
   ====================================================================== */
export function FeatureProductSplit() {
  const [selectedProduct, setSelectedProduct] = useState("rentvix");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Features" | "Menus">(
    "All"
  );
  const [groupByModule, setGroupByModule] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("menus");

  const [apiData, setApiData] = useState<Record<string, ApiResponse>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );

  const selectedProductData = products.find((p) => p.id === selectedProduct);
  const currentData = apiData[selectedProduct];
  const apiConfig = mockApiConfigs[selectedProduct];

  // Mapping product id (panel) -> product_code (AppGenerate)
  const productCodeMap: Record<string, string> = {
    rentvix: "rentvix-pro",
    absen: "absen-pro",
  };

  /* -------------------------- LOAD API (REAL) -------------------------- */
  const handleLoadAPI = async () => {
    if (!apiConfig.configured) return;

    const code = productCodeMap[selectedProduct] ?? selectedProduct;

    setIsLoading(true);
    try {
      // 1) Ambil fitur per produk dari Warehouse (proxy ke AppGenerate)
      const fjson = await whListFeaturesByProduct(code);
      const frows: any[] = Array.isArray(fjson?.data)
        ? fjson.data
        : Array.isArray(fjson)
        ? fjson
        : [];
      const { global, modules } = splitFeaturesByModule(frows);

      // 2) Ambil menus per produk (kalau endpoint belum ada, hasilkan [])
      let menusUI: MenuGroup[] = [];
      try {
        const mjson = await whListMenusByProduct(code);
        const mrows: any[] = Array.isArray(mjson?.data)
          ? mjson.data
          : Array.isArray(mjson)
          ? mjson
          : [];
        menusUI = buildMenusToUI(mrows);
      } catch {
        menusUI = [];
      }

      const payload: ApiResponse = {
        menus: menusUI,
        features: { global, modules },
      };

      setApiData((prev) => ({ ...prev, [selectedProduct]: payload }));

      const totalMenus = payload.menus.reduce(
        (acc, group) =>
          acc +
          group.modules.reduce(
            (modAcc, mod) =>
              modAcc + mod.menus.length + (mod.submenus?.length || 0),
            0
          ),
        0
      );
      const totalFeatures =
        payload.features.global.length +
        Object.values(payload.features.modules).reduce(
          (acc, arr) => acc + arr.length,
          0
        );

      toast.success(
        `Loaded ${totalMenus} menus and ${totalFeatures} features from API`
      );
    } catch (error: any) {
      console.error(
        "[FeatureProductSplit] API Load Error:",
        error?.message || error
      );
      toast.error("Failed to load data from API. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ----------------------- Expand/Collapse helpers --------------------- */
  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    newExpanded.has(groupName)
      ? newExpanded.delete(groupName)
      : newExpanded.add(groupName);
    setExpandedGroups(newExpanded);
  };

  const toggleModule = (moduleName: string) => {
    const newExpanded = new Set(expandedModules);
    newExpanded.has(moduleName)
      ? newExpanded.delete(moduleName)
      : newExpanded.add(moduleName);
    setExpandedModules(newExpanded);
  };

  const expandAll = () => {
    if (currentData?.menus) {
      const allGroups = new Set(currentData.menus.map((g) => g.group));
      const allModules = new Set(
        currentData.menus.flatMap((g) =>
          g.modules.map((m) => `${g.group}-${m.name}`)
        )
      );
      setExpandedGroups(allGroups);
      setExpandedModules(allModules);
    }
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
    setExpandedModules(new Set());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("ID copied to clipboard");
  };

  const handleFilterChange = (filter: "All" | "Features" | "Menus") => {
    setFilterType(filter);
    if (filter === "Features") setActiveTab("features");
    else if (filter === "Menus") setActiveTab("menus");
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    setIsMobileMenuOpen(false);
  };

  const handleReload = () => handleLoadAPI();

  const handleOpenAPIConfig = () => {
    toast.info(
      "Navigate to Products → Product Details → API Config to configure endpoint"
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  };

  /* -------------------------- Debounced search ------------------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      // search could be implemented here (UI unchanged)
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* =============================== UI ================================== */
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
        className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-[260px] 
        bg-gradient-to-b from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }
        flex flex-col border-r border-slate-700/50
        scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent
      `}
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
          {products.map((product) => (
            <button
              key={product.id}
              className={`
                w-full h-[72px] rounded-xl p-3 transition-all duration-200 text-left
                flex items-center gap-3 group
                ${
                  selectedProduct === product.id
                    ? "bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-600/50 shadow-lg shadow-slate-900/20 ring-1 ring-slate-500/30"
                    : "bg-slate-800/60 hover:bg-slate-700/70 border border-transparent hover:border-slate-600/30"
                }
              `}
              onClick={() => handleProductSelect(product.id)}
            >
              <div
                className={`
                w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0
                ${
                  selectedProduct === product.id
                    ? "bg-gradient-to-br from-slate-600 to-slate-700 shadow-md"
                    : "bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-slate-600 group-hover:to-slate-700"
                }
                transition-all duration-200
              `}
              >
                {product.icon}
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className={`
                  font-semibold text-sm truncate transition-colors duration-200
                  ${
                    selectedProduct === product.id
                      ? "text-white"
                      : "text-slate-100 group-hover:text-white"
                  }
                `}
                >
                  {product.name}
                </h3>
                <p
                  className={`
                  text-xs truncate transition-colors duration-200
                  ${
                    selectedProduct === product.id
                      ? "text-slate-300"
                      : "text-slate-400 group-hover:text-slate-300"
                  }
                `}
                >
                  {product.description}
                </p>
              </div>

              {selectedProduct === product.id && (
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              )}
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-slate-700/50">
          <Button className="w-full h-10 rounded-lg bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
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
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filter chips */}
              <div className="flex gap-1">
                {["All", "Features", "Menus"].map((filter) => (
                  <Button
                    key={filter}
                    variant={filterType === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterChange(filter as any)}
                    className={
                      filterType === filter
                        ? "bg-purple-600 hover:bg-purple-700"
                        : ""
                    }
                    disabled={isLoading}
                  >
                    {filter}
                  </Button>
                ))}
              </div>

              {/* Group by Module toggle */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background">
                <span className="text-sm whitespace-nowrap">
                  Group by Module
                </span>
                <Switch
                  checked={groupByModule}
                  onCheckedChange={setGroupByModule}
                  disabled={isLoading}
                  aria-label="Group features and menus by module"
                />
              </div>

              {/* Export CSV */}
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading || !currentData}
                aria-label="Export current view to CSV"
              >
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>

              {/* Load API */}
              <Button
                size="sm"
                onClick={handleLoadAPI}
                disabled={
                  isLoading || !apiConfig.configured || !apiConfig.endpoint
                }
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 font-medium"
                aria-label="Load data from configured API endpoint"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Load API
              </Button>
            </div>
          </div>

          {(!apiConfig.configured || !apiConfig.endpoint) && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  No API configured for this product. Set it in{" "}
                  <strong>Products → API Config</strong>.
                </span>
                <Button variant="ghost" size="sm" onClick={handleOpenAPIConfig}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open API Config
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex-1 overflow-auto p-6">
          {!currentData && !isLoading ? (
            <Card className="glass-morphism">
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground">
                  <Settings className="h-16 w-16 mx-auto mb-6 opacity-50" />
                  <h3 className="text-xl font-semibold mb-3">Connect & Load</h3>
                  <p className="mb-6 max-w-md mx-auto">
                    Click <strong>Load API</strong> to fetch Menus and Features
                    for this product.
                  </p>
                  {apiConfig.configured && apiConfig.endpoint ? (
                    <Button
                      onClick={handleLoadAPI}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Load API
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        API endpoint is configured in{" "}
                        <strong>Products → API Config</strong>
                      </p>
                      <Button variant="outline" onClick={handleOpenAPIConfig}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open API Config
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : currentData ? (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="menus">Menus</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
              </TabsList>

              {/* ====== MENUS ====== */}
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
                    {currentData.menus.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No menus returned from API</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {currentData.menus.map((group) => (
                          <div key={group.group} className="border rounded-lg">
                            <button
                              className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg"
                              onClick={() => toggleGroup(group.group)}
                              onKeyDown={(e) =>
                                handleKeyDown(e, () => toggleGroup(group.group))
                              }
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
                                      onKeyDown={(e) =>
                                        handleKeyDown(e, () =>
                                          toggleModule(
                                            `${group.group}-${module.name}`
                                          )
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

              {/* ====== FEATURES ====== */}
              <TabsContent value="features" className="space-y-6">
                <Card className="glass-morphism shadow-lg rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                      Global Features ({currentData.features.global.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentData.features.global.length === 0 ? (
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
                          {currentData.features.global.map((feature) => (
                            <TableRow key={feature.id}>
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(feature.id)}
                                  className="font-mono text-xs hover:bg-muted"
                                  aria-label={`Copy feature ID ${feature.id}`}
                                >
                                  {feature.id}
                                  <Copy className="h-3 w-3 ml-1" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Module Features</h3>
                  {Object.entries(currentData.features.modules).map(
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
                                <TableRow key={feature.id}>
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
                                  </TableCell>
                                </TableRow>
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
    </div>
  );
}
