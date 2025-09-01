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
  Menu,
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

interface Product {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: "active" | "inactive";
  packages: Package[];
  features: Feature[];
}

interface Package {
  id: string;
  name: string;
  status: "active" | "archived";
  price: number;
}

interface Feature {
  id: string;
  name: string;
  module: string;
  type: "feature" | "menu";
  icon: any;
  description?: string;
  dependencies?: string[];
  subpath?: string;
}

interface MatrixCell {
  enabled: boolean;
  isDraft?: boolean;
}

interface BulkAction {
  type: "enable" | "disable" | "rule";
  featureIds: string[];
  packageIds?: string[];
  rule?: string;
}

// Sample data matching specifications
const mockProducts: Product[] = [
  {
    id: "rentvix-pro",
    name: "RentVix Pro",
    description: "Complete rental management system",
    icon: PackageIcon,
    status: "active",
    packages: [
      { id: "starter", name: "Starter", status: "active", price: 29 },
      { id: "medium", name: "Medium", status: "active", price: 79 },
      {
        id: "professional",
        name: "Professional",
        status: "active",
        price: 149,
      },
    ],
    features: [
      // Communication Features
      {
        id: "whatsapp",
        name: "Send WhatsApp",
        module: "Communication",
        type: "feature",
        icon: MessageSquare,
        description: "Send WhatsApp messages to customers",
      },
      {
        id: "email",
        name: "Send Email",
        module: "Communication",
        type: "feature",
        icon: Mail,
        description: "Send email notifications",
        dependencies: ["email-template"],
      },
      {
        id: "email-template",
        name: "Email Template",
        module: "Communication",
        type: "feature",
        icon: FileText,
        description: "Email template management",
      },

      // Reporting Features
      {
        id: "export-excel",
        name: "Export Excel",
        module: "Reporting",
        type: "feature",
        icon: FileText,
        description: "Export data to Excel format",
      },

      // Analytics Features
      {
        id: "dashboard-kpi",
        name: "Dashboard KPI",
        module: "Analytics",
        type: "feature",
        icon: BarChart3,
        description: "Key performance indicators dashboard",
      },

      // Automation Features
      {
        id: "reminder-notifications",
        name: "Reminder Notifications",
        module: "Automation",
        type: "feature",
        icon: Bell,
        description: "Automated reminder system",
      },

      // Finance Menus
      {
        id: "keuangan",
        name: "Keuangan",
        module: "Finance",
        type: "menu",
        icon: DollarSign,
        description: "Financial management menu",
      },
      {
        id: "laba-rugi",
        name: "Laba Rugi",
        module: "Finance",
        type: "menu",
        icon: BarChart3,
        description: "Profit & Loss reports",
        subpath: "Finance › Laba Rugi",
      },

      // Booking Menus
      {
        id: "order",
        name: "Order",
        module: "Booking",
        type: "menu",
        icon: Calendar,
        description: "Order management menu",
      },
      {
        id: "jadwal",
        name: "Jadwal",
        module: "Booking",
        type: "menu",
        icon: Clock,
        description: "Schedule management menu",
      },

      // Vehicle Menus
      {
        id: "data-kendaraan",
        name: "Data Kendaraan",
        module: "Kendaraan",
        type: "menu",
        icon: PackageIcon,
        description: "Vehicle data management",
      },
    ],
  },
];

