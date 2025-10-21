// "use client";

// import type React from "react";
// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Badge } from "@/components/ui/badge";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Plus, Search, Download, Edit, Archive, Users } from "lucide-react";
// import { toast } from "sonner";
// import { fetchData, createData, updateData, deleteData } from "@/lib/api";

// interface Level {
//   id: number;
//   nama_level: string;
//   deskripsi: string;
//   status: "Aktif" | "Tidak Aktif";
//   default_homepage?: string | null;
//   user_count?: number; // <— tambahan agar bisa tampil Users
// }

// export function LevelUser() {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [editingLevel, setEditingLevel] = useState<Level | null>(null);
//   const [formData, setFormData] = useState({
//     nama_level: "",
//     deskripsi: "",
//     status: "Aktif" as "Aktif" | "Tidak Aktif",
//     default_homepage: "",
//   });
//   const [levels, setLevels] = useState<Level[]>([]);

//   // Load data
//   useEffect(() => {
//     loadLevels();
//   }, []);

//   async function loadLevels() {
//     try {
//       const data = await fetchData("level_users");
//       setLevels(Array.isArray(data) ? data : []);
//     } catch (e: any) {
//       toast.error(`Gagal load data: ${e?.message || ""}`);
//     }
//   }

//   const filteredLevels = levels.filter(
//     (level) =>
//       (level.nama_level || "")
//         .toLowerCase()
//         .includes(searchQuery.toLowerCase()) ||
//       (level.deskripsi || "").toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!formData.nama_level.trim()) {
//       toast.error("Level name is required");
//       return;
//     }

//     try {
//       if (editingLevel) {
//         await updateData("level_users", editingLevel.id, formData);
//         toast.success("Level updated successfully");
//       } else {
//         await createData("level_users", formData);
//         toast.success("Level added successfully");
//       }
//       setFormData({
//         nama_level: "",
//         deskripsi: "",
//         status: "Aktif",
//         default_homepage: "",
//       });
//       setIsAddModalOpen(false);
//       setEditingLevel(null);
//       loadLevels();
//     } catch (e: any) {
//       toast.error(`Gagal simpan data: ${e?.message || ""}`);
//     }
//   };

//   const handleEdit = (level: Level) => {
//     setEditingLevel(level);
//     setFormData({
//       nama_level: level.nama_level || "",
//       deskripsi: level.deskripsi || "",
//       status: level.status,
//       default_homepage: level.default_homepage || "",
//     });
//     setIsAddModalOpen(true);
//   };

//   const handleArchive = async (level: Level) => {
//     if (confirm(`Are you sure you want to archive "${level.nama_level}"?`)) {
//       try {
//         await deleteData("level_users", level.id);
//         toast.success("Level archived successfully");
//         loadLevels();
//       } catch (e: any) {
//         toast.error(`Gagal hapus data: ${e?.message || ""}`);
//       }
//     }
//   };

//   const exportCSV = () => {
//     // Escape CSV helper
//     const esc = (val: any) => {
//       const s = String(val ?? "");
//       if (/[",\n]/.test(s)) {
//         return `"${s.replace(/"/g, '""')}"`;
//       }
//       return s;
//     };

//     const rows = [
//       ["Level Name", "Description", "Status", "Default Homepage", "Users"],
//       ...filteredLevels.map((level) => [
//         level.nama_level,
//         level.deskripsi || "",
//         level.status === "Aktif" ? "Active" : "Inactive",
//         level.default_homepage || "",
//         String(level.user_count ?? 0),
//       ]),
//     ];

//     const csv = rows.map((r) => r.map(esc).join(",")).join("\n");

//     // Tambah BOM agar Excel membaca UTF-8
//     const blob = new Blob(["\ufeff" + csv], {
//       type: "text/csv;charset=utf-8;",
//     });
//     const url = URL.createObjectURL(blob);

//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "levels.csv";
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
//             Level User
//           </h1>
//           <p className="text-muted-foreground">
//             Manage user roles and access levels
//           </p>
//         </div>
//       </div>

//       <div className="bg-card rounded-xl border border-primary/20 shadow-lg">
//         <div className="p-6 border-b border-primary/20">
//           <div className="flex items-center justify-between gap-4">
//             <div className="relative flex-1 max-w-md">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input
//                 placeholder="Search role..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="pl-10 bg-background/50 border-primary/20 focus:border-primary/40"
//               />
//             </div>
//             <div className="flex items-center gap-2">
//               <Button
//                 variant="outline"
//                 onClick={exportCSV}
//                 className="border-primary/20 hover:bg-primary/10 bg-transparent"
//               >
//                 <Download className="h-4 w-4 mr-2" />
//                 Export CSV
//               </Button>

