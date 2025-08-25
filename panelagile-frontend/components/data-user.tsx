"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  RotateCcw,
  UserX,
  Users,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { fetchData, createData, updateData } from "@/lib/api";

interface User {
  id: number | string;
  name: string;
  email: string;
  levels: string[];
  status: "Active" | "Invited" | "Suspended";
  lastLogin: string;
  notes?: string;
}

export function DataUser() {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [lastActiveFilter, setLastActiveFilter] = useState("Any");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // sudah termasuk field password (optional)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    levels: [] as string[],
    status: "Invited" as "Active" | "Invited" | "Suspended",
    sendInvitation: true,
    notes: "",
    password: "",
    password_confirmation: "",
  });

  // levels dari API (fallback default jika gagal)
  const [availableLevels, setAvailableLevels] = useState<string[]>([
    "Admin",
    "Marketing",
    "Support",
    "Finance",
  ]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadUsers();
    loadLevels();
  }, []);

  async function loadLevels() {
    try {
      const res = await fetchData("level_users");
      const lvls = (res || [])
        .map((r: any) => r.name ?? r.nama_level)
        .filter(Boolean);
      if (lvls?.length) setAvailableLevels(lvls);
    } catch {
      /* keep default */
    }
  }

  async function loadUsers() {
    try {
      const res = await fetchData("user_managements");
      const mapped: User[] = (res || []).map((u: any) => ({
        id: u.id,
        name: u.nama,
        email: u.email,
        levels: Array.isArray(u.levels) ? u.levels : [],
        status: (u.status ?? "Invited") as User["status"],
        lastLogin: u.last_login ?? "Never",
        notes: u.notes ?? "",
      }));
      setUsers(mapped);
    } catch (e: any) {
      toast.error(`Gagal memuat user: ${e?.message || ""}`);
    }
  }

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q);
    const matchesLevel =
      levelFilter.length === 0 ||
      user.levels.some((level) => levelFilter.includes(level));
    const matchesStatus =
      statusFilter === "All Status" || user.status === (statusFilter as any);
    const matchesLastActive =
      lastActiveFilter === "Any" ||
      (lastActiveFilter === "7d" && user.lastLogin !== "Never") ||
      (lastActiveFilter === "30d" && user.lastLogin !== "Never");
    return matchesSearch && matchesLevel && matchesStatus && matchesLastActive;
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      levels: [],
      status: "Invited",
      sendInvitation: true,
      notes: "",
      password: "",
      password_confirmation: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      formData.levels.length === 0
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // ✅ Validasi password jika salah satu field diisi
    if (formData.password || formData.password_confirmation) {
      if (formData.password.length < 8) {
        toast.error("Password minimal 8 karakter");
        return;
      }
      if (formData.password !== formData.password_confirmation) {
        toast.error("Konfirmasi password tidak sama");
        return;
      }
    }

    // Payload yang dimengerti backend
    const payload: any = {
      nama: formData.name,
      email: formData.email,
      status: formData.status,
      levels: formData.levels, // → levels_json
      role_name: formData.levels[0] || null, // → FK role
      notes: formData.notes || "",
    };

    // Sertakan password bila diisi (opsional)
    if (formData.password) {
      payload.password = formData.password;
      payload.password_confirmation =
        formData.password_confirmation || formData.password;
    }

    try {
      if (editingUser) {
        await updateData("user_managements", editingUser.id, payload);
        toast.success("User updated successfully");
      } else {
        await createData("user_managements", payload);
        toast.success(
          formData.sendInvitation
            ? "Invitation sent successfully"
            : "User added successfully"
        );
      }
      resetForm();
      setIsInviteModalOpen(false);
      setEditingUser(null);
      loadUsers();
    } catch (e: any) {
      toast.error(`Gagal simpan: ${e?.message || ""}`);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      levels: user.levels,
      status: user.status,
      sendInvitation: false,
      notes: user.notes || "",
      password: "",
      password_confirmation: "",
    });
    setIsInviteModalOpen(true);
  };

  const handleResetPassword = (user: User) => {
    if (confirm(`Reset password for ${user.name}?`)) {
      // (opsional) panggil endpoint khusus jika dibuat
      toast.success("Password reset email sent");
    }
  };

  const handleSuspend = async (user: User) => {
    const action = user.status === "Suspended" ? "activate" : "suspend";
    if (
      confirm(
        `${action.charAt(0).toUpperCase() + action.slice(1)} ${user.name}?`
      )
    ) {
      const newStatus: User["status"] =
        user.status === "Suspended" ? "Active" : "Suspended";
      try {
        await updateData("user_managements", user.id, {
          nama: user.name,
          email: user.email,
          status: newStatus,
          levels: user.levels,
          role_name: user.levels[0] || null,
          notes: user.notes || "",
        });
        toast.success(`User ${action}d successfully`);
        loadUsers();
      } catch (e: any) {
        toast.error(`Gagal update status: ${e?.message || ""}`);
      }
    }
  };

  const exportCSV = () => {
    const csvContent = [
      ["Name", "Email", "Levels", "Status", "Last Login"],
      ...filteredUsers.map((u) => [
        u.name,
        u.email,
        u.levels.join("; "),
        u.status,
        u.lastLogin,
      ]),
    ]
      .map((r) => r.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Data User
          </h1>
          <p className="text-muted-foreground">
            Manage user accounts and level assignments
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-primary/20 shadow-lg">
        <div className="p-6 border-b border-primary/20">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search user name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-primary/20 focus:border-primary/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={exportCSV}
                className="border-primary/20 hover:bg-primary/10 bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Dialog
                open={isInviteModalOpen}
                onOpenChange={setIsInviteModalOpen}
              >
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Invite User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-0 shadow-2xl">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-t-lg" />
                  <DialogHeader className="pb-4">
                    <DialogTitle className="text-xl font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                      {editingUser ? "✏️" : "👤"}{" "}
                      {editingUser ? "Edit User" : "Invite New User"}
                    </DialogTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {editingUser
                        ? "Update user information and permissions"
                        : "Send an invitation to join the platform"}
                    </p>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name + Email */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="name"
                          className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="John Doe"
                          className="border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:ring-purple-500/20"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          placeholder="john@example.com"
                          className="border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:ring-purple-500/20"
                          required
                        />
                      </div>
                    </div>

                    {/* Password (opsional) */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="password"
                          className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          Password (optional)
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          placeholder={
                            editingUser
                              ? "Kosongkan jika tidak diganti"
                              : "Isi untuk set manual"
                          }
                          className="border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:ring-purple-500/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="password_confirmation"
                          className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          Confirm Password
                        </Label>
                        <Input
                          id="password_confirmation"
                          type="password"
                          value={formData.password_confirmation}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password_confirmation: e.target.value,
                            })
                          }
                          placeholder="Ulangi password"
                          className="border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:ring-purple-500/20"
                        />
                      </div>
                    </div>

                    {/* Levels */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Assign Levels *
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableLevels.map((level) => (
                          <div
                            key={level}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={level}
                              checked={formData.levels.includes(level)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({
                                    ...formData,
                                    levels: [...formData.levels, level],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    levels: formData.levels.filter(
                                      (l) => l !== level
                                    ),
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={level} className="text-sm">
                              {level}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status + Options */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="status"
                          className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          Status
                        </Label>
                        <Select
                          value={formData.status}
                          onValueChange={(
                            value: "Active" | "Invited" | "Suspended"
                          ) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:border-purple-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Invited">Invited</SelectItem>
                            <SelectItem value="Suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {!editingUser && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Options
                          </Label>
                          <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                              id="sendInvitation"
                              checked={formData.sendInvitation}
                              onCheckedChange={(checked) =>
                                setFormData({
                                  ...formData,
                                  sendInvitation: !!checked,
                                })
                              }
                            />
                            <Label htmlFor="sendInvitation" className="text-sm">
                              Send invitation email
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsInviteModalOpen(false);
                          setEditingUser(null);
                          resetForm();
                        }}
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
                      >
                        {editingUser ? "Update User" : "Send Invitation"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-background/50 border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Status">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Invited">Invited</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={lastActiveFilter}
              onValueChange={setLastActiveFilter}
            >
              <SelectTrigger className="w-40 bg-background/50 border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Any">Any</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Level(s)</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Last Login</TableHead>
                <TableHead className="font-semibold text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="border-primary/10 hover:bg-primary/5"
                >
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 flex-wrap">
                      {user.levels.slice(0, 2).map((level) => (
                        <Badge
                          key={level}
                          variant="secondary"
                          className="text-xs"
                        >
                          {level}
                        </Badge>
                      ))}
                      {user.levels.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.levels.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.status === "Active"
                          ? "default"
                          : user.status === "Invited"
                          ? "secondary"
                          : "destructive"
                      }
                      className={
                        user.status === "Active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : user.status === "Invited"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastLogin}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-primary/10"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => console.log("View", user.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleResetPassword(user)}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleSuspend(user)}
                          className={
                            user.status === "Suspended"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {user.status === "Suspended" ? (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          ) : (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Suspend
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-2">No users found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery ||
              statusFilter !== "All Status" ||
              lastActiveFilter !== "Any"
                ? "No users match your current filters."
                : "Get started by inviting your first user."}
            </p>
            {!searchQuery &&
              statusFilter === "All Status" &&
              lastActiveFilter === "Any" && (
                <Button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