// Matrix data matching sample specifications
const initialMatrix: Record<string, Record<string, MatrixCell>> = {
  "rentvix-pro": {
    "whatsapp-starter": { enabled: false },
    "whatsapp-medium": { enabled: false },
    "whatsapp-professional": { enabled: true },

    "email-starter": { enabled: false },
    "email-medium": { enabled: true },
    "email-professional": { enabled: true },

    "email-template-starter": { enabled: false },
    "email-template-medium": { enabled: true },
    "email-template-professional": { enabled: true },

    "export-excel-starter": { enabled: true },
    "export-excel-medium": { enabled: true },
    "export-excel-professional": { enabled: true },

    "dashboard-kpi-starter": { enabled: true },
    "dashboard-kpi-medium": { enabled: true },
    "dashboard-kpi-professional": { enabled: true },

    "reminder-notifications-starter": { enabled: false },
    "reminder-notifications-medium": { enabled: true },
    "reminder-notifications-professional": { enabled: true },

    "keuangan-starter": { enabled: false },
    "keuangan-medium": { enabled: true },
    "keuangan-professional": { enabled: true },

    "laba-rugi-starter": { enabled: false },
    "laba-rugi-medium": { enabled: true },
    "laba-rugi-professional": { enabled: true },

    "order-starter": { enabled: true },
    "order-medium": { enabled: true },
    "order-professional": { enabled: true },

    "jadwal-starter": { enabled: true },
    "jadwal-medium": { enabled: true },
    "jadwal-professional": { enabled: true },

    "data-kendaraan-starter": { enabled: false },
    "data-kendaraan-medium": { enabled: true },
    "data-kendaraan-professional": { enabled: true },
  },
};

