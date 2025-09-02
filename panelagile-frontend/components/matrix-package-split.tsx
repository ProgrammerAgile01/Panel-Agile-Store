"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import React from "react";
import {
  PackageIcon,
  Search,
  Save,
  Plus,
  Menu as MenuIcon,
  Grid3X3,
  MessageSquare,
  BarChart3,
  Bell,
  Mail,
  FileText,
  Calendar,
  Clock,
  DollarSign,
  Eye,
  Loader2,
  ChevronRight,
  Printer,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// === API hooks ===
import {
  listCatalogProductsSlim,
  fetchMatrixByProduct,
  saveMatrixBulkAPI,
  toggleMatrixCellAPI,
} from "@/lib/api";

// ===== Types (FE internal) =====
interface Product {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  product_code: string;
}

interface Package {
  id: string | number;
  name: string;
  status: "active" | "inactive";
  description?: string;
}

interface Feature {
  id: string; // feature: pakai code/id; menu: pakai id
  name: string;
  module: string;
  type: "feature" | "menu";
  icon: any;
  description?: string;
  dependencies?: string[];
  subpath?: string; // khusus menu
}

interface MatrixCell {
  enabled: boolean;
  isDraft?: boolean;
}
type ChangePayload = {
  item_type: "feature" | "menu";
  item_id: string;
  package_id: number | string;
  enabled: boolean;
};

// ====== Komponen ======
export function MatrixPackageSplit() {
  // ====== STATE DATA ======
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [packages, setPackages] = useState<Package[]>([]);
  const [featuresAndMenus, setFeaturesAndMenus] = useState<Feature[]>([]);
  const [matrixData, setMatrixData] = useState<
    Record<
      string /* product_code */,
      Record<string /* featureId-pkgId */, MatrixCell>
    >
  >({});

  // ====== UI states ======
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"features" | "menus">("features");
  const [filterMode, setFilterMode] = useState("all");
  const [groupByModule, setGroupByModule] = useState(true);
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  const [previewMode, setPreviewMode] = useState(false);
  const [printOptions, setPrintOptions] = useState({
    orientation: "portrait" as "portrait" | "landscape",
    paper: "A4" as "A4" | "Letter",
    showLegend: true,
    includeGroups: true,
    compactRows: false,
  });

  const [previewShowMode, setPreviewShowMode] = useState<
    "features" | "menus" | "both"
  >("features");

  // ====== Debounce search ======
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ====== Load sidebar products ======
  useEffect(() => {
    (async () => {
      try {
        const rows = await listCatalogProductsSlim();
        const norm: Product[] = rows.map((r: any) => ({
          id: String(r.id),
          name: r.name,
          description: r.description,
          status: r.status,
          product_code: r.product_code,
        }));
        setProducts(norm);
        if (norm.length) setSelectedProduct(norm[0]);
      } catch (e: any) {
        toast({
          title: "Gagal memuat produk",
          description: e?.message || "Terjadi kesalahan saat load products",
          variant: "destructive",
        });
      }
    })();
  }, []);

  // ====== Load matrix + fitur + menu ======
  useEffect(() => {
    if (!selectedProduct?.product_code) return;
    (async () => {
      try {
        const { data } = await fetchMatrixByProduct(
          selectedProduct.product_code
        );

        // packages
        const pkgs: Package[] = (data.packages || []).map((p: any) => ({
          id: String(p.id),
          name: String(p.name ?? "Package"),
          description: String(p.description ?? ""),
          status:
            String(p.status ?? "active").toLowerCase() === "inactive"
              ? "inactive"
              : "active",
        }));
        setPackages(pkgs);

        // features + menus
        const fts: Feature[] = [
          ...((data.features || []).map((f: any) => ({
            id: String(f.feature_code ?? f.code ?? f.id),
            name: String(f.name ?? "Feature"),
            module: String(f.module ?? f.module_name ?? "General"),
            type: "feature" as const,
            icon: resolveIcon("feature", f.name),
            description: f.description ?? "",
          })) as Feature[]),
          ...((data.menus || []).map((m: any) => ({
            id: String(m.id),
            name: String(m.title ?? m.name ?? "Menu"),
            module: "", // menu tidak pakai module
            type: "menu" as const,
            icon: resolveIcon("menu", m.name || m.title),
            description: m.note ?? m.description ?? "",
            subpath: m.route_path ?? m.subpath ?? "",
          })) as Feature[]),
        ];
        setFeaturesAndMenus(fts);

        // matrix map
        const rows: Record<string, MatrixCell> = {};
        (data.matrix || []).forEach((r: any) => {
          const itemId = String(r.item_id);
          const pkgId = String(r.package_id);
          const key = `${itemId}-${pkgId}`;
          rows[key] = { enabled: !!r.enabled, isDraft: false };
        });

        setMatrixData((prev) => ({
          ...prev,
          [selectedProduct.product_code]: rows,
        }));
      } catch (e: any) {
        toast({
          title: "Gagal memuat matrix",
          description: e?.message || "Terjadi kesalahan saat load matrix",
          variant: "destructive",
        });
      }
    })();
  }, [selectedProduct?.product_code]);

  // util icon ringan
  function resolveIcon(kind: "feature" | "menu", name?: string) {
    if (kind === "menu") {
      if ((name || "").toLowerCase().includes("order")) return Calendar;
      if ((name || "").toLowerCase().includes("jadwal")) return Clock;
      if ((name || "").toLowerCase().includes("keuangan")) return DollarSign;
      return MenuIcon;
    }
    // feature
    if ((name || "").toLowerCase().includes("email")) return Mail;
    if ((name || "").toLowerCase().includes("whatsapp")) return MessageSquare;
    if ((name || "").toLowerCase().includes("export")) return FileText;
    if ((name || "").toLowerCase().includes("dashboard")) return BarChart3;
    if ((name || "").toLowerCase().includes("reminder")) return Bell;
    return PackageIcon;
  }

  // ====== Derived ======
  const hasChanges = selectedProduct
    ? Object.values(matrixData[selectedProduct.product_code] || {}).some(
        (cell) => cell.isDraft
      )
    : false;

  const filteredFeatures = featuresAndMenus.filter((feature) => {
    if (viewMode === "features" && feature.type !== "feature") return false;
    if (viewMode === "menus" && feature.type !== "menu") return false;

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      return (
        feature.name.toLowerCase().includes(searchLower) ||
        feature.module.toLowerCase().includes(searchLower) ||
        (feature.subpath || "").toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const filteredPackages = packages.filter((pkg) => {
    if (filterMode === "active" && pkg.status !== "active") return false;
    if (filterMode === "archived" && pkg.status !== "inactive") return false;
    return true;
  });

  const groupedFeatures = groupByModule
    ? filteredFeatures.reduce((acc, feature) => {
        const mod = feature.module || "General";
        if (!acc[mod]) acc[mod] = [];
        acc[mod].push(feature);
        return acc;
      }, {} as Record<string, Feature[]>)
    : { All: filteredFeatures };

  const finalGroupedFeatures = showOnlyDifferences
    ? Object.entries(groupedFeatures).reduce((acc, [module, features]) => {
        const fx = features.filter((feature) => {
          const values = filteredPackages.map((pkg) => {
            const key = `${feature.id}-${pkg.id}`;
            return (
              matrixData[selectedProduct!.product_code]?.[key]?.enabled || false
            );
          });
          return !values.every((v) => v === values[0]);
        });
        if (fx.length) acc[module] = fx;
        return acc;
      }, {} as Record<string, Feature[]>)
    : groupedFeatures;

  // ====== Mutators ======
  const toggleCell = useCallback(
    async (featureId: string, packageId: string | number) => {
      if (!selectedProduct) return;
      const pcode = selectedProduct.product_code;
      const key = `${featureId}-${packageId}`;
      const currEnabled = matrixData[pcode]?.[key]?.enabled ?? false;

      // optimistik update
      setMatrixData((prev) => ({
        ...prev,
        [pcode]: {
          ...prev[pcode],
          [key]: { enabled: !currEnabled, isDraft: true },
        },
      }));

      try {
        await toggleMatrixCellAPI(pcode, {
          item_type: viewMode === "menus" ? "menu" : "feature",
          item_id: featureId,
          package_id: packageId,
          enabled: !currEnabled,
        });
      } catch (e: any) {
        // rollback
        setMatrixData((prev) => ({
          ...prev,
          [pcode]: {
            ...prev[pcode],
            [key]: { enabled: currEnabled, isDraft: false },
          },
        }));
        toast({
          title: "Toggle gagal",
          description: e?.message || "Gagal mengubah sel",
          variant: "destructive",
        });
      }
    },
    [selectedProduct, matrixData, viewMode]
  );

  const toggleFeature = useCallback(
    (featureId: string, packageId: string | number) => {
      if (!selectedProduct) return;
      const pcode = selectedProduct.product_code;
      const key = `${featureId}-${packageId}`;
      const curr = matrixData[pcode]?.[key]?.enabled ?? false;
      setMatrixData((prev) => ({
        ...prev,
        [pcode]: {
          ...prev[pcode],
          [key]: { enabled: !curr, isDraft: true },
        },
      }));
    },
    [selectedProduct, matrixData]
  );

  const toggleEntireColumn = useCallback(
    (packageId: string | number, enabled: boolean) => {
      if (!selectedProduct) return;
      const pcode = selectedProduct.product_code;
      const updates: Record<string, MatrixCell> = {};
      filteredFeatures.forEach((feature) => {
        const key = `${feature.id}-${packageId}`;
        updates[key] = { enabled, isDraft: true };
      });
      setMatrixData((prev) => ({
        ...prev,
        [pcode]: { ...prev[pcode], ...updates },
      }));
    },
    [selectedProduct, filteredFeatures]
  );

  const applyBulkAction = useCallback(
    (action: {
      type: "enable" | "disable";
      featureIds: string[];
      packageIds?: Array<string | number>;
    }) => {
      if (!selectedProduct) return;
      const pcode = selectedProduct.product_code;
      const updates: Record<string, MatrixCell> = {};
      action.featureIds.forEach((fid) => {
        const pkgIds = action.packageIds || filteredPackages.map((p) => p.id);
        pkgIds.forEach((pid) => {
          const key = `${fid}-${pid}`;
          updates[key] = { enabled: action.type === "enable", isDraft: true };
        });
      });
      setMatrixData((prev) => ({
        ...prev,
        [pcode]: { ...prev[pcode], ...updates },
      }));
      setSelectedRows([]);
      toast({
        title: "Bulk action applied",
        description: `${action.type === "enable" ? "Enabled" : "Disabled"} ${
          action.featureIds.length
        } rows`,
      });
    },
    [selectedProduct, filteredPackages]
  );

  const saveChanges = useCallback(async () => {
    if (!selectedProduct) return;
    const pcode = selectedProduct.product_code;
    const rows = matrixData[pcode] || {};

    const changes: ChangePayload[] = Object.entries(rows)
      .filter(([, v]) => v.isDraft)
      .map(([k, v]) => {
        const [itemId, pkgId] = k.split("-");
        const item = featuresAndMenus.find((f) => f.id === itemId);
        const item_type: "feature" | "menu" =
          item?.type === "menu" ? "menu" : "feature";
        return {
          item_type,
          item_id: itemId,
          package_id: isNaN(Number(pkgId)) ? pkgId : Number(pkgId),
          enabled: !!v.enabled,
        };
      });

    if (changes.length === 0) {
      toast({
        title: "Tidak ada perubahan",
        description: "Semua sudah tersimpan.",
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveMatrixBulkAPI(pcode, changes);
      // clear draft flag
      const cleaned: Record<string, MatrixCell> = {};
      Object.entries(rows).forEach(([key, cell]) => {
        cleaned[key] = { enabled: cell.enabled, isDraft: false };
      });
      setMatrixData((prev) => ({ ...prev, [pcode]: cleaned }));
      toast({
        title: "Matrix saved",
        description: "Perubahan berhasil disimpan.",
      });
    } catch (e: any) {
      toast({
        title: "Gagal menyimpan",
        description: e?.message || "Periksa koneksi/JWT Anda.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [selectedProduct, matrixData, featuresAndMenus]);

  const checkDependencies = useCallback(
    (feature: Feature) => {
      if (!feature.dependencies || !selectedProduct) return true;
      const pcode = selectedProduct.product_code;
      return feature.dependencies.every((depId) =>
        packages.some(
          (pkg) => matrixData[pcode]?.[`${depId}-${pkg.id}`]?.enabled
        )
      );
    },
    [selectedProduct, packages, matrixData]
  );

  // ====== Preview Helpers (BARU) ======
  // Ambil item untuk preview (tidak tergantung viewMode)
  const getPreviewItems = useCallback(
    (kind: "features" | "menus") => {
      const base = featuresAndMenus.filter((f) =>
        kind === "features" ? f.type === "feature" : f.type === "menu"
      );
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        return base.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            (f.module || "").toLowerCase().includes(q) ||
            (f.subpath || "").toLowerCase().includes(q)
        );
      }
      return base;
    },
    [featuresAndMenus, debouncedSearch]
  );

  // Cetak tabel untuk print/preview (BARU)
  const renderPrintTable = (items: Feature[]) => {
    if (!selectedProduct) return null;

    const isMenusTable = items.every((it) => it.type === "menu");
    const leftHeader = isMenusTable ? "Menus" : "Features";

    // Grouping hanya untuk FEATURES
    const grouped: Record<string, Feature[]> =
      isMenusTable || !groupByModule
        ? { All: items }
        : items.reduce((acc, f) => {
            const mod = f.module || "General";
            (acc[mod] ||= []).push(f);
            return acc;
          }, {} as Record<string, Feature[]>);

    return (
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="border border-gray-300 p-3 text-left font-semibold sticky left-0 bg-gray-100 dark:bg-gray-800">
              {leftHeader}
            </th>
            {filteredPackages.map((pkg) => (
              <th
                key={String(pkg.id)}
                className="border border-gray-300 p-3 text-center font-semibold min-w-[120px]"
              >
                {pkg.name}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Object.entries(grouped).map(([groupName, rows]) => (
            <React.Fragment key={groupName}>
              {/* Group header khusus Features */}
              {!isMenusTable && printOptions.includeGroups && (
                <tr className="bg-gray-50 dark:bg-gray-700 break-inside-avoid">
                  <td
                    colSpan={filteredPackages.length + 1}
                    className="border border-gray-300 p-2 font-medium"
                  >
                    📁 {groupName}
                  </td>
                </tr>
              )}

              {rows.map((item) => (
                <tr
                  key={item.id}
                  className={`${
                    printOptions.compactRows ? "h-8" : "h-12"
                  } break-inside-avoid`}
                >
                  <td className="border border-gray-300 p-3 sticky left-0 bg-white dark:bg-gray-900">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{item.name}</div>

                        {item.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.description}
                          </div>
                        )}

                        {isMenusTable && item.subpath && (
                          <div className="text-[11px] text-gray-500 mt-0.5 break-all">
                            {item.subpath}
                          </div>
                        )}

                        {!isMenusTable && (item.module || "") && (
                          <div className="mt-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0.5 rounded"
                            >
                              {item.module || "General"}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {filteredPackages.map((pkg) => {
                    const enabled =
                      matrixData[selectedProduct.product_code]?.[
                        `${item.id}-${pkg.id}`
                      ]?.enabled || false;

                    return (
                      <td
                        key={String(pkg.id)}
                        className="border border-gray-300 p-3 text-center"
                      >
                        <div className="flex items-center justify-center">
                          {enabled ? (
                            <span className="text-green-600 text-lg">✅</span>
                          ) : (
                            <span className="text-gray-400 text-lg">❌</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    );
  };

  // ====== Preview/Print ======
  const openPreview = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Save before preview?")) {
        saveChanges();
      }
    }
    setPreviewMode(true);
  };
  const printToPDF = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Save before printing?")) {
        saveChanges();
      }
    }
    window.print();
  };
  const closePreview = () => setPreviewMode(false);

  // ====== RENDER utama ======
  if (!selectedProduct) {
    return (
      <div className="p-6">
        <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
        Loading products...
      </div>
    );
  }

  // Sidebar Produk
  const ProductList = () => (
    <div className="h-screen flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 backdrop-blur-xl border-r border-slate-700/50">
      <div className="p-4 border-b border-slate-700/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-600/50 focus:border-slate-500/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {products.map((product) => {
          const IconComponent = PackageIcon;
          const isSelected = selectedProduct?.id === product.id;
          return (
            <button
              key={product.id}
              onClick={() => {
                setSelectedProduct(product);
                setMobileDrawerOpen(true);
              }}
              className={`w-full h-[72px] flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${
                isSelected
                  ? "bg-gradient-to-r from-slate-700/80 to-slate-600/80 border border-slate-500/60 shadow-lg shadow-slate-900/50"
                  : "bg-slate-800/30 hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50 hover:shadow-md hover:shadow-slate-900/30"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  isSelected
                    ? "bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg shadow-slate-900/50"
                    : "bg-slate-700/50 group-hover:bg-slate-600/70"
                }`}
              >
                <IconComponent
                  className={`h-5 w-5 ${
                    isSelected ? "text-slate-100" : "text-slate-300"
                  }`}
                />
              </div>

              <div className="flex-1 text-left min-w-0">
                <h3
                  className={`font-semibold text-sm leading-tight truncate ${
                    isSelected
                      ? "text-slate-100"
                      : "text-slate-200 group-hover:text-slate-100"
                  }`}
                >
                  {product.name}
                </h3>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {product.description}
                </p>
              </div>

              <Badge
                variant={product.status === "active" ? "default" : "secondary"}
                className="text-xs flex-shrink-0"
              >
                {product.status}
              </Badge>
            </button>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-700/50">
        <Button className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-slate-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="h-full flex bg-background">
        {/* Left Panel */}
        <div className="hidden lg:block w-[260px] flex-shrink-0">
          <ProductList />
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-card/50 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileDrawerOpen(true)}
              >
                <MenuIcon className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">
                  Matrix Packages for {selectedProduct.name}
                </h1>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-card/30 gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* View Toggle */}
              <div className="flex bg-muted rounded-lg p-1">
                <button
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === "features"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted-foreground/10"
                  }`}
                  onClick={() => setViewMode("features")}
                >
                  Features
                </button>
                <button
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === "menus"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted-foreground/10"
                  }`}
                  onClick={() => setViewMode("menus")}
                >
                  Menus
                </button>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={groupByModule}
                    onCheckedChange={setGroupByModule}
                    id="group-by-module"
                  />
                  <label htmlFor="group-by-module" className="text-sm">
                    Group by Module
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={showOnlyDifferences}
                    onCheckedChange={setShowOnlyDifferences}
                    id="show-differences"
                  />
                  <label htmlFor="show-differences" className="text-sm">
                    Show only differences
                  </label>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search feature/menu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={saveChanges}
                disabled={!hasChanges || isSaving}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
                {hasChanges && (
                  <div className="w-2 h-2 bg-accent rounded-full ml-2" />
                )}
              </Button>

              {/* Preview */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Show</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setPreviewShowMode("features");
                      openPreview();
                    }}
                  >
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    Features
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPreviewShowMode("menus");
                      openPreview();
                    }}
                  >
                    <MenuIcon className="h-4 w-4 mr-2" />
                    Menus
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPreviewShowMode("both");
                      openPreview();
                    }}
                  >
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    Both
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={printToPDF}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print PDF
              </Button>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="flex-1 overflow-auto">
            {filteredPackages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <PackageIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No packages yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  Create packages first to manage the feature & menu matrix.
                </p>
                <Button>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Go to Package Product
                </Button>
              </div>
            ) : Object.keys(finalGroupedFeatures).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <Grid3X3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No data</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  Load data in Features & Menus first.
                </p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full border-collapse border border-slate-300 dark:border-slate-700">
                  <thead>
                    <tr className="bg-white dark:bg-slate-900 sticky top-0 z-10">
                      <th className="border border-slate-300 dark:border-slate-700 p-3 text-left font-semibold sticky left-0 bg-white dark:bg-slate-900">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={
                              selectedRows.length === filteredFeatures.length &&
                              filteredFeatures.length > 0
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRows(
                                  filteredFeatures.map((f) => f.id)
                                );
                              } else {
                                setSelectedRows([]);
                              }
                            }}
                          />
                          Features / Menus
                        </div>
                      </th>
                      {filteredPackages.map((pkg) => (
                        <th
                          key={String(pkg.id)}
                          className="border border-slate-300 dark:border-slate-700 p-3 text-center font-semibold min-w-[120px]"
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-semibold text-sm">
                                {pkg.name}
                              </span>
                              <Badge
                                variant={
                                  pkg.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs px-2 py-0.5 rounded-full"
                              >
                                {pkg.status}
                              </Badge>
                            </div>
                            <button
                              className="text-xs text-slate-500 hover:text-primary transition-colors"
                              onClick={() => {
                                const allEnabled = filteredFeatures.every(
                                  (feature) =>
                                    matrixData[selectedProduct.product_code]?.[
                                      `${feature.id}-${pkg.id}`
                                    ]?.enabled
                                );
                                toggleEntireColumn(pkg.id, !allEnabled);
                              }}
                            >
                              Toggle all
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {Object.entries(finalGroupedFeatures).map(
                      ([module, features]) => (
                        <React.Fragment key={module}>
                          {groupByModule && (
                            <tr className="bg-gray-50 dark:bg-gray-700">
                              <td
                                colSpan={filteredPackages.length + 1}
                                className="border border-slate-300 dark:border-slate-700 p-2 font-medium text-gray-700 dark:text-gray-300"
                              >
                                📁 {module}
                              </td>
                            </tr>
                          )}

                          {features.map((feature) => {
                            const IconComponent = feature.icon || PackageIcon;
                            const isSelected = selectedRows.includes(
                              feature.id
                            );
                            const hasDependencyIssues =
                              !checkDependencies(feature);
                            return (
                              <tr
                                key={feature.id}
                                className="h-12 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                              >
                                <td className="border border-slate-300 dark:border-slate-700 p-3 sticky left-0 bg-white dark:bg-slate-900">
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        if (checked)
                                          setSelectedRows([
                                            ...selectedRows,
                                            feature.id,
                                          ]);
                                        else
                                          setSelectedRows(
                                            selectedRows.filter(
                                              (id) => id !== feature.id
                                            )
                                          );
                                      }}
                                    />
                                    <div className="flex items-center gap-2">
                                      <IconComponent className="h-4 w-4 text-primary flex-shrink-0" />
                                      <div className="flex flex-col min-w-0">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button
                                              className="text-left font-medium text-sm hover:text-primary transition-colors truncate"
                                              onClick={() => {
                                                setSelectedFeature(feature);
                                                setDetailDrawerOpen(true);
                                              }}
                                            >
                                              {feature.name}
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <div className="text-sm">
                                              <div className="font-semibold">
                                                {feature.name}
                                              </div>
                                              {feature.description && (
                                                <div className="text-slate-600 dark:text-slate-400">
                                                  {feature.description}
                                                </div>
                                              )}
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge
                                            variant="outline"
                                            className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                          >
                                            {feature.module || "General"}
                                          </Badge>
                                          <Badge
                                            variant="outline"
                                            className="text-xs px-2 py-0.5 rounded-full"
                                          >
                                            {feature.type}
                                          </Badge>
                                          {hasDependencyIssues && (
                                            <Badge
                                              variant="destructive"
                                              className="text-xs px-2 py-0.5 rounded-full"
                                            >
                                              Dependency
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {filteredPackages.map((pkg) => {
                                  const key = `${feature.id}-${pkg.id}`;
                                  const cell =
                                    matrixData[selectedProduct.product_code]?.[
                                      key
                                    ];
                                  const isEnabled = cell?.enabled || false;
                                  const isDraft = cell?.isDraft || false;
                                  return (
                                    <td
                                      key={String(pkg.id)}
                                      className="border border-slate-300 dark:border-slate-700 p-3 text-center"
                                    >
                                      <div className="flex flex-col items-center gap-1">
                                        <button
                                          onClick={() =>
                                            toggleCell(feature.id, pkg.id)
                                          }
                                          className="text-lg hover:scale-110 transition-transform"
                                        >
                                          {isEnabled ? (
                                            <span className="text-green-600">
                                              ✅
                                            </span>
                                          ) : (
                                            <span className="text-red-500">
                                              ❌
                                            </span>
                                          )}
                                        </button>
                                        {isDraft && (
                                          <span className="text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/20 px-1 rounded">
                                            Draft
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Detail Drawer */}
        <Sheet open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <div className="flex items-center gap-2">
                {selectedFeature?.icon && (
                  <selectedFeature.icon className="h-5 w-5" />
                )}
                {selectedFeature?.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedFeature?.module || "General"} • {selectedFeature?.type}
              </div>
            </SheetHeader>

            {selectedFeature && (
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex flex-col gap-2">
                  <div className="font-semibold">Description</div>
                  <div>
                    {selectedFeature.description || "No description available"}
                  </div>
                </div>

                {selectedFeature.dependencies && (
                  <div className="flex flex-col gap-2">
                    <div className="font-semibold">Dependencies</div>
                    <div className="flex flex-col gap-1">
                      {selectedFeature.dependencies.map((depId) => (
                        <span key={depId} className="text-sm">
                          • {depId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <div className="font-semibold">Package Settings</div>
                  <div className="flex flex-col gap-2">
                    {filteredPackages.map((pkg) => {
                      const key = `${selectedFeature.id}-${pkg.id}`;
                      const isEnabled =
                        matrixData[selectedProduct.product_code]?.[key]
                          ?.enabled || false;

                      return (
                        <div
                          key={String(pkg.id)}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm">{pkg.name}</span>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() =>
                              toggleFeature(selectedFeature.id, pkg.id)
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    className="w-full mt-4"
                    onClick={() => setDetailDrawerOpen(false)}
                  >
                    Apply Changes
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* Preview Modal */}
      {previewMode && (
        <div className="fixed inset-0 bg-white dark:bg-slate-900 z-50 overflow-auto">
          <div className="max-w-6xl mx-auto p-6">
            {/* Preview Header */}
            <div className="flex items-center justify-between mb-6 print:hidden">
              <div>
                <h2 className="text-xl font-semibold">
                  Print Preview - {selectedProduct.name}
                </h2>
                <div className="text-sm text-muted-foreground">
                  {previewShowMode === "both"
                    ? "Features & Menus"
                    : previewShowMode === "features"
                    ? "Features"
                    : "Menus"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={printToPDF}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print PDF
                </Button>
                <Button variant="outline" onClick={closePreview}>
                  Close Preview
                </Button>
              </div>
            </div>

            {/* Print Options */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 print:hidden">
              <div>
                <label className="text-sm font-medium">Show</label>
                <div className="flex bg-muted rounded-lg p-1 mt-1">
                  <button
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      previewShowMode === "features"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted-foreground/10"
                    }`}
                    onClick={() => setPreviewShowMode("features")}
                  >
                    Features
                  </button>
                  <button
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      previewShowMode === "menus"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted-foreground/10"
                    }`}
                    onClick={() => setPreviewShowMode("menus")}
                  >
                    Menus
                  </button>
                  <button
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      previewShowMode === "both"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted-foreground/10"
                    }`}
                    onClick={() => setPreviewShowMode("both")}
                  >
                    Both
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Orientation</label>
                <div className="flex bg-muted rounded-lg p-1 mt-1">
                  <button
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      printOptions.orientation === "portrait"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted-foreground/10"
                    }`}
                    onClick={() =>
                      setPrintOptions({
                        ...printOptions,
                        orientation: "portrait",
                      })
                    }
                  >
                    Portrait
                  </button>
                  <button
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      printOptions.orientation === "landscape"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted-foreground/10"
                    }`}
                    onClick={() =>
                      setPrintOptions({
                        ...printOptions,
                        orientation: "landscape",
                      })
                    }
                  >
                    Landscape
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Paper Size</label>
                <div className="flex bg-muted rounded-lg p-1 mt-1">
                  <button
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      printOptions.paper === "A4"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted-foreground/10"
                    }`}
                    onClick={() =>
                      setPrintOptions({ ...printOptions, paper: "A4" })
                    }
                  >
                    A4
                  </button>
                  <button
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      printOptions.paper === "Letter"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted-foreground/10"
                    }`}
                    onClick={() =>
                      setPrintOptions({ ...printOptions, paper: "Letter" })
                    }
                  >
                    Letter
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Options</label>
                <div className="flex items-center gap-2 mt-1">
                  <Switch
                    checked={printOptions.showLegend}
                    onCheckedChange={(checked) =>
                      setPrintOptions({ ...printOptions, showLegend: checked })
                    }
                    id="show-legend"
                  />
                  <label htmlFor="show-legend" className="text-xs">
                    Legend
                  </label>
                </div>
              </div>
            </div>

            {/* Print Content */}
            <div className="print-content">
              <div className="mb-4">
                <h1 className="text-2xl font-bold mb-2">
                  {selectedProduct.name} -{" "}
                  {previewShowMode === "both"
                    ? "Features & Menus"
                    : previewShowMode === "features"
                    ? "Features"
                    : "Menus"}{" "}
                  Matrix
                </h1>
                <div className="text-sm text-muted-foreground">
                  Packages: {filteredPackages.map((p) => p.name).join(", ")}
                </div>
              </div>

              {printOptions.showLegend && (
                <div className="flex items-center gap-6 mb-6 p-4 bg-muted rounded-lg">
                  <div className="font-medium">Legend:</div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-lg">✅</span>
                    <span className="text-sm">Enabled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-lg">❌</span>
                    <span className="text-sm">Disabled</span>
                  </div>
                </div>
              )}

              {previewShowMode === "both" ? (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      Features Matrix
                    </h2>
                    {renderPrintTable(getPreviewItems("features"))}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Menus Matrix</h2>
                    {renderPrintTable(getPreviewItems("menus"))}
                  </div>
                </div>
              ) : (
                renderPrintTable(
                  getPreviewItems(
                    previewShowMode === "features" ? "features" : "menus"
                  )
                )
              )}

              <div className="text-center text-sm text-muted-foreground mt-8 pt-4 border-t">
                Agile Store • {selectedProduct.name}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content,
          .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
          }
          @page {
            margin: 1in;
            size: ${printOptions.paper} ${printOptions.orientation};
          }
        }
      `}</style>
    </TooltipProvider>
  );
}
