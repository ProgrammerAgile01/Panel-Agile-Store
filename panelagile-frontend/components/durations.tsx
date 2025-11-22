"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Download,
  Edit,
  Archive,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  Clock,
  RotateCcw,
} from "lucide-react";

// === API ===
import {
  fetchDurations as apiFetchDurations,
  createDuration as apiCreateDuration,
  updateDuration as apiUpdateDuration,
  deleteDuration as apiDeleteDuration,
  type DurationPayload,
} from "@/lib/api";

interface Duration {
  id: string;
  name: string;
  length: number;
  unit: "day" | "week" | "month" | "year";
  code?: string;
  is_default: boolean;
  status: "active" | "archived";
  updated_at: string;
  notes?: string;
  addon_discount_percent?: number;
}

export function Durations() {
  const [durations, setDurations] = useState<Duration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "archived"
  >("all");
  const [sortBy, setSortBy] = useState("length_asc");
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDuration, setEditingDuration] = useState<Duration | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    length: 1,
    unit: "month" as Duration["unit"],
    code: "",
    status: "active" as Duration["status"],
    is_default: false,
    notes: "",
    addon_discount_percent: 0,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // === Helpers ===
  const loadDurations = async () => {
    try {
      setLoading(true);
      const res = await apiFetchDurations();
      const rows = (res?.data ?? []) as any[];
      const mapped: Duration[] = rows.map((r) => ({
        id: String(r.id),
        name: r.name,
        length: Number(r.length),
        unit: r.unit,
        code: r.code ?? "",
        is_default: !!r.is_default,
        status: r.status,
        updated_at: r.updated_at ?? new Date().toISOString(),
        notes: r.notes ?? "",
        addon_discount_percent:
          typeof r.addon_discount_percent === "number"
            ? r.addon_discount_percent
            : 0,
      }));
      setDurations(mapped);
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Failed to load durations",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Debounced search (placeholder to keep behavior)
  useEffect(() => {
    const timer = setTimeout(() => {}, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial fetch
  useEffect(() => {
    loadDurations();
  }, []);

  const filteredDurations = useMemo(() => {
    const filtered = durations.filter((duration) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        duration.name.toLowerCase().includes(q) ||
        duration.code?.toLowerCase().includes(q) ||
        "";
      const matchesStatus =
        statusFilter === "all" || duration.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "length_asc":
          return a.length - b.length;
        case "length_desc":
          return b.length - a.length;
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "updated_newest":
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [durations, searchQuery, statusFilter, sortBy]);

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else {
      const existingDuration = durations.find(
        (d) =>
          d.name.toLowerCase() === formData.name.toLowerCase() &&
          d.id !== editingDuration?.id
      );
      if (existingDuration) {
        errors.name = "Duration name must be unique";
      }
    }

    if (formData.length < 1) {
      errors.length = "Length must be at least 1";
    }

    if (formData.code && formData.code.trim()) {
      const codeRegex = /^[A-Z0-9_-]+$/i;
      if (!codeRegex.test(formData.code)) {
        errors.code =
          "Code can only contain letters, numbers, hyphens, and underscores";
      } else {
        const existingCode = durations.find(
          (d) =>
            d.code?.toLowerCase() === formData.code.toLowerCase() &&
            d.id !== editingDuration?.id
        );
        if (existingCode) {
          errors.code = "Code must be unique";
        }
      }
    }

    if (
      formData.addon_discount_percent != null &&
      (formData.addon_discount_percent < 0 ||
        formData.addon_discount_percent > 100)
    ) {
      errors.addon_discount_percent =
        "Addon discount must be between 0 and 100";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      length: 1,
      unit: "month",
      code: "",
      status: "active",
      is_default: false,
      notes: "",
      addon_discount_percent: 0,
    });
    setFormErrors({});
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const payload: DurationPayload = {
      name: formData.name.trim(),
      length: formData.length,
      unit: formData.unit,
      code: formData.code?.trim() || undefined,
      status: formData.status,
      is_default: !!formData.is_default,
      notes: formData.notes?.trim() || undefined,
      addon_discount_percent:
        formData.addon_discount_percent != null
          ? formData.addon_discount_percent
          : 0,
    };

    try {
      if (editingDuration) {
        await apiUpdateDuration(editingDuration.id, payload);
        toast({ title: "Duration updated successfully" });
        setIsEditModalOpen(false);
      } else {
        await apiCreateDuration(payload);
        toast({ title: "Duration created successfully" });
        setIsAddModalOpen(false);
      }
      resetForm();
      setEditingDuration(null);
      await loadDurations();
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Failed to save duration",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (duration: Duration) => {
    setEditingDuration(duration);
    setFormData({
      name: duration.name,
      length: duration.length,
      unit: duration.unit,
      code: duration.code || "",
      status: duration.status,
      is_default: duration.is_default,
      notes: duration.notes || "",
      addon_discount_percent: duration.addon_discount_percent ?? 0,
    });
    setIsEditModalOpen(true);
  };

  const handleArchiveToggle = async (id: string) => {
    const duration = durations.find((d) => d.id === id);
    if (!duration) return;
    const nextStatus: "active" | "archived" =
      duration.status === "active" ? "archived" : "active";

    try {
      await apiUpdateDuration(id, {
        name: duration.name,
        length: duration.length,
        unit: duration.unit,
        code: duration.code || undefined,
        status: nextStatus,
        is_default: duration.is_default && nextStatus === "active", // jangan hilang default saat restore
        notes: duration.notes || undefined,
      });
      toast({
        title: `Duration ${
          nextStatus === "archived" ? "archived" : "restored"
        } successfully`,
      });
      await loadDurations();
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Failed to update status",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (durations.filter((d) => d.status === "active").length <= 1) {
      toast({
        title: "Cannot delete duration",
        description: "At least one active duration must remain",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiDeleteDuration(id);
      toast({ title: "Duration deleted successfully" });
      setDeleteConfirm(null);
      await loadDurations();
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Failed to delete duration",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleBulkAction = async (action: "archive" | "restore" | "delete") => {
    if (action === "delete") {
      const remainingActive = durations.filter(
        (d) => d.status === "active" && !selectedDurations.includes(d.id)
      ).length;
      if (remainingActive < 1) {
        toast({
          title: "Cannot delete durations",
          description: "At least one active duration must remain",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      if (action === "delete") {
        await Promise.all(selectedDurations.map((id) => apiDeleteDuration(id)));
      } else {
        await Promise.all(
          selectedDurations.map((id) => {
            const d = durations.find((x) => x.id === id)!;
            return apiUpdateDuration(id, {
              name: d.name,
              length: d.length,
              unit: d.unit,
              code: d.code || undefined,
              status: action === "archive" ? "archived" : "active",
              is_default: d.is_default && action !== "archive",
              notes: d.notes || undefined,
            });
          })
        );
      }

      const actionText =
        action === "delete"
          ? "deleted"
          : action === "archive"
          ? "archived"
          : "restored";
      toast({
        title: `${selectedDurations.length} duration(s) ${actionText} successfully`,
      });
      setSelectedDurations([]);
      await loadDurations();
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Bulk action failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    }
  };

  const exportCSV = () => {
    const headers = [
      "Name",
      "Length",
      "Unit",
      "Code",
      "Status",
      "Default",
      "Updated",
    ];
    const rows = filteredDurations.map((d) => [
      d.name,
      d.length.toString(),
      d.unit,
      d.code || "",
      d.status,
      d.is_default ? "Yes" : "No",
      new Date(d.updated_at).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "durations.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===== UI =====
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Durations</h1>
        <p className="text-muted-foreground">
          Manage subscription durations for all products
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search durations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value: any) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                Sort <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy("length_asc")}>
                By Length (Low to High)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("length_desc")}>
                By Length (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name_asc")}>
                By Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("name_desc")}>
                By Name (Z-A)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("updated_newest")}>
                Updated (Newest)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-2">
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={resetForm}>
                <Plus className="h-4 w-4" />
                Add Duration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Duration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., 1 Bulan, 6 Bulan"
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="length">Length *</Label>
                    <Input
                      id="length"
                      type="number"
                      min="1"
                      value={formData.length}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          length: Number.parseInt(e.target.value) || 1,
                        }))
                      }
                    />
                    {formErrors.length && (
                      <p className="text-sm text-red-500 mt-1">
                        {formErrors.length}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit *</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value: any) =>
                        setFormData((prev) => ({ ...prev, unit: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="code">Alias/Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, code: e.target.value }))
                    }
                    placeholder="e.g., M1, M6, Y1"
                  />
                  {formErrors.code && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.code}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_default: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="is_default">Set as Default</Label>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Optional notes..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="addon-discount">Addon Discount (%)</Label>
                  <Input
                    id="addon-discount"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.addon_discount_percent}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        addon_discount_percent: Number.isNaN(
                          parseInt(e.target.value)
                        )
                          ? 0
                          : parseInt(e.target.value),
                      }))
                    }
                    placeholder="e.g., 0 for M1, 30 for M6, 40 for M12"
                  />
                  {formErrors.addon_discount_percent && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.addon_discount_percent}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} className="flex-1">
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDurations.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedDurations.length} selected
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkAction("archive")}
          >
            <Archive className="h-4 w-4 mr-1" />
            Archive
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkAction("restore")}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Restore
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleBulkAction("delete")}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      )}

      {/* ======= LIST RENDERING ======= */}
      {filteredDurations.length > 0 ? (
        <>
          {/* Desktop/Tablet: TABLE */}
          <div className="border rounded-lg overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="w-12 p-3">
                      <Checkbox
                        checked={
                          selectedDurations.length ===
                            filteredDurations.length &&
                          filteredDurations.length > 0
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDurations(
                              filteredDurations.map((d) => d.id)
                            );
                          } else {
                            setSelectedDurations([]);
                          }
                        }}
                      />
                    </th>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Length</th>
                    <th className="text-left p-3 font-medium">Code</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Default</th>
                    <th className="text-left p-3 font-medium">
                      Diskon Addon (%)
                    </th>
                    <th className="text-left p-3 font-medium">Updated</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDurations.map((duration) => (
                    <tr
                      key={duration.id}
                      className="border-t hover:bg-muted/30"
                    >
                      <td className="p-3">
                        <Checkbox
                          checked={selectedDurations.includes(duration.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDurations((prev) => [
                                ...prev,
                                duration.id,
                              ]);
                            } else {
                              setSelectedDurations((prev) =>
                                prev.filter((id) => id !== duration.id)
                              );
                            }
                          }}
                        />
                      </td>
                      <td className="p-3 font-medium">{duration.name}</td>
                      <td className="p-3">
                        {duration.length} {duration.unit}
                        {duration.length > 1 ? "s" : ""}
                      </td>
                      <td className="p-3">
                        {duration.code && (
                          <Badge variant="outline" className="text-xs">
                            {duration.code}
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            duration.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {duration.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {duration.is_default && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-primary/10 text-primary"
                          >
                            Default
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        {duration.addon_discount_percent ?? 0}%
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {getRelativeTime(duration.updated_at)}
                      </td>
                      <td className="p-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEdit(duration)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleArchiveToggle(duration.id)}
                            >
                              {duration.status === "active" ? (
                                <>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Restore
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setDeleteConfirm({
                                  id: duration.id,
                                  name: duration.name,
                                })
                              }
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: CARD LIST */}
          <div className="md:hidden space-y-3">
            {/* Select all (mobile) */}
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                checked={
                  selectedDurations.length === filteredDurations.length &&
                  filteredDurations.length > 0
                }
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedDurations(filteredDurations.map((d) => d.id));
                  } else {
                    setSelectedDurations([]);
                  }
                }}
              />
              <span className="text-sm text-muted-foreground">Select all</span>
            </div>

            {filteredDurations.map((d) => (
              <div
                key={d.id}
                className="border rounded-lg p-4 bg-card/50 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: main info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedDurations.includes(d.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDurations((prev) => [...prev, d.id]);
                          } else {
                            setSelectedDurations((prev) =>
                              prev.filter((id) => id !== d.id)
                            );
                          }
                        }}
                        aria-label={`select ${d.name}`}
                      />
                      <div className="font-semibold break-words">{d.name}</div>
                    </div>

                    <div className="mt-1 text-sm">
                      {d.length} {d.unit}
                      {d.length > 1 ? "s" : ""}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {d.code ? (
                        <Badge variant="outline" className="text-xs">
                          {d.code}
                        </Badge>
                      ) : null}
                      <Badge
                        variant={
                          d.status === "active" ? "default" : "secondary"
                        }
                      >
                        {d.status}
                      </Badge>
                      {d.is_default ? (
                        <Badge
                          variant="outline"
                          className="text-xs bg-primary/10 text-primary"
                        >
                          Default
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getRelativeTime(d.updated_at)}
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(d)}
                      className="h-8"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleArchiveToggle(d.id)}
                      className="h-8"
                    >
                      {d.status === "active" ? (
                        <>
                          <Archive className="h-4 w-4 mr-1" />
                          Archive
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        setDeleteConfirm({ id: d.id, name: d.name })
                      }
                      className="h-8"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="border rounded-lg p-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No durations yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first subscription duration to get started.
          </p>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Duration
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Duration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., 1 Bulan, 6 Bulan"
              />
              {formErrors.name && (
                <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-length">Length *</Label>
                <Input
                  id="edit-length"
                  type="number"
                  min="1"
                  value={formData.length}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      length: Number.parseInt(e.target.value) || 1,
                    }))
                  }
                />
                {formErrors.length && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.length}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-unit">Unit *</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({ ...prev, unit: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-code">Alias/Code</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="e.g., M1, M6, Y1"
              />
              {formErrors.code && (
                <p className="text-sm text-red-500 mt-1">{formErrors.code}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_default: !!checked }))
                }
              />
              <Label htmlFor="edit-is_default">Set as Default</Label>
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Optional notes..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="addon-discount">Addon Discount (%)</Label>
              <Input
                id="addon-discount"
                type="number"
                min={0}
                max={100}
                value={formData.addon_discount_percent}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    addon_discount_percent: Number.isNaN(
                      parseInt(e.target.value)
                    )
                      ? 0
                      : parseInt(e.target.value),
                  }))
                }
                placeholder="e.g., 0 for M1, 30 for M6, 40 for M12"
              />
              {formErrors.addon_discount_percent && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.addon_discount_percent}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1">
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Duration</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{deleteConfirm?.name}" and related
              price mappings that only reference it. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