export function MatrixPackageSplit() {
  const [selectedProduct, setSelectedProduct] = useState<Product>(
    mockProducts[0]
  );
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"features" | "menus">("features");
  const [filterMode, setFilterMode] = useState("all");
  const [groupByModule, setGroupByModule] = useState(true);
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const [compactDensity, setCompactDensity] = useState(false);
  const [matrixData, setMatrixData] = useState(initialMatrix);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  const [previewMode, setPreviewMode] = useState(false);
  const [printOptions, setPrintOptions] = useState({
    orientation: "portrait" as "portrait" | "landscape",
    paper: "A4" as "A4" | "Letter",
    scale: 100,
    showLegend: true,
    includeGroups: true,
    compactRows: false,
  });

  const [previewShowMode, setPreviewShowMode] = useState<
    "features" | "menus" | "both"
  >("features");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const hasChanges = Object.values(matrixData[selectedProduct.id] || {}).some(
    (cell) => cell.isDraft
  );

  const filteredFeatures = selectedProduct.features.filter((feature) => {
    if (viewMode === "features" && feature.type !== "feature") return false;
    if (viewMode === "menus" && feature.type !== "menu") return false;

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      return (
        feature.name.toLowerCase().includes(searchLower) ||
        feature.module.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const filteredPackages = selectedProduct.packages.filter((pkg) => {
    if (filterMode === "active" && pkg.status !== "active") return false;
    if (filterMode === "archived" && pkg.status !== "archived") return false;
    return true;
  });

  const groupedFeatures = groupByModule
    ? filteredFeatures.reduce((acc, feature) => {
        if (!acc[feature.module]) acc[feature.module] = [];
        acc[feature.module].push(feature);
        return acc;
      }, {} as Record<string, Feature[]>)
    : { "All Features": filteredFeatures };

  const finalGroupedFeatures = showOnlyDifferences
    ? Object.entries(groupedFeatures).reduce((acc, [module, features]) => {
        const filteredFeatures = features.filter((feature) => {
          const values = filteredPackages.map(
            (pkg) =>
              matrixData[selectedProduct.id]?.[`${feature.id}-${pkg.id}`]
                ?.enabled || false
          );
          return !values.every((val) => val === values[0]);
        });
        if (filteredFeatures.length > 0) {
          acc[module] = filteredFeatures;
        }
        return acc;
      }, {} as Record<string, Feature[]>)
    : groupedFeatures;

  const toggleFeature = useCallback(
    (featureId: string, packageId: string) => {
      const key = `${featureId}-${packageId}`;
      const productKey = selectedProduct.id;

      setMatrixData((prev) => ({
        ...prev,
        [productKey]: {
          ...prev[productKey],
          [key]: {
            enabled: !prev[productKey]?.[key]?.enabled,
            isDraft: true,
          },
        },
      }));
    },
    [selectedProduct.id]
  );

  const toggleEntireRow = useCallback(
    (featureId: string, enabled: boolean) => {
      const productKey = selectedProduct.id;
      const updates: Record<string, MatrixCell> = {};

      filteredPackages.forEach((pkg) => {
        const key = `${featureId}-${pkg.id}`;
        updates[key] = { enabled, isDraft: true };
      });

      setMatrixData((prev) => ({
        ...prev,
        [productKey]: { ...prev[productKey], ...updates },
      }));
    },
    [selectedProduct.id, filteredPackages]
  );

  const toggleEntireColumn = useCallback(
    (packageId: string, enabled: boolean) => {
      const productKey = selectedProduct.id;
      const updates: Record<string, MatrixCell> = {};

      filteredFeatures.forEach((feature) => {
        const key = `${feature.id}-${packageId}`;
        updates[key] = { enabled, isDraft: true };
      });

      setMatrixData((prev) => ({
        ...prev,
        [productKey]: { ...prev[productKey], ...updates },
      }));
    },
    [selectedProduct.id, filteredFeatures]
  );

  const applyBulkAction = useCallback(
    (action: BulkAction) => {
      const productKey = selectedProduct.id;
      const updates: Record<string, MatrixCell> = {};

      action.featureIds.forEach((featureId) => {
        const packages = action.packageIds || filteredPackages.map((p) => p.id);
        packages.forEach((packageId) => {
          const key = `${featureId}-${packageId}`;
          updates[key] = {
            enabled: action.type === "enable",
            isDraft: true,
          };
        });
      });

      setMatrixData((prev) => ({
        ...prev,
        [productKey]: { ...prev[productKey], ...updates },
      }));

      setSelectedRows([]);
      toast({
        title: "Bulk action applied",
        description: `${action.type === "enable" ? "Enabled" : "Disabled"} ${
          action.featureIds.length
        } features`,
      });
    },
    [selectedProduct.id, filteredPackages]
  );

  const saveChanges = useCallback(async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Remove draft flags
      const productKey = selectedProduct.id;
      const cleanedData = Object.entries(matrixData[productKey] || {}).reduce(
        (acc, [key, cell]) => {
          acc[key] = { enabled: cell.enabled, isDraft: false };
          return acc;
        },
        {} as Record<string, MatrixCell>
      );

      setMatrixData((prev) => ({
        ...prev,
        [productKey]: cleanedData,
      }));

      toast({
        title: "Matrix saved",
        description: "Feature matrix has been successfully updated",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save matrix changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [selectedProduct.id, matrixData]);

  const exportCSV = useCallback(() => {
    const rows = [["type", "group", "name", "package", "enabled"]];

    Object.entries(finalGroupedFeatures).forEach(([module, features]) => {
      features.forEach((feature) => {
        filteredPackages.forEach((pkg) => {
          const key = `${feature.id}-${pkg.id}`;
          const enabled = matrixData[selectedProduct.id]?.[key]?.enabled
            ? "1"
            : "0";
          rows.push([feature.type, module, feature.name, pkg.name, enabled]);
        });
      });
    });

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedProduct.name}-matrix.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "CSV exported",
      description: "Matrix data has been exported successfully",
    });
  }, [selectedProduct, finalGroupedFeatures, filteredPackages, matrixData]);

  const checkDependencies = useCallback(
    (feature: Feature): boolean => {
      if (!feature.dependencies) return true;

      return feature.dependencies.every((depId) => {
        const depFeature = selectedProduct.features.find((f) => f.id === depId);
        if (!depFeature) return true;

        return filteredPackages.some((pkg) => {
          const key = `${depId}-${pkg.id}`;
          return matrixData[selectedProduct.id]?.[key]?.enabled;
        });
      });
    },
    [selectedProduct, filteredPackages, matrixData]
  );

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

  const closePreview = () => {
    setPreviewMode(false);
  };

  const ProductList = () => (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 backdrop-blur-xl border-r border-slate-700/50">
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
        {mockProducts.map((product) => {
          const IconComponent = product.icon;
          const isSelected = selectedProduct.id === product.id;

          return (
            <button
              key={product.id}
              onClick={() => {
                setSelectedProduct(product);
                setMobileDrawerOpen(false);
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

  const renderPrintTable = (features: Feature[]) => (
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-100 dark:bg-gray-800">
          <th className="border border-gray-300 p-3 text-left font-semibold sticky left-0 bg-gray-100 dark:bg-gray-800">
            {previewShowMode === "features" ? "Features" : "Menus"}
          </th>
          {filteredPackages.map((pkg) => (
            <th
              key={pkg.id}
              className="border border-gray-300 p-3 text-center font-semibold min-w-[120px]"
            >
              {pkg.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {groupByModule
          ? Object.entries(groupedFeatures).map(([module, features]) => (
              <React.Fragment key={module}>
                {printOptions.includeGroups && (
                  <tr className="bg-gray-50 dark:bg-gray-700 break-inside-avoid">
                    <td
                      colSpan={filteredPackages.length + 1}
                      className="border border-gray-300 p-2 font-medium text-gray-700 dark:text-gray-300"
                    >
                      📁 {module}
                    </td>
                  </tr>
                )}
                {features.map((feature) => (
                  <tr
                    key={feature.id}
                    className={`${
                      printOptions.compactRows ? "h-8" : "h-12"
                    } break-inside-avoid`}
                  >
                    <td className="border border-gray-300 p-3 sticky left-0 bg-white dark:bg-gray-900">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {feature.type}
                        </Badge>
                        <span className="font-medium">{feature.name}</span>
                      </div>
                      {feature.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {feature.description}
                        </div>
                      )}
                    </td>
                    {filteredPackages.map((pkg) => {
                      const isEnabled =
                        matrixData[selectedProduct.id]?.[
                          `${feature.id}-${pkg.id}`
                        ]?.enabled;
                      return (
                        <td
                          key={pkg.id}
                          className="border border-gray-300 p-3 text-center"
                        >
                          <div className="flex items-center justify-center">
                            {isEnabled ? (
                              <span className="text-green-500 text-lg">✅</span>
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
            ))
          : features.map((feature) => (
              <tr
                key={feature.id}
                className={`${
                  printOptions.compactRows ? "h-8" : "h-12"
                } break-inside-avoid`}
              >
                <td className="border border-gray-300 p-3 sticky left-0 bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {feature.type}
                    </Badge>
                    <span className="font-medium">{feature.name}</span>
                  </div>
                  {feature.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {feature.description}
                    </div>
                  )}
                </td>
                {filteredPackages.map((pkg) => {
                  const isEnabled =
                    matrixData[selectedProduct.id]?.[`${feature.id}-${pkg.id}`]
                      ?.enabled;
                  return (
                    <td
                      key={pkg.id}
                      className="border border-gray-300 p-3 text-center"
                    >
                      <div className="flex items-center justify-center">
                        {isEnabled ? (
                          <span className="text-green-500 text-lg">✅</span>
                        ) : (
                          <span className="text-gray-400 text-lg">❌</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
      </tbody>
    </table>
  );

  const toggleCell = useCallback(
    (featureId: string, packageId: string) => {
      const key = `${featureId}-${packageId}`;
      const productKey = selectedProduct.id;

      setMatrixData((prev) => ({
        ...prev,
        [productKey]: {
          ...prev[productKey],
          [key]: {
            enabled: !prev[productKey]?.[key]?.enabled,
            isDraft: true,
          },
        },
      }));
    },
    [selectedProduct.id]
  );

  return (
    <TooltipProvider>
      <div className="h-full flex bg-background">
        {/* Desktop Left Panel */}
        <div className="hidden lg:block w-[260px] flex-shrink-0">
          <ProductList />
        </div>

        {/* Mobile Drawer */}
        {mobileDrawerOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 w-[280px] z-50 lg:hidden">
              <ProductList />
            </div>
          </>
        )}

        {/* Right Panel - Matrix Management */}
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
                <Menu className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">
                  Matrix Packages for {selectedProduct.name}
                </h1>
              </div>
            </div>
          </div>

          {/* Enhanced Toolbar */}
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

              {/* Preview with Show dropdown */}
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
                    <Menu className="h-4 w-4 mr-2" />
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

          {/* Bulk Actions Toolbar */}
          {selectedRows.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/10 border-b border-primary/20">
              <span className="text-sm font-medium">
                {selectedRows.length} rows selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    applyBulkAction({
                      type: "enable",
                      featureIds: selectedRows,
                    })
                  }
                >
                  Enable in selected packages
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    applyBulkAction({
                      type: "disable",
                      featureIds: selectedRows,
                    })
                  }
                >
                  Disable in selected packages
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedRows([])}
                >
                  Clear selection
                </Button>
              </div>
            </div>
          )}

          {/* Matrix Table */}
          <div className="flex-1 overflow-auto">
            {filteredPackages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <PackageIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No packages yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  Create packages first to manage the feature matrix — manage in
                  Package Product.
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
                <Button>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Go to Features & Menus
                </Button>
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
                              selectedRows.length === filteredFeatures.length
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
                          key={pkg.id}
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
                                    matrixData[selectedProduct.id]?.[
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
                            const IconComponent = feature.icon;
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
                                        if (checked) {
                                          setSelectedRows([
                                            ...selectedRows,
                                            feature.id,
                                          ]);
                                        } else {
                                          setSelectedRows(
                                            selectedRows.filter(
                                              (id) => id !== feature.id
                                            )
                                          );
                                        }
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
                                              {feature.subpath || feature.name}
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
                                            {feature.module}
                                          </Badge>
                                          <Badge
                                            variant="outline"
                                            className="text-xs px-2 py-0.5 rounded-full"
                                          >
                                            {feature.type}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                {filteredPackages.map((pkg) => {
                                  const key = `${feature.id}-${pkg.id}`;
                                  const cell =
                                    matrixData[selectedProduct.id]?.[key];
                                  const isEnabled = cell?.enabled || false;
                                  const isDraft = cell?.isDraft || false;

                                  return (
                                    <td
                                      key={pkg.id}
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
                {selectedFeature?.module} • {selectedFeature?.type}
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
                      {selectedFeature.dependencies.map((depId) => {
                        const dep = selectedProduct.features.find(
                          (f) => f.id === depId
                        );
                        return (
                          <span key={depId} className="text-sm">
                            • {dep?.name || depId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <div className="font-semibold">Package Settings</div>
                  <div className="flex flex-col gap-2">
                    {filteredPackages.map((pkg) => {
                      const key = `${selectedFeature.id}-${pkg.id}`;
                      const isEnabled =
                        matrixData[selectedProduct.id]?.[key]?.enabled || false;

                      return (
                        <div
                          key={pkg.id}
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
                  Generated on {new Date().toLocaleDateString()} at{" "}
                  {new Date().toLocaleTimeString()}
                </div>
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
                    <span className="text-red-500 text-lg">❌</span>
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
                    {renderPrintTable(
                      filteredFeatures.filter((f) => f.type === "feature")
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Menus Matrix</h2>
                    {renderPrintTable(
                      filteredFeatures.filter((f) => f.type === "menu")
                    )}
                  </div>
                </div>
              ) : (
                renderPrintTable(
                  filteredFeatures.filter((f) =>
                    previewShowMode === "features"
                      ? f.type === "feature"
                      : f.type === "menu"
                  )
                )
              )}

              <div className="text-center text-sm text-muted-foreground mt-8 pt-4 border-t">
                Agile Store • {selectedProduct.name} • Generated on{" "}
                {new Date().toLocaleDateString()} at{" "}
                {new Date().toLocaleTimeString()}
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