//               <Dialog
//                 open={isAddModalOpen}
//                 onOpenChange={(v) => {
//                   setIsAddModalOpen(v);
//                   if (!v) setEditingLevel(null);
//                 }}
//               >
//                 <DialogTrigger asChild>
//                   <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
//                     <Plus className="h-4 w-4 mr-2" />
//                     Add Level
//                   </Button>
//                 </DialogTrigger>
//                 <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-0 shadow-2xl">
//                   <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-t-lg" />
//                   <DialogHeader className="pb-4">
//                     <DialogTitle className="text-xl font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2">
//                       {editingLevel ? "✏️" : "➕"}{" "}
//                       {editingLevel ? "Edit Level" : "Add New Level"}
//                     </DialogTitle>
//                     <p className="text-sm text-slate-600 dark:text-slate-400">
//                       {editingLevel
//                         ? "Update level information"
//                         : "Create a new user access level"}
//                     </p>
//                   </DialogHeader>

//                   <form onSubmit={handleSubmit} className="space-y-4">
//                     <div className="space-y-2">
//                       <Label
//                         htmlFor="nama_level"
//                         className="text-sm font-medium text-slate-700 dark:text-slate-300"
//                       >
//                         Level Name *
//                       </Label>
//                       <Input
//                         id="nama_level"
//                         value={formData.nama_level}
//                         onChange={(e) =>
//                           setFormData({
//                             ...formData,
//                             nama_level: e.target.value,
//                           })
//                         }
//                         placeholder="e.g., Admin, Marketing"
//                         className="border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:ring-purple-500/20"
//                         required
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <Label
//                         htmlFor="deskripsi"
//                         className="text-sm font-medium text-slate-700 dark:text-slate-300"
//                       >
//                         Description
//                       </Label>
//                       <Textarea
//                         id="deskripsi"
//                         value={formData.deskripsi}
//                         onChange={(e) =>
//                           setFormData({
//                             ...formData,
//                             deskripsi: e.target.value,
//                           })
//                         }
//                         placeholder="Brief description of this level's purpose"
//                         className="border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:ring-purple-500/20 min-h-[80px]"
//                       />
//                     </div>

//                     <div className="grid grid-cols-2 gap-4">
//                       <div className="space-y-2">
//                         <Label
//                           htmlFor="status"
//                           className="text-sm font-medium text-slate-700 dark:text-slate-300"
//                         >
//                           Status
//                         </Label>
//                         <Select
//                           value={formData.status}
//                           onValueChange={(value: "Aktif" | "Tidak Aktif") =>
//                             setFormData({ ...formData, status: value })
//                           }
//                         >
//                           <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:border-purple-500">
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="Aktif">Active</SelectItem>
//                             <SelectItem value="Tidak Aktif">
//                               Inactive
//                             </SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>

//                       <div className="space-y-2">
//                         <Label
//                           htmlFor="default_homepage"
//                           className="text-sm font-medium text-slate-700 dark:text-slate-300"
//                         >
//                           Default Homepage
//                         </Label>
//                         <Select
//                           value={formData.default_homepage}
//                           onValueChange={(value) =>
//                             setFormData({
//                               ...formData,
//                               default_homepage: value,
//                             })
//                           }
//                         >
//                           <SelectTrigger className="border-slate-200 dark:border-slate-700 focus:border-purple-500">
//                             <SelectValue placeholder="Select page" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="dashboard">Dashboard</SelectItem>
//                             <SelectItem value="products">Products</SelectItem>
//                             <SelectItem value="customers">Customers</SelectItem>
//                             <SelectItem value="finance">Finance</SelectItem>
//                             <SelectItem value="support">Support</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
//                     </div>

//                     <div className="flex justify-end gap-3 pt-4">
//                       <Button
//                         type="button"
//                         variant="outline"
//                         onClick={() => {
//                           setIsAddModalOpen(false);
//                           setEditingLevel(null);
//                           setFormData({
//                             nama_level: "",
//                             deskripsi: "",
//                             status: "Aktif",
//                             default_homepage: "",
//                           });
//                         }}
//                         className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
//                       >
//                         Cancel
//                       </Button>
//                       <Button
//                         type="submit"
//                         className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
//                       >
//                         {editingLevel ? "Update Level" : "Create Level"}
//                       </Button>
//                     </div>
//                   </form>
//                 </DialogContent>
//               </Dialog>
//             </div>
//           </div>
//         </div>

