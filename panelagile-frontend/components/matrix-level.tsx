"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Save,
  Shield,
  Grid3X3,
  AlertCircle,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";

/* ===== Types sinkron dengan backend ===== */
interface Level {
  id: number | string;
  name: string;
  description?: string;
  status: "Active" | "Inactive" | string;
  default_homepage?: string;
}
interface NavItem {
  id: number | string;
  group: string;
  name: string;
  path: string;
  description?: string;
  order_number?: number;
}
interface PermissionFlags {
  access: boolean;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  print: boolean;
}
interface LevelPermissionRow {
  nav_item: {
    id: number | string;
    group: string;
    name: string;
    path: string;
    description?: string;
    order_number?: number;
  };
  permission: {
    level_id: number | string;
    nav_item_id: number | string;
  } & PermissionFlags;
}

/* ===== API Helpers (gunakan api.ts yang sudah kamu punya) ===== */
import {
  fetchLevels,
  fetchNavItems,
  fetchLevelPermissions,
  saveLevelPermissions,
} from "@/lib/api"; // sesuaikan path jika berbeda

export function MatrixLevel() {
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [groupByModule, setGroupByModule] = useState(true);
  const [showOnlyGranted, setShowOnlyGranted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [levels, setLevels] = useState<Level[]>([]);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  // permissions[levelId][navItemId] = PermissionFlags
  const [permissions, setPermissions] = useState<
    Record<string | number, Record<string | number, PermissionFlags>>
  >({});

  /* 1) Load master (levels & nav-items) */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [lvls, navs] = await Promise.all([
          fetchLevels(),
          fetchNavItems(),
        ]);
        if (cancelled) return;
        setLevels(lvls as Level[]);
        setNavItems(navs as NavItem[]);
        if ((lvls as Level[])?.length && !selectedLevel)
          setSelectedLevel((lvls as Level[])[0]);
      } catch (e: any) {
        toast.error(e?.message || "Gagal memuat data awal");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* 2) Load permissions saat level berubah */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedLevel) return;
      try {
        const data = (await fetchLevelPermissions(
          selectedLevel.id
        )) as LevelPermissionRow[];

        const ensure = (pf?: Partial<PermissionFlags>): PermissionFlags => ({
          access: !!pf?.access,
          view: !!pf?.view,
          add: !!pf?.add,
          edit: !!pf?.edit,
          delete: !!pf?.delete,
          approve: !!pf?.approve,
          print: !!pf?.print,
        });

        const map: Record<string | number, PermissionFlags> = {};
        navItems.forEach((ni) => {
          map[ni.id] = ensure();
        }); // default false semua
        data.forEach((row) => {
          map[row.nav_item.id] = ensure(row.permission);
        }); // override yang ada

        if (!cancelled) {
          setPermissions((prev) => ({ ...prev, [selectedLevel.id]: map }));
          setHasChanges(false);
        }
      } catch (e: any) {
        toast.error(e?.message || "Gagal memuat permission");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel, navItems.length]);

  /* 3) Filter + Group */
  const filteredNavItems = useMemo(() => {
    const q = (searchQuery || "").toLowerCase().trim();
    return navItems.filter((ni) => {
      const match =
        !q ||
        ni.name.toLowerCase().includes(q) ||
        ni.group.toLowerCase().includes(q) ||
        ni.path.toLowerCase().includes(q) ||
        (ni.description || "").toLowerCase().includes(q);
      if (!match) return false;
      if (showOnlyGranted && selectedLevel) {
        const perm = permissions[selectedLevel.id]?.[ni.id];
        return (
          !!perm?.access ||
          !!perm?.view ||
          !!perm?.add ||
          !!perm?.edit ||
          !!perm?.delete ||
          !!perm?.approve ||
          !!perm?.print
        );
      }
      return true;
    });
  }, [navItems, searchQuery, showOnlyGranted, permissions, selectedLevel]);

  const groupedData = useMemo(() => {
    const acc: Record<string, NavItem[]> = {};
    filteredNavItems.forEach((item) => {
      const key = item.group || "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
    });
    return acc;
  }, [filteredNavItems]);

  /* 4) Update permission state */
  const updatePermission = (
    itemId: number | string,
    field: keyof PermissionFlags,
    value: boolean
  ) => {
    if (!selectedLevel) return;
    setPermissions((prev) => {
      const newPermissions = { ...prev };
      const levelPerms = { ...(newPermissions[selectedLevel.id] || {}) };
      const current = levelPerms[itemId] || {
        access: false,
        view: false,
        add: false,
        edit: false,
        delete: false,
        approve: false,
        print: false,
      };
      let next: PermissionFlags = { ...current, [field]: value };
      if (field === "access" && !value) {
        // jika access dimatikan, flag lain ikut off (konsisten dgn backend)
        next = {
          access: false,
          view: false,
          add: false,
          edit: false,
          delete: false,
          approve: false,
          print: false,
        };
      }
      levelPerms[itemId] = next;
      newPermissions[selectedLevel.id] = levelPerms;
      return newPermissions;
    });
    setHasChanges(true);
  };

  /* 5) Save bulk */
  const handleSave = async () => {
    if (!selectedLevel) return;
    setIsLoading(true);
    try {
      const levelId = selectedLevel.id;
      const levelPerms = permissions[levelId] || {};
      const payload = Object.entries(levelPerms).map(([navItemId, flags]) => ({
        nav_item_id: Number(navItemId),
        access: !!flags.access,
        view: !!flags.view,
        add: !!flags.add,
        edit: !!flags.edit,
        delete: !!flags.delete,
        approve: !!flags.approve,
        print: !!flags.print,
      }));
      await saveLevelPermissions(levelId, payload);
      setHasChanges(false);
      toast.success("Access matrix updated");
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan permissions");
    } finally {
      setIsLoading(false);
    }
  };

  /* 6) Export CSV (opsional, sesuai screenshot) */
  const handleExport = () => {
    if (!selectedLevel) return;
    const levelId = selectedLevel.id;
    const levelPerms = permissions[levelId] || {};
    const rows = navItems.map((ni) => {
      const p = levelPerms[ni.id] || {
        access: false,
        view: false,
        add: false,
        edit: false,
        delete: false,
        approve: false,
        print: false,
      };
      return {
        group: ni.group,
        name: ni.name,
        path: ni.path,
        access: p.access ? 1 : 0,
        view: p.view ? 1 : 0,
        add: p.add ? 1 : 0,
        edit: p.edit ? 1 : 0,
        delete: p.delete ? 1 : 0,
        approve: p.approve ? 1 : 0,
        print: p.print ? 1 : 0,
      };
    });
    const header = [
      "Group",
      "Name",
      "Path",
      "Access",
      "View",
      "Add",
      "Edit",
      "Delete",
      "Approve",
      "Print",
    ];
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        [
          `"${r.group.replace(/"/g, '""')}"`,
          `"${r.name.replace(/"/g, '""')}"`,
          `"${r.path.replace(/"/g, '""')}"`,
          r.access,
          r.view,
          r.add,
          r.edit,
          r.delete,
          r.approve,
          r.print,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `permissions_${String(selectedLevel.name || levelId).replace(
      /\s+/g,
      "_"
    )}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      {/* LEFT: Levels */}
      <div className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-xl border border-slate-700/50 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-200">User Levels</h3>
        </div>

        <div className="space-y-2">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                selectedLevel?.id === level.id
                  ? "bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 shadow-lg shadow-purple-500/10"
                  : "hover:bg-slate-700/50 border border-transparent"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  selectedLevel?.id === level.id
                    ? "bg-gradient-to-br from-purple-500 to-indigo-600"
                    : "bg-slate-700"
                }`}
              >
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-slate-200 truncate">
                  {level.name || "(Unnamed Level)"}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {level.description || ""}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Matrix */}
      <div className="flex-1 bg-card rounded-xl border border-primary/20 shadow-lg">
        {selectedLevel ? (
          <>
            <div className="p-6 border-b border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Access Matrix for {selectedLevel.name}
                  </h2>
                  <p className="text-muted-foreground">
                    Configure menu access permissions for this level
                  </p>
                </div>
                {hasChanges && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                  >
                    Unsaved Changes
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      className="switch-contrast"
                      checked={groupByModule}
                      onCheckedChange={setGroupByModule}
                    />
                    <span className="text-sm">Group by Module</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      className="switch-contrast"
                      checked={showOnlyGranted}
                      onCheckedChange={setShowOnlyGranted}
                    />
                    <span className="text-sm">Show only granted</span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search menu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 bg-background/50 border-primary/20"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleExport}
                    className="border-primary/30"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>

                  <Button
                    onClick={handleSave}
                    disabled={!hasChanges || isLoading}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
              {navItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium text-lg mb-2">
                    No menu data loaded
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Menu data will be loaded automatically.
                  </p>
                </div>
              ) : (
                <div className="w-full">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 sticky-bg-card">
                      <TableRow className="border-primary/20">
                        <TableHead className="sticky left-0 z-20 w-1/2 font-semibold sticky-bg-card">
                          Menu
                        </TableHead>
                        <TableHead className="text-center font-semibold w-24">
                          Access
                        </TableHead>
                        <TableHead className="text-center font-semibold w-16">
                          View
                        </TableHead>
                        <TableHead className="text-center font-semibold w-16">
                          Add
                        </TableHead>
                        <TableHead className="text-center font-semibold w-16">
                          Edit
                        </TableHead>
                        <TableHead className="text-center font-semibold w-16">
                          Delete
                        </TableHead>
                        <TableHead className="text-center font-semibold w-16">
                          Approve
                        </TableHead>
                        <TableHead className="text-center font-semibold w-16">
                          Print
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(groupedData).map(([group, items]) => (
                        <React.Fragment key={group}>
                          {groupByModule && group !== "All Items" && (
                            <TableRow className="sticky-bg-muted">
                              <TableCell
                                colSpan={8}
                                className="sticky left-0 z-10 font-semibold text-muted-foreground py-2 sticky-bg-muted"
                              >
                                <div className="flex items-center gap-2">
                                  <Grid3X3 className="h-4 w-4" />
                                  {group}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          {items.map((item) => {
                            const permission = (selectedLevel &&
                              permissions[selectedLevel.id]?.[item.id]) || {
                              access: false,
                              view: false,
                              add: false,
                              edit: false,
                              delete: false,
                              approve: false,
                              print: false,
                            };

                            return (
                              <TableRow
                                key={item.id}
                                className="border-primary/10 hover:bg-primary/5"
                              >
                                <TableCell className="sticky left-0 z-10 py-3 sticky-bg-card">
                                  <div className="flex items-start gap-3">
                                    <Badge
                                      variant="default"
                                      className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs"
                                    >
                                      Menu
                                    </Badge>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate">
                                        {item.name}
                                      </div>
                                      <div className="text-sm text-muted-foreground truncate">
                                        {item.path}
                                      </div>
                                      {item.description && (
                                        <div className="text-xs text-muted-foreground mt-1 truncate">
                                          {item.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Access = Switch */}
                                <TableCell className="text-center py-3">
                                  <Switch
                                    className="switch-contrast"
                                    checked={permission.access}
                                    onCheckedChange={(checked) =>
                                      updatePermission(
                                        item.id,
                                        "access",
                                        checked
                                      )
                                    }
                                    aria-label={`toggle access ${item.name}`}
                                  />
                                </TableCell>

                                {/* Lainnya = Checkbox */}
                                <TableCell className="text-center py-3">
                                  <Checkbox
                                    className="checkbox-contrast"
                                    checked={permission.view}
                                    onCheckedChange={(checked) =>
                                      updatePermission(
                                        item.id,
                                        "view",
                                        !!checked
                                      )
                                    }
                                    disabled={!permission.access}
                                    aria-label={`allow view ${item.name}`}
                                  />
                                </TableCell>
                                <TableCell className="text-center py-3">
                                  <Checkbox
                                    className="checkbox-contrast"
                                    checked={permission.add}
                                    onCheckedChange={(checked) =>
                                      updatePermission(
                                        item.id,
                                        "add",
                                        !!checked
                                      )
                                    }
                                    disabled={!permission.access}
                                    aria-label={`allow add ${item.name}`}
                                  />
                                </TableCell>
                                <TableCell className="text-center py-3">
                                  <Checkbox
                                    className="checkbox-contrast"
                                    checked={permission.edit}
                                    onCheckedChange={(checked) =>
                                      updatePermission(
                                        item.id,
                                        "edit",
                                        !!checked
                                      )
                                    }
                                    disabled={!permission.access}
                                    aria-label={`allow edit ${item.name}`}
                                  />
                                </TableCell>
                                <TableCell className="text-center py-3">
                                  <Checkbox
                                    className="checkbox-contrast"
                                    checked={permission.delete}
                                    onCheckedChange={(checked) =>
                                      updatePermission(
                                        item.id,
                                        "delete",
                                        !!checked
                                      )
                                    }
                                    disabled={!permission.access}
                                    aria-label={`allow delete ${item.name}`}
                                  />
                                </TableCell>
                                <TableCell className="text-center py-3">
                                  <Checkbox
                                    className="checkbox-contrast"
                                    checked={permission.approve}
                                    onCheckedChange={(checked) =>
                                      updatePermission(
                                        item.id,
                                        "approve",
                                        !!checked
                                      )
                                    }
                                    disabled={!permission.access}
                                    aria-label={`allow approve ${item.name}`}
                                  />
                                </TableCell>
                                <TableCell className="text-center py-3">
                                  <Checkbox
                                    className="checkbox-contrast"
                                    checked={permission.print}
                                    onCheckedChange={(checked) =>
                                      updatePermission(
                                        item.id,
                                        "print",
                                        !!checked
                                      )
                                    }
                                    disabled={!permission.access}
                                    aria-label={`allow print ${item.name}`}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <Shield className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-xl mb-2">Select a Level</h3>
            <p className="text-muted-foreground text-center">
              Choose a user level from the left panel to configure access
              permissions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
