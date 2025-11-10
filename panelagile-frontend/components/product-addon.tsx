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

import {
  listPanelCatalogProducts,
  panelListAddonsByProduct,
  createAddon,
  updateAddon,
  deleteAddon,
} from "@/lib/api";

type Product = {
  id: string | number;
  product_code: string;
  product_name: string;
  description?: string | null;
  status?: string | null;
  icon?: any;
};

type AddonItem = {
  id: number;
  product_code: string;
  addon_code: string;
  name: string;
  description?: string | null;

  kind: "quantity" | "toggle";
  pricing_mode: "per_unit_per_cycle" | "one_time";

  unit_label?: string | null;
  min_qty?: number;
  step_qty?: number;
  max_qty?: number | null;

  currency: string;
  unit_price: number;

  status: "active" | "inactive";
  order_number?: number | null;
  notes?: string | null;
};

export function MasterAddons() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingAddons, setLoadingAddons] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AddonItem | null>(null);

  const [form, setForm] = useState({
    name: "",
    addon_code: "",
    description: "",
    kind: "quantity" as "quantity" | "toggle",
    pricing_mode: "per_unit_per_cycle" as "per_unit_per_cycle" | "one_time",
    unit_label: "pelanggan",
    min_qty: 1,
    step_qty: 1,
    max_qty: null as number | null,
    currency: "IDR",
    unit_price: 5000,
    status: true,
    notes: "",
  });

  /* Load products */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingProducts(true);
      try {
        const res = await listPanelCatalogProducts(undefined, 200);
        const rows: any[] = res?.data ?? [];
        const mapped: Product[] = rows.map((r) => ({
          id: r.id,
          product_code: r.product_code,
          product_name: r.product_name,
          description: r.description ?? "",
          status: r.status ?? "active",
          icon: guessIcon(r?.product_code, r?.product_name),
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

  /* Load addons by product */
  useEffect(() => {
    if (!selectedProduct) return;
    let mounted = true;
    (async () => {
      setLoadingAddons(true);
      try {
        const codeOrId = String(
          selectedProduct.product_code || selectedProduct.id
        );
        const res = await panelListAddonsByProduct(codeOrId, true);
        const rows: AddonItem[] = res?.data ?? [];
        if (mounted) setAddons(rows);
      } catch (e) {
        console.error("Failed to load addons", e);
        if (mounted) setAddons([]);
      } finally {
        if (mounted) setLoadingAddons(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedProduct]);

  const filteredAddons = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return (addons ?? []).filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(term) ||
        (a.description ?? "").toLowerCase().includes(term) ||
        (a.notes ?? "").toLowerCase().includes(term) ||
        a.addon_code.toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && a.status === "active") ||
        (statusFilter === "archived" && a.status === "inactive");
      return matchesSearch && matchesStatus;
    });
  }, [addons, searchTerm, statusFilter]);

  /* Create */
  const handleCreate = async () => {
    if (!selectedProduct) return;
    const payload = {
      product_code: selectedProduct.product_code,
      name: form.name.trim(),
      addon_code: form.addon_code.trim() || undefined,
      description: form.description.trim() || undefined,
      kind: form.kind,
      pricing_mode: form.pricing_mode,
      unit_label:
        form.kind === "quantity" ? form.unit_label || "unit" : undefined,
      min_qty: form.kind === "quantity" ? form.min_qty : 0,
      step_qty: form.kind === "quantity" ? form.step_qty : 1,
      max_qty: form.kind === "quantity" ? form.max_qty : 1,
      currency: form.currency || "IDR",
      unit_price: Number(form.unit_price || 0),
      status: form.status ? "active" : "inactive",
      notes: form.notes.trim() || undefined,
    };
    await createAddon(payload);
    // reload
    const re = await panelListAddonsByProduct(
      selectedProduct.product_code,
      true
    );
    setAddons(re?.data ?? []);
    setAddOpen(false);
    resetForm();
  };

  /* Update (simple: toggle active/edit price etc) */
  const handleQuickToggle = async (row: AddonItem) => {
    const next = row.status === "active" ? "inactive" : "active";
    await updateAddon(row.id, { status: next });
    setAddons((prev) =>
      prev.map((x) => (x.id === row.id ? { ...x, status: next } : x))
    );
  };

  const openEdit = (row: AddonItem) => {
    setEditTarget(row);
    setForm({
      name: row.name,
      addon_code: row.addon_code,
      description: row.description || "",
      kind: row.kind,
      pricing_mode: row.pricing_mode,
      unit_label: row.unit_label || "unit",
      min_qty: row.min_qty ?? 1,
      step_qty: row.step_qty ?? 1,
      max_qty: row.max_qty ?? null,
      currency: row.currency || "IDR",
      unit_price: row.unit_price ?? 0,
      status: row.status === "active",
      notes: row.notes || "",
    });
    setAddOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    const payload: any = {
      name: form.name.trim(),
      addon_code: form.addon_code.trim() || undefined,
      description: form.description.trim() || undefined,
      kind: form.kind,
      pricing_mode: form.pricing_mode,
      unit_label:
        form.kind === "quantity" ? form.unit_label || "unit" : "toggle",
      min_qty: form.kind === "quantity" ? form.min_qty : 0,
      step_qty: form.kind === "quantity" ? form.step_qty : 1,
      max_qty: form.kind === "quantity" ? form.max_qty : 1,
      currency: form.currency || "IDR",
      unit_price: Number(form.unit_price || 0),
      status: form.status ? "active" : "inactive",
      notes: form.notes.trim() || undefined,
    };
    await updateAddon(editTarget.id, payload);
    // reload
    if (selectedProduct) {
      const re = await panelListAddonsByProduct(
        selectedProduct.product_code,
        true
      );
      setAddons(re?.data ?? []);
    }
    setAddOpen(false);
    setEditTarget(null);
    resetForm();
  };

  /* Delete */
  const handleDelete = async (row: AddonItem) => {
    await deleteAddon(row.id);
    setAddons((prev) => prev.filter((x) => x.id !== row.id));
  };

  /* Form helpers */
  const resetForm = () => {
    setForm({
      name: "",
      addon_code: "",
      description: "",
      kind: "quantity",
      pricing_mode: "per_unit_per_cycle",
      unit_label: "pelanggan",
      min_qty: 1,
      step_qty: 1,
      max_qty: null,
      currency: "IDR",
      unit_price: 5000,
      status: true,
      notes: "",
    });
  };

  const ProductList = () => (
    <div className="w-full lg:w-[260px] bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700/50 flex flex-col">
      <div className="p-4 border-b border-slate-700/50">
        <h3 className="font-semibold text-white mb-1">Products</h3>
        <p className="text-sm text-slate-300">
          Select a product to manage add-ons
        </p>
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {loadingProducts &&
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-full h-[72px] p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 animate-pulse"
            />
          ))}
        {!loadingProducts &&
          products.map((p) => {
            const Icon = p.icon ?? PackageIcon;
            const selected = selectedProduct?.product_code === p.product_code;
            return (
              <button
                key={String(p.id)}
                onClick={() => {
                  setSelectedProduct(p);
                  setMobileDrawerOpen(false);
                }}
                className={`w-full h-[72px] p-3 rounded-xl transition-all duration-300 flex items-center gap-3 text-left group ${
                  selected
                    ? "bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-600/50 shadow-lg shadow-slate-900/20"
                    : "bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700/50 hover:border-slate-600/30"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                    selected
                      ? "bg-gradient-to-br from-slate-600 to-slate-700"
                      : "bg-slate-700 group-hover:bg-slate-600"
                  }`}
                >
                  <Icon
                    className={`${
                      selected
                        ? "text-white"
                        : "text-slate-300 group-hover:text-white"
                    } h-5 w-5`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className={`font-medium text-sm truncate ${
                      selected
                        ? "text-white"
                        : "text-slate-100 group-hover:text-white"
                    }`}
                  >
                    {p.product_name}
                  </h4>
                  <p
                    className={`text-xs truncate mt-0.5 ${
                      selected ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    {p.product_code}
                  </p>
                </div>
                {selected && (
                  <div className="w-2 h-2 bg-slate-400 rounded-full flex-shrink-0 animate-pulse" />
                )}
              </button>
            );
          })}
      </div>
      <div className="p-3 border-t border-slate-700/50">
        <Button className="w-full h-11 bg-gradient-to-r from-slate-700 to-slate-800 text-white">
          Add Product
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">
      {/* Desktop */}
      <div className="hidden lg:flex w-full">
        <ProductList />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border bg-card/50">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Add-ons for {selectedProduct?.product_name ?? "-"}
            </h1>
            <p className="text-muted-foreground">
              {selectedProduct?.description ?? ""}
            </p>
          </div>

          {/* Toolbar */}
          <div className="p-6 border-b border-border bg-card/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search add-ons..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Add-ons" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Add-ons</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                  onClick={() =>
                    exportCsv(addons, selectedProduct?.product_code)
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>

                <Dialog
                  open={addOpen}
                  onOpenChange={(v) => {
                    setAddOpen(v);
                    if (!v) {
                      setEditTarget(null);
                      resetForm();
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      disabled={!selectedProduct}
                      className="bg-gradient-to-r from-primary to-secondary text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {editTarget ? "Edit Add-on" : "Add Add-on"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    className="
    w-[96vw] sm:max-w-[820px] lg:max-w-[980px]
    max-h-[90vh] p-0 overflow-hidden
    flex flex-col
  "
                  >
                    {/* HEADER (fixed) */}
                    <DialogHeader className="px-5 pt-5 pb-3 border-b">
                      <DialogTitle>
                        {editTarget ? "Edit Add-on" : "Add New Add-on"}
                      </DialogTitle>
                      <DialogDescription>
                        {selectedProduct?.product_name ?? "-"}
                      </DialogDescription>
                    </DialogHeader>

                    {/* BODY (scrollable) */}
                    <div className="px-5 py-4 overflow-y-auto">
                      <div className="space-y-4">
                        <div>
                          <Label>Addon Name</Label>
                          <Input
                            value={form.name}
                            onChange={(e) =>
                              setForm({ ...form, name: e.target.value })
                            }
                            placeholder=""
                            required
                          />
                        </div>

                        <div>
                          <Label>Addon Code</Label>
                          <Input
                            value={form.addon_code}
                            onChange={(e) =>
                              setForm({ ...form, addon_code: e.target.value })
                            }
                            placeholder="extra_customers"
                            required
                          />
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea
                            rows={3}
                            value={form.description}
                            onChange={(e) =>
                              setForm({ ...form, description: e.target.value })
                            }
                            placeholder="Keterangan add-on"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label>Kind</Label>
                            <Select
                              value={form.kind}
                              onValueChange={(v: any) =>
                                setForm({ ...form, kind: v })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="quantity">
                                  Quantity
                                </SelectItem>
                                <SelectItem value="toggle">Toggle</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Pricing Mode</Label>
                            <Select
                              value={form.pricing_mode}
                              onValueChange={(v: any) =>
                                setForm({ ...form, pricing_mode: v })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="per_unit_per_cycle">
                                  Per Unit / Per Cycle
                                </SelectItem>
                                <SelectItem value="one_time">
                                  One-time
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {form.kind === "quantity" && (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <Label>Unit Label</Label>
                                <Input
                                  value={form.unit_label}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      unit_label: e.target.value,
                                    })
                                  }
                                  placeholder="pelanggan"
                                />
                              </div>
                              <div>
                                <Label>Min Qty</Label>
                                <Input
                                  type="number"
                                  value={form.min_qty}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      min_qty: Number(e.target.value || 0),
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Step Qty</Label>
                                <Input
                                  type="number"
                                  value={form.step_qty}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      step_qty: Number(e.target.value || 1),
                                    })
                                  }
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <Label>Max Qty (optional)</Label>
                                <Input
                                  type="number"
                                  value={form.max_qty ?? ""}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setForm({
                                      ...form,
                                      max_qty: v === "" ? null : Number(v),
                                    });
                                  }}
                                  placeholder="kosongkan = tanpa batas"
                                />
                              </div>
                              <div>
                                <Label>Currency</Label>
                                <Input
                                  value={form.currency}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      currency: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Unit Price</Label>
                                <Input
                                  type="number"
                                  value={form.unit_price}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      unit_price: Number(e.target.value || 0),
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {form.kind === "toggle" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label>Currency</Label>
                              <Input
                                value={form.currency}
                                onChange={(e) =>
                                  setForm({ ...form, currency: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <Label>Price</Label>
                              <Input
                                type="number"
                                value={form.unit_price}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    unit_price: Number(e.target.value || 0),
                                  })
                                }
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={form.status}
                            onCheckedChange={(v) =>
                              setForm({ ...form, status: !!v })
                            }
                            id="addon-active"
                          />
                          <Label htmlFor="addon-active">Active</Label>
                        </div>

                        <div>
                          <Label>Notes</Label>
                          <Textarea
                            rows={2}
                            value={form.notes}
                            onChange={(e) =>
                              setForm({ ...form, notes: e.target.value })
                            }
                            placeholder="Catatan internal (opsional)"
                          />
                        </div>
                      </div>
                    </div>

                    {/* FOOTER (fixed) */}
                    <DialogFooter className="px-5 py-3 border-t bg-background">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAddOpen(false);
                          setEditTarget(null);
                          resetForm();
                        }}
                      >
                        Cancel
                      </Button>
                      {editTarget ? (
                        <Button
                          onClick={handleSaveEdit}
                          className="bg-gradient-to-r from-primary to-secondary text-white"
                        >
                          Save Changes
                        </Button>
                      ) : (
                        <Button
                          onClick={handleCreate}
                          className="bg-gradient-to-r from-primary to-secondary text-white"
                        >
                          Save Add-on
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 p-6 overflow-auto">
            {loadingAddons ? (
              <div className="bg-card/50 rounded-xl border border-primary/20 overflow-hidden p-6">
                <div className="h-5 w-40 bg-muted animate-pulse mb-4 rounded" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 w-full bg-muted/50 animate-pulse rounded mb-2"
                  />
                ))}
              </div>
            ) : filteredAddons.length > 0 ? (
              <div className="bg-card/50 rounded-xl border border-primary/20 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-primary/20 hover:bg-primary/5">
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Code</TableHead>
                      <TableHead className="font-semibold">Kind</TableHead>
                      <TableHead className="font-semibold">Pricing</TableHead>
                      <TableHead className="font-semibold">
                        Unit Price
                      </TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAddons.map((a) => (
                      <TableRow
                        key={a.id}
                        className="border-primary/10 hover:bg-primary/5 transition-colors"
                      >
                        <TableCell>
                          <div className="font-medium">{a.name}</div>
                          {a.description && (
                            <div className="text-sm text-muted-foreground">
                              {a.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {a.addon_code}
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {a.kind}
                        </TableCell>
                        <TableCell className="text-sm">
                          {a.pricing_mode === "per_unit_per_cycle"
                            ? "Per Unit/Cycle"
                            : "One-time"}
                          {a.kind === "quantity" && (
                            <div className="text-xs text-muted-foreground">
                              {a.unit_label || "unit"} — min {a.min_qty ?? 0},
                              step {a.step_qty ?? 1}
                              {a.max_qty ? `, max ${a.max_qty}` : ""}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-semibold">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: a.currency || "IDR",
                            maximumFractionDigits: 0,
                          }).format(a.unit_price || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              a.status === "active"
                                ? "bg-green-500/20 text-green-700"
                                : "bg-gray-500/20 text-gray-700"
                            }
                          >
                            {a.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                              onClick={() => openEdit(a)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                              onClick={() => handleQuickToggle(a)}
                            >
                              {a.status === "active" ? "⏸" : "▶"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-500"
                              onClick={() => handleDelete(a)}
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
                <h3 className="text-lg font-semibold mb-2">No add-ons yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                  Add your first add-on for{" "}
                  {selectedProduct?.product_name ?? "this product"}.
                </p>
                <Button
                  onClick={() => setAddOpen(true)}
                  className="bg-gradient-to-r from-primary to-secondary text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Add-on
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden flex flex-col w-full">
        <div className="p-4 border-b border-border bg-card/50">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">Master Add-ons</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileDrawerOpen(true)}
            >
              <Menu className="h-4 w-4 mr-2" />
              {selectedProduct?.product_name ?? "-"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedProduct?.description ?? ""}
          </p>
        </div>

        <div className="flex-1 p-4 overflow-auto">
          <div className="space-y-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search add-ons..."
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
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setAddOpen(true)}
                className="bg-gradient-to-r from-primary to-secondary text-white"
                disabled={!selectedProduct}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Cards */}
          {loadingAddons ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card/50 rounded-lg border border-primary/20 p-4 animate-pulse h-28"
                />
              ))}
            </div>
          ) : filteredAddons.length > 0 ? (
            <div className="space-y-3">
              {filteredAddons.map((a) => (
                <div
                  key={a.id}
                  className="bg-card/50 rounded-lg border border-primary/20 p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">{a.name}</h3>
                    <Badge
                      className={
                        a.status === "active"
                          ? "bg-green-500/20 text-green-700"
                          : "bg-gray-500/20 text-gray-700"
                      }
                    >
                      {a.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {a.description}
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">
                    {a.kind.toUpperCase()} •{" "}
                    {a.pricing_mode === "per_unit_per_cycle"
                      ? "Per Unit/Cycle"
                      : "One-time"}{" "}
                    • {a.currency} {a.unit_price.toLocaleString("id-ID")}
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(a)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuickToggle(a)}
                    >
                      {a.status === "active" ? "⏸" : "▶"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => handleDelete(a)}
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
              <h3 className="font-semibold mb-2">No add-ons yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first add-on.
              </p>
              <Button
                onClick={() => setAddOpen(true)}
                disabled={!selectedProduct}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Add-on
              </Button>
            </div>
          )}
        </div>

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

/* utils */
function guessIcon(code?: string, name?: string) {
  const key = String(code ?? name ?? "").toLowerCase();
  if (key.includes("rentvix")) return PackageIcon;
  if (key.includes("absen")) return Zap;
  return PackageIcon;
}
function exportCsv(addons: AddonItem[], productCode?: string) {
  if (!addons || addons.length === 0) return;
  const headers = [
    "id",
    "product_code",
    "addon_code",
    "name",
    "kind",
    "pricing_mode",
    "unit_label",
    "min_qty",
    "step_qty",
    "max_qty",
    "currency",
    "unit_price",
    "status",
    "order_number",
    "notes",
    "description",
  ];
  const rows = addons.map((a) => [
    a.id,
    a.product_code,
    a.addon_code,
    csvSafe(a.name),
    a.kind,
    a.pricing_mode,
    a.unit_label ?? "",
    a.min_qty ?? "",
    a.step_qty ?? "",
    a.max_qty ?? "",
    a.currency,
    a.unit_price,
    a.status,
    a.order_number ?? "",
    csvSafe(a.notes ?? ""),
    csvSafe(a.description ?? ""),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `addons_${productCode ?? "product"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
function csvSafe(s: string) {
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}