//         <div className="overflow-x-auto">
//           <Table>
//             <TableHeader>
//               <TableRow className="border-primary/20">
//                 <TableHead className="font-semibold">Level Name</TableHead>
//                 <TableHead className="font-semibold">Description</TableHead>
//                 <TableHead className="font-semibold">Users</TableHead>
//                 <TableHead className="font-semibold">Status</TableHead>
//                 <TableHead className="font-semibold text-right">
//                   Actions
//                 </TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filteredLevels.map((level) => (
//                 <TableRow
//                   key={level.id}
//                   className="border-primary/10 hover:bg-primary/5"
//                 >
//                   <TableCell className="font-medium">
//                     {level.nama_level}
//                   </TableCell>
//                   <TableCell className="text-muted-foreground">
//                     {level.deskripsi}
//                   </TableCell>
//                   <TableCell>
//                     <div className="flex items-center gap-2">
//                       <Users className="h-4 w-4 text-muted-foreground" />
//                       <span>{level.user_count ?? 0}</span>
//                     </div>
//                   </TableCell>
//                   <TableCell>
//                     <Badge
//                       variant={
//                         level.status === "Aktif" ? "default" : "secondary"
//                       }
//                       className={
//                         level.status === "Aktif"
//                           ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
//                           : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
//                       }
//                     >
//                       {level.status === "Aktif" ? "Active" : "Inactive"}
//                     </Badge>
//                   </TableCell>
//                   <TableCell className="text-right">
//                     <div className="flex items-center justify-end gap-2">
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleEdit(level)}
//                         className="hover:bg-primary/10"
//                       >
//                         <Edit className="h-4 w-4" />
//                       </Button>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleArchive(level)}
//                         className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
//                       >
//                         <Archive className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </div>

//         {filteredLevels.length === 0 && (
//           <div className="flex flex-col items-center justify-center py-12">
//             <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
//             <h3 className="font-medium text-lg mb-2">No levels found</h3>
//             <p className="text-muted-foreground text-center mb-4">
//               {searchQuery
//                 ? "No levels match your search criteria."
//                 : "Get started by creating your first user level."}
//             </p>
//             {!searchQuery && (
//               <Button
//                 onClick={() => setIsAddModalOpen(true)}
//                 className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
//               >
//                 <Plus className="h-4 w-4 mr-2" />
//                 Add Level
//               </Button>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import type React from "react";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  Search,
  Download,
  Edit,
  Archive,
  Users,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { fetchData, createData, updateData, deleteData } from "@/lib/api";

interface Level {
  id: number;
  nama_level: string;
  deskripsi: string;
  status: "Aktif" | "Tidak Aktif";
  default_homepage?: string | null;
  user_count?: number;
}

