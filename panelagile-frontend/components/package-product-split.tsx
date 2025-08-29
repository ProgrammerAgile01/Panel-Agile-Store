"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package as PackageIcon,
  Search,
  Plus,
  Download,
  Edit,
  Trash2,
  Menu,
  X,
  Box,
  Zap,
} from "lucide-react";

// === API hooks ===
import {
  listPanelCatalogProducts,
  panelListPackagesByProduct,
  createPackage,
  updatePackage,
  deletePackage,
} from "@/lib/api"; // sesuaikan path Anda

// Adaptasi tipe agar serasi dengan API
interface Product {
  id: string | number;
  product_code: string;
  product_name: string;
  description?: string | null;
  category?: string | null;
  status?: string | null;
  // tambahan untuk UI lama:
  icon?: any;
  packageCount?: number;
}

interface PackageItem {
  id: number;
  product_code: string;
  product_id?: string | null;
  package_code: string;
  name: string;
  description?: string | null;
  status: "active" | "inactive";
  notes?: string | null;
  order_number?: number;
}

export function PackageProductSplit() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [addPackageOpen, setAddPackageOpen] = useState(false);
  const [newPackage, setNewPackage] = useState({
    name: "",
    description: "",
    status: true,
    notes: "",
  });

  // === Load products from Panel Catalog (public) ===
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingProducts(true);
      try {
        const res = await listPanelCatalogProducts(undefined, 200);
        // ekspektasi res: { data: [...] }
        const rows: any[] = res?.data ?? [];
        // map ke tipe Product lama
        const mapped: Product[] = rows.map((r) => ({
          id: r.id,
          product_code: r.product_code,
          product_name: r.product_name,
          description: r.description ?? "",
          category: r.category ?? "",
          status: r.status ?? "active",
          icon: guessIcon(r?.product_code, r?.product_name),
          packageCount: undefined, // akan dihitung saat fetch packages
        }));
        if (mounted) {
          setProducts(mapped);
          setSelectedProduct(mapped[0] ?? null);
        }
      } catch (e) {
        console.error("Failed to load products", e);
        if (mounted) {
          setProducts([]);
          setSelectedProduct(null);
        }
      } finally {
        if (mounted) setLoadingProducts(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // === Load packages when selectedProduct changes ===
  useEffect(() => {
    if (!selectedProduct) return;
    let mounted = true;
    (async () => {
      setLoadingPackages(true);
      try {
        const codeOrId = String(
          selectedProduct.product_code || selectedProduct.id
        );
        const res = await panelListPackagesByProduct(codeOrId, true); // include inactive agar filter bisa jalan di FE
        const rows: PackageItem[] = res?.data ?? [];
        if (mounted) {
          setPackages(rows);
        }
      } catch (e) {
        console.error("Failed to load packages", e);
        if (mounted) setPackages([]);
      } finally {
        if (mounted) setLoadingPackages(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedProduct]);

  const filteredPackages = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return (packages ?? []).filter((pkg) => {
      const matchesSearch =
        pkg.name.toLowerCase().includes(term) ||
        (pkg.description ?? "").toLowerCase().includes(term) ||
        (pkg.notes ?? "").toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && pkg.status === "active") ||
        (statusFilter === "archived" && pkg.status === "inactive");
      return matchesSearch && matchesStatus;
    });
  }, [packages, searchTerm, statusFilter]);

  const handleAddPackage = async () => {
    if (!selectedProduct) return;
    try {
      const payload = {
        product_code: selectedProduct.product_code,
        product_id: String(selectedProduct.id),
        name: newPackage.name.trim(),
        package_code: undefined, // auto-slug dari backend
        description: newPackage.description.trim() || undefined,
        notes: newPackage.notes.trim() || undefined,
        status: newPackage.status ? ("active" as const) : ("inactive" as const),
        order_number: 0,
      };
      const res = await createPackage(payload);
      console.log("Created package:", res);
      // refresh list
      const reload = await panelListPackagesByProduct(
        selectedProduct.product_code,
        true
      );
      setPackages(reload?.data ?? []);
      // reset dialog
      setAddPackageOpen(false);
      setNewPackage({ name: "", description: "", status: true, notes: "" });
    } catch (e) {
      console.error("Failed to create package", e);
    }
  };

  const handleDelete = async (pkg: PackageItem) => {
    try {
      await deletePackage(pkg.id);
      setPackages((prev) => prev.filter((x) => x.id !== pkg.id));
    } catch (e) {
      console.error("Failed to delete package", e);
    }
  };

  // Optional: export CSV dari packages saat ini (client-side)
  const handleExportCsv = () => {
    if (!packages || packages.length === 0) return;
    const headers = [
      "id",
      "product_code",
      "package_code",
      "name",
      "status",
      "description",
      "notes",
      "order_number",
    ];
    const rows = packages.map((p) => [
      p.id,
      p.product_code,
      p.package_code,
      csvSafe(p.name),
      p.status,
      csvSafe(p.description ?? ""),
      csvSafe(p.notes ?? ""),
      p.order_number ?? 0,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = `packages_${
      selectedProduct?.product_code ?? "product"
    }.csv`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ProductList = () => (
    <div className="w-full lg:w-[260px] bg-gradient-to-b from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 backdrop-blur-xl border-r border-slate-700/50 flex flex-col">
      <div className="p-4 border-b border-slate-700/50">
        <h3 className="font-semibold text-white mb-1">Products</h3>
        <p className="text-sm text-slate-300">
          Select a product to manage packages
        </p>
      </div>

      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {loadingProducts && (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-full h-[72px] p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 animate-pulse"
              />
            ))}
          </>
        )}

        {!loadingProducts &&
          products.map((product) => {
            const Icon = product.icon ?? PackageIcon;
            const isSelected =
              selectedProduct?.product_code === product.product_code;

            return (
              <button
                key={String(product.id)}
                onClick={() => {
                  setSelectedProduct(product);
                  setMobileDrawerOpen(false);
                }}
                className={`w-full h-[72px] p-3 rounded-xl transition-all duration-300 flex items-center gap-3 text-left group ${
                  isSelected
                    ? "bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-600/50 shadow-lg shadow-slate-900/20"
                    : "bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700/50 hover:border-slate-600/30"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isSelected
                      ? "bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg shadow-slate-900/30"
                      : "bg-slate-700 group-hover:bg-slate-600"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isSelected
                        ? "text-white"
                        : "text-slate-300 group-hover:text-white"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4
                    className={`font-medium text-sm leading-tight truncate ${
                      isSelected
                        ? "text-white"
                        : "text-slate-100 group-hover:text-white"
                    }`}
                  >
                    {product.product_name}
                  </h4>
                  <p
                    className={`text-xs leading-tight truncate mt-0.5 ${
                      isSelected ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    {product.product_code}
                  </p>
                </div>

                {isSelected && (
                  <div className="w-2 h-2 bg-slate-400 rounded-full flex-shrink-0 animate-pulse" />
                )}
              </button>
            );
          })}
      </div>

      <div className="p-3 border-t border-slate-700/50">
        <Button
          className="w-full h-11 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-medium shadow-lg shadow-slate-900/30 transition-all duration-300"
          onClick={() => console.log("Add new product")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">
      {/* Desktop Layout */}
      <div className="hidden lg:flex w-full">
        <ProductList />

        {/* Right Panel - Package Management */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border bg-card/50">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Packages for {selectedProduct?.product_name ?? "-"}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {selectedProduct?.description ?? ""}
            </p>
          </div>

          {/* Toolbar */}
          <div className="p-6 border-b border-border bg-card/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search packages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background/50 border-primary/20 focus:border-primary/40"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 bg-background/50 border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Packages</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary/20 hover:bg-primary/10 bg-transparent"
                  onClick={handleExportCsv}
                  disabled={loadingPackages || (packages?.length ?? 0) === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>

                <Dialog open={addPackageOpen} onOpenChange={setAddPackageOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg shadow-primary/30"
                      disabled={!selectedProduct}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Package
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Package</DialogTitle>
                      <DialogDescription>
                        Create a new package for{" "}
                        {selectedProduct?.product_name ?? "-"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="package-name">Package Name</Label>
                        <Input
                          id="package-name"
                          value={newPackage.name}
                          onChange={(e) =>
                            setNewPackage({
                              ...newPackage,
                              name: e.target.value,
                            })
                          }
                          placeholder="Enter package name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="package-description">Description</Label>
                        <Input
                          id="package-description"
                          value={newPackage.description}
                          onChange={(e) =>
                            setNewPackage({
                              ...newPackage,
                              description: e.target.value,
                            })
                          }
                          placeholder="Enter package description"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="package-status"
                          checked={newPackage.status}
                          onCheckedChange={(checked) =>
                            setNewPackage({ ...newPackage, status: checked })
                          }
                        />
                        <Label htmlFor="package-status">Active</Label>
                      </div>
                      <div>
                        <Label htmlFor="package-notes">Notes</Label>
                        <Textarea
                          id="package-notes"
                          value={newPackage.notes}
                          onChange={(e) =>
                            setNewPackage({
                              ...newPackage,
                              notes: e.target.value,
                            })
                          }
                          placeholder="Additional notes (optional)"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setAddPackageOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddPackage}
                        className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white"
                        disabled={!newPackage.name.trim() || !selectedProduct}
                      >
                        Save Package
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Package Table */}
          <div className="flex-1 p-6 overflow-auto">
            {loadingPackages ? (
              <div className="bg-card/50 rounded-xl border border-primary/20 overflow-hidden p-6">
                <div className="h-5 w-40 bg-muted animate-pulse mb-4 rounded" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 w-full bg-muted/50 animate-pulse rounded mb-2"
                  />
                ))}
              </div>
            ) : filteredPackages.length > 0 ? (
              <div className="bg-card/50 rounded-xl border border-primary/20 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-primary/20 hover:bg-primary/5">
                      <TableHead className="font-semibold">
                        Package Name
                      </TableHead>
                      <TableHead className="font-semibold">
                        Description
                      </TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPackages.map((pkg) => (
                      <TableRow
                        key={pkg.id}
                        className="border-primary/10 hover:bg-primary/5 transition-colors"
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">
                              {pkg.name}
                            </div>
                            {pkg.notes && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {pkg.notes}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground max-w-md">
                            {pkg.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              pkg.status === "active" ? "default" : "secondary"
                            }
                            className={
                              pkg.status === "active"
                                ? "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30"
                                : "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30"
                            }
                          >
                            {pkg.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                              onClick={() => {
                                // contoh minimal edit -> toggle status cepat
                                const next =
                                  pkg.status === "active"
                                    ? "inactive"
                                    : "active";
                                updatePackage(pkg.id, { status: next })
                                  .then(() => {
                                    setPackages((prev) =>
                                      prev.map((p) =>
                                        p.id === pkg.id
                                          ? { ...p, status: next }
                                          : p
                                      )
                                    );
                                  })
                                  .catch((err) =>
                                    console.error(
                                      "Failed to update package",
                                      err
                                    )
                                  );
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-500"
                              onClick={() => handleDelete(pkg)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Box className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No packages yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                  Add your first package to get started with managing{" "}
                  {selectedProduct?.product_name ?? "this product"} offerings.
                </p>
                <Button
                  onClick={() => setAddPackageOpen(true)}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Package
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col w-full">
        {/* Mobile Header with Product Selector */}
        <div className="p-4 border-b border-border bg-card/50">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">Package Management</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileDrawerOpen(true)}
              className="border-primary/20"
            >
              <Menu className="h-4 w-4 mr-2" />
              {selectedProduct?.product_name ?? "-"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedProduct?.description ?? ""}
          </p>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 p-4 overflow-auto">
          {/* Mobile Toolbar */}
          <div className="space-y-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search packages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Packages</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => setAddPackageOpen(true)}
                className="bg-gradient-to-r from-primary to-secondary text-white"
                disabled={!selectedProduct}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Package Cards */}
          {loadingPackages ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card/50 rounded-lg border border-primary/20 p-4 animate-pulse h-28"
                />
              ))}
            </div>
          ) : filteredPackages.length > 0 ? (
            <div className="space-y-3">
              {filteredPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-card/50 rounded-lg border border-primary/20 p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">{pkg.name}</h3>
                    <Badge
                      variant={
                        pkg.status === "active" ? "default" : "secondary"
                      }
                      className={
                        pkg.status === "active"
                          ? "bg-green-500/20 text-green-700 dark:text-green-300"
                          : "bg-gray-500/20 text-gray-700 dark:text-gray-300"
                      }
                    >
                      {pkg.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {pkg.description}
                  </p>
                  {pkg.notes && (
                    <p className="text-xs text-muted-foreground mb-3 italic">
                      {pkg.notes}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const next =
                          pkg.status === "active" ? "inactive" : "active";
                        updatePackage(pkg.id, { status: next })
                          .then(() =>
                            setPackages((prev) =>
                              prev.map((p) =>
                                p.id === pkg.id ? { ...p, status: next } : p
                              )
                            )
                          )
                          .catch((err) =>
                            console.error("Failed to update package", err)
                          );
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(pkg)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Box className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No packages yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first package to get started.
              </p>
              <Button
                onClick={() => setAddPackageOpen(true)}
                disabled={!selectedProduct}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Package
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Product Drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700/50">
              <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <h3 className="font-semibold text-white">Select Product</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-3">
                <ProductList />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// util kecil
function guessIcon(code?: string, name?: string) {
  const key = String(code ?? name ?? "").toLowerCase();
  if (key.includes("rentvix")) return PackageIcon;
  if (key.includes("absen")) return Zap;
  return PackageIcon;
}
function csvSafe(s: string) {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