export function LevelUser() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [formData, setFormData] = useState({
    nama_level: "",
    deskripsi: "",
    status: "Aktif" as "Aktif" | "Tidak Aktif",
    default_homepage: "",
  });
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLevels();
  }, []);

  async function loadLevels() {
    try {
      setLoading(true);
      const data = await fetchData("level_users");
      setLevels(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(`Gagal load data: ${e?.message || ""}`);
    } finally {
      setLoading(false);
    }
  }

  const filteredLevels = useMemo(
    () =>
      levels.filter(
        (level) =>
          (level.nama_level || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (level.deskripsi || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      ),
    [levels, searchQuery]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_level.trim()) {
      toast.error("Level name is required");
      return;
    }

    try {
      if (editingLevel) {
        await updateData("level_users", editingLevel.id, formData);
        toast.success("Level updated successfully");
      } else {
        await createData("level_users", formData);
        toast.success("Level added successfully");
      }
      setFormData({
        nama_level: "",
        deskripsi: "",
        status: "Aktif",
        default_homepage: "",
      });
      setIsAddModalOpen(false);
      setEditingLevel(null);
      loadLevels();
    } catch (e: any) {
      toast.error(`Gagal simpan data: ${e?.message || ""}`);
    }
  };

  const handleEdit = (level: Level) => {
    setEditingLevel(level);
    setFormData({
      nama_level: level.nama_level || "",
      deskripsi: level.deskripsi || "",
      status: level.status,
      default_homepage: level.default_homepage || "",
    });
    setIsAddModalOpen(true);
  };

  const handleArchive = async (level: Level) => {
    if (confirm(`Are you sure you want to archive "${level.nama_level}"?`)) {
      try {
        await deleteData("level_users", level.id);
        toast.success("Level archived successfully");
        loadLevels();
      } catch (e: any) {
        toast.error(`Gagal hapus data: ${e?.message || ""}`);
      }
    }
  };

  const exportCSV = () => {
    const esc = (val: any) => {
      const s = String(val ?? "");
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const rows = [
      ["Level Name", "Description", "Status", "Default Homepage", "Users"],
      ...filteredLevels.map((level) => [
        level.nama_level,
        level.deskripsi || "",
        level.status === "Aktif" ? "Active" : "Inactive",
        level.default_homepage || "",
        String(level.user_count ?? 0),
      ]),
    ];
    const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "levels.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Level User
          </h1>
          <p className="text-muted-foreground">
            Manage user roles and access levels
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-primary/20 shadow-lg">
        {/* Toolbar */}
        <div className="p-4 md:p-6 border-b border-primary/20">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-primary/20 focus:border-primary/40"
              />
            </div>

            {/* Actions: scrollable on mobile so they never overflow */}
            <div className="w-full md:w-auto overflow-x-auto">
              <div className="inline-flex items-center gap-2 min-w-max">
                <Button
                  variant="outline"
                  onClick={exportCSV}
                  className="border-primary/20 hover:bg-primary/10 bg-transparent shrink-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>

                <Dialog
                  open={isAddModalOpen}
                  onOpenChange={(v) => {
                    setIsAddModalOpen(v);
                    if (!v) setEditingLevel(null);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shrink-0">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Level
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-0 shadow-2xl">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-t-lg" />
                    <DialogHeader className="pb-4">
                      <DialogTitle className="text-xl font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                        {editingLevel ? "✏️ Edit Level" : "➕ Add New Level"}
                      </DialogTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {editingLevel
                          ? "Update level information"
                          : "Create a new user access level"}
                      </p>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nama_level">Level Name *</Label>
                        <Input
                          id="nama_level"
                          value={formData.nama_level}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nama_level: e.target.value,
                            })
                          }
                          placeholder="e.g., Admin, Marketing"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="deskripsi">Description</Label>
                        <Textarea
                          id="deskripsi"
                          value={formData.deskripsi}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              deskripsi: e.target.value,
                            })
                          }
                          placeholder="Brief description of this level's purpose"
                          className="min-h-[80px]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value: "Aktif" | "Tidak Aktif") =>
                              setFormData({ ...formData, status: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Aktif">Active</SelectItem>
                              <SelectItem value="Tidak Aktif">
                                Inactive
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Default Homepage</Label>
                          <Select
                            value={formData.default_homepage}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                default_homepage: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select page" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dashboard">
                                Dashboard
                              </SelectItem>
                              <SelectItem value="products">Products</SelectItem>
                              <SelectItem value="customers">
                                Customers
                              </SelectItem>
                              <SelectItem value="finance">Finance</SelectItem>
                              <SelectItem value="support">Support</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAddModalOpen(false);
                            setEditingLevel(null);
                            setFormData({
                              nama_level: "",
                              deskripsi: "",
                              status: "Aktif",
                              default_homepage: "",
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                          {editingLevel ? "Update Level" : "Create Level"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP TABLE (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20">
                <TableHead className="font-semibold w-[220px]">
                  Level Name
                </TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold w-[120px]">Users</TableHead>
                <TableHead className="font-semibold w-[140px]">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-right w-[120px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : (
                filteredLevels.map((level) => (
                  <TableRow
                    key={level.id}
                    className="border-primary/10 hover:bg-primary/5"
                  >
                    <TableCell className="font-medium">
                      {level.nama_level}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {level.deskripsi}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{level.user_count ?? 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          level.status === "Aktif" ? "default" : "secondary"
                        }
                        className={
                          level.status === "Aktif"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                        }
                      >
                        {level.status === "Aktif" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(level)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(level)}
                          className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* MOBILE CARDS (md-) */}
        <div className="md:hidden">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading…
            </div>
          ) : filteredLevels.length ? (
            <ul className="p-3 space-y-3">
              {filteredLevels.map((level) => (
                <li
                  key={level.id}
                  className="rounded-xl border border-primary/10 bg-card/50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">
                          {level.nama_level}
                        </h3>
                        <Badge
                          variant={
                            level.status === "Aktif" ? "default" : "secondary"
                          }
                          className="shrink-0"
                        >
                          {level.status === "Aktif" ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {level.deskripsi && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {level.deskripsi}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{level.user_count ?? 0} users</span>
                        {level.default_homepage && (
                          <>
                            <ChevronRight className="h-4 w-4 opacity-50" />
                            <span className="truncate">
                              Home: {level.default_homepage}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(level)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleArchive(level)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Archive className="h-4 w-4 mr-1" />
                        Archive
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-2">No levels found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery
                  ? "No levels match your search criteria."
                  : "Get started by creating your first user level."}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Level
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
