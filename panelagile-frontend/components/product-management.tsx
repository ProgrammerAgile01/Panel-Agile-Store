// "use client";

// import { useEffect, useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   PackageIcon,
//   Plus,
//   Search,
//   Edit,
//   Eye,
//   Star,
//   DollarSign,
//   Users,
//   Upload,
// } from "lucide-react";
// import {
//   BarChart3,
//   Car,
//   UserCheck,
//   Building,
//   MessageSquare,
//   Mail,
//   FileSpreadsheet,
//   FileText,
//   MapPin,
//   Bell,
//   Calculator,
//   Calendar,
//   UserCog,
//   ClipboardList,
//   Banknote,
//   Receipt,
// } from "lucide-react";

// import {
//   listPanelCatalogProducts,
//   getPanelCatalogProduct,
//   // syncPanelProducts,
//   createProductPanel,
//   updateProductPanel,
// } from "@/lib/api";

// /* ================== Types (UI-local) ================== */
// interface Product {
//   id: string | number;
//   name: string;
//   slug: string; // mapped from product_code
//   description: string;
//   logo: string;
//   category: string;
//   status: "Active" | "Draft" | "Archived" | string;
//   dbName: string; // <— NEW
//   totalCustomers: number; // UI metric (not from DB) → default 0
//   monthlyRevenue: number; // UI metric (not from DB) → default 0
//   rating: number; // UI metric (not from DB) → default 0
//   createdAt: string;
//   updatedAt: string;
// }

// interface ProductFormData {
//   name: string;
//   slug: string; // product_code
//   description: string;
//   category: string;
//   status: "Active" | "Draft" | "Archived";
//   logo: string;
//   dbName: string; // <— NEW
// }

// interface ProductManagementProps {
//   onNavigateToDetails?: (productSlug: string) => void;
// }

// /* ================== Component ================== */
// export function ProductManagement({
//   onNavigateToDetails,
// }: ProductManagementProps) {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [editingProduct, setEditingProduct] = useState<Product | null>(null);
//   const [highlightedProduct, setHighlightedProduct] = useState<
//     string | number | null
//   >(null);
//   const [loading, setLoading] = useState(false);
//   const [syncing, setSyncing] = useState(false);

//   const [formData, setFormData] = useState<ProductFormData>({
//     name: "",
//     slug: "",
//     description: "",
//     category: "General",
//     status: "Active",
//     logo: "",
//     dbName: "", // <— NEW
//   });
//   const [formErrors, setFormErrors] = useState<Partial<ProductFormData>>({});

//   /* ========== Helpers ========== */
//   // Format code: hanya huruf kapital A-Z dan angka 0-9 (hapus semua selain itu)
//   const formatCode = (value: string) =>
//     value.toUpperCase().replace(/[^A-Z0-9]/g, "");

//   const validateForm = (data: ProductFormData): Partial<ProductFormData> => {
//     const errors: Partial<ProductFormData> = {};
//     if (!data.name.trim()) errors.name = "Product name is required";

//     if (!data.slug.trim()) {
//       errors.slug = "Code is required";
//     } else {
//       if (data.slug.length > 64) {
//         errors.slug = "Code must be 64 characters or less";
//       } else if (!/^[A-Z0-9]+$/.test(data.slug)) {
//         errors.slug =
//           "Code must contain only uppercase letters and numbers (A–Z, 0–9)";
//       }
//     }

//     if (!data.description.trim())
//       errors.description = "Description is required";
//     if (data.description.length > 160)
//       errors.description = "Description must be 160 characters or less";

//     // db_name validations
//     if (!data.dbName.trim()) {
//       errors.dbName = "DB name is required";
//     } else {
//       if (data.dbName.length > 60) {
//         errors.dbName = "DB name must be 60 characters or less";
//       } else if (!/^[A-Za-z0-9_]+$/.test(data.dbName)) {
//         errors.dbName =
//           "DB name may only contain letters, numbers, and underscore (_)";
//       }
//     }
//     return errors;
//   };

//   const resetForm = () => {
//     setFormData({
//       name: "",
//       slug: "",
//       description: "",
//       category: "General",
//       status: "Active",
//       logo: "",
//       dbName: "",
//     });
//     setFormErrors({});
//   };

//   const mapRowToProduct = (row: any): Product => {
//     // row berasal dari Panel /api/products (DB mst_products)
//     return {
//       id: row.id,
//       name: row.product_name ?? row.name ?? row.product_code ?? "Product",
//       slug: row.product_code ?? row.slug ?? "",
//       description: row.description ?? "",
//       logo: "", // tidak ada di DB → biarkan kosong/emoji manual jika mau
//       category: row.category ?? "General",
//       status: (row.status as any) ?? "Active",
//       dbName: row.db_name ?? "", // <— NEW
//       totalCustomers: 0, // tidak ada di DB
//       monthlyRevenue: 0, // tidak ada di DB
//       rating: 0, // tidak ada di DB
//       createdAt: (row.created_at ?? "").toString().slice(0, 10),
//       updatedAt: (row.upstream_updated_at ?? row.updated_at ?? "")
//         .toString()
//         .slice(0, 10),
//     };
//   };

//   const loadProducts = async (q?: string) => {
//     setLoading(true);
//     try {
//       const json = await listPanelCatalogProducts(q, 200);
//       const arr = Array.isArray(json?.data) ? json.data : [];
//       setProducts(arr.map(mapRowToProduct));
//     } catch (e: any) {
//       console.error("Failed to load products:", e?.message || e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     // initial load
//     loadProducts();
//   }, []);

//   /* ========== Actions ========== */
//   const handleAddProduct = async () => {
//     const errors = validateForm(formData);
//     if (Object.keys(errors).length > 0) {
//       setFormErrors(errors);
//       return;
//     }
//     try {
//       // Map ke kolom mst_products
//       await createProductPanel({
//         product_code: formData.slug,
//         product_name: formData.name,
//         category: formData.category || null,
//         status: formData.status || "Active",
//         description: formData.description || null,
//         db_name: formData.dbName,
//       });

//       setIsAddModalOpen(false);
//       resetForm();
//       await loadProducts();

//       // Highlight baru 2 detik
//       const just = formData.slug;
//       setHighlightedProduct(just);
//       setTimeout(() => setHighlightedProduct(null), 2000);
//     } catch (e: any) {
//       console.error("Create product failed:", e?.message || e);
//       alert(e?.message || "Create product failed");
//     }
//   };

//   const handleEditProduct = async () => {
//     if (!editingProduct) return;

//     const errors = validateForm(formData);
//     if (Object.keys(errors).length > 0) {
//       setFormErrors(errors);
//       return;
//     }

//     try {
//       await updateProductPanel(editingProduct.id, {
//         product_name: formData.name,
//         category: formData.category || null,
//         status: formData.status || "Active",
//         description: formData.description || null,
//         db_name: formData.dbName, // <— NEW (allow edit)
//       });

//       setIsEditModalOpen(false);
//       setEditingProduct(null);
//       resetForm();
//       await loadProducts();

//       setHighlightedProduct(editingProduct.id);
//       setTimeout(() => setHighlightedProduct(null), 2000);
//     } catch (e: any) {
//       console.error("Update product failed:", e?.message || e);
//       alert(e?.message || "Update product failed");
//     }
//   };

//   const openEditModal = (product: Product) => {
//     setEditingProduct(product);
//     setFormData({
//       name: product.name,
//       slug: product.slug, // product_code
//       description: product.description,
//       category: product.category,
//       status: ["Active", "Draft", "Archived"].includes(product.status)
//         ? (product.status as any)
//         : "Active",
//       logo: product.logo ?? "",
//       dbName: product.dbName ?? "", // <— NEW
//     });
//     setIsEditModalOpen(true);
//   };

//   const handleViewDetails = async (product: Product) => {
//     // kalau mau ambil detail dari server:
//     // const detail = await getPanelCatalogProduct(product.slug || String(product.id));
//     if (onNavigateToDetails) {
//       onNavigateToDetails(product.slug);
//     }
//   };

//   const handleImportSync = async () => {
//     // Sync dari Warehouse → Panel DB, lalu reload
//     setSyncing(true);
//     try {
//       // await syncPanelProducts();
//       await loadProducts();
//     } catch (e: any) {
//       console.error("Sync failed:", e?.message || e);
//       alert(e?.message || "Sync failed");
//     } finally {
//       setSyncing(false);
//     }
//   };

//   /* ========== UI helpers (tidak diubah) ========== */
//   const getStatusBadge = (status: string) => {
//     switch (status) {
//       case "Active":
//         return (
//           <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
//             Active
//           </Badge>
//         );
//       case "Draft":
//         return (
//           <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
//             Draft
//           </Badge>
//         );
//       case "Archived":
//         return (
//           <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
//             Archived
//           </Badge>
//         );
//       default:
//         return <Badge>{status}</Badge>;
//     }
//   };

//   const getPackageColor = (packageId: string) => {
//     switch (packageId) {
//       case "starter":
//         return "bg-gray-500/20 text-gray-400 border-gray-500/30";
//       case "medium":
//         return "bg-blue-500/20 text-blue-400 border-blue-500/30";
//       case "professional":
//         return "bg-purple-500/20 text-purple-400 border-purple-500/30";
//       default:
//         return "bg-gray-500/20 text-gray-400 border-gray-500/30";
//     }
//   };

//   const getIconComponent = (iconName: string) => {
//     const icons: { [key: string]: any } = {
//       MessageSquare,
//       Mail,
//       FileSpreadsheet,
//       FileText,
//       BarChart3,
//       Building,
//       MapPin,
//       Bell,
//       UserCheck,
//       ClipboardList,
//       Calendar,
//       Calculator,
//       UserCog,
//       Banknote,
//       Car,
//       Receipt,
//     };
//     const IconComponent = icons[iconName] || PackageIcon;
//     return <IconComponent className="h-4 w-4" />;
//   };

//   const filteredProducts = products.filter(
//     (product) =>
//       product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       product.category.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   /* ================== RENDER ================== */
//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
//             Products
//           </h1>
//           <p className="text-muted-foreground">Manage your product catalog</p>
//         </div>
//         <div className="flex gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={handleImportSync}
//             disabled={syncing}
//           >
//             <Upload className="h-4 w-4 mr-2" />
//             {syncing ? "Importing..." : "Import"}
//           </Button>

//           <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
//             <DialogTrigger asChild>
//               <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 glow-primary">
//                 <Plus className="h-4 w-4 mr-2" />
//                 Add Product
//               </Button>
//             </DialogTrigger>
//             <DialogContent className="w-full max-w-[500px] rounded-xl p-0 bg-white dark:bg-slate-900 border-0 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl">
//               <DialogHeader className="p-6 pb-4">
//                 <div className="flex items-center gap-3">
//                   <span className="text-2xl">📦</span>
//                   <div>
//                     <DialogTitle className="text-lg font-bold text-[#5B21B6] dark:text-purple-400">
//                       ➕ Add New Product
//                     </DialogTitle>
//                     <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
//                       Create a new product in your catalog
//                     </p>
//                   </div>
//                 </div>
//               </DialogHeader>

//               <div className="px-6 pb-6 space-y-4">
//                 {/* Name */}
//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="name"
//                     className="text-sm font-medium text-[#374151] dark:text-gray-300"
//                   >
//                     Product Name *
//                   </Label>
//                   <Input
//                     id="name"
//                     value={formData.name}
//                     onChange={(e) => {
//                       const name = e.target.value;
//                       setFormData((prev) => ({
//                         ...prev,
//                         name,
//                         // ❌ Tidak auto-set slug dari name (sesuai requirement)
//                       }));
//                       if (formErrors.name)
//                         setFormErrors((prev) => ({ ...prev, name: undefined }));
//                     }}
//                     className={`border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200 ${
//                       formErrors.name
//                         ? "border-red-500 focus:border-red-500 focus:ring-red-500"
//                         : ""
//                     }`}
//                     placeholder="Enter product name"
//                   />
//                   {formErrors.name && (
//                     <p className="text-red-500 text-xs mt-1">
//                       {formErrors.name}
//                     </p>
//                   )}
//                 </div>

//                 {/* Slug / product_code */}
//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="slug"
//                     className="text-sm font-medium text-[#374151] dark:text-gray-300"
//                   >
//                     Code (A–Z, 0–9 only) *
//                   </Label>
//                   <Input
//                     id="slug"
//                     value={formData.slug}
//                     onChange={(e) => {
//                       const val = formatCode(e.target.value);
//                       setFormData((prev) => ({
//                         ...prev,
//                         slug: val,
//                       }));
//                       if (formErrors.slug)
//                         setFormErrors((prev) => ({ ...prev, slug: undefined }));
//                     }}
//                     className={`border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200 ${
//                       formErrors.slug
//                         ? "border-red-500 focus:border-red-500 focus:ring-red-500"
//                         : ""
//                     }`}
//                     placeholder="PRODUCTCODE"
//                   />
//                   {formErrors.slug && (
//                     <p className="text-red-500 text-xs mt-1">
//                       {formErrors.slug}
//                     </p>
//                   )}
//                 </div>

//                 {/* DB Name */}
//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="dbName"
//                     className="text-sm font-medium text-[#374151] dark:text-gray-300"
//                   >
//                     DB Name *
//                   </Label>
//                   <Input
//                     id="dbName"
//                     value={formData.dbName}
//                     onChange={(e) => {
//                       setFormData((prev) => ({
//                         ...prev,
//                         dbName: e.target.value,
//                       }));
//                       if (formErrors.dbName)
//                         setFormErrors((prev) => ({
//                           ...prev,
//                           dbName: undefined,
//                         }));
//                     }}
//                     className={`border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200 ${
//                       formErrors.dbName
//                         ? "border-red-500 focus:border-red-500 focus:ring-red-500"
//                         : ""
//                     }`}
//                     placeholder="my_product_db"
//                   />
//                   <p className="text-xs text-muted-foreground">
//                     Only letters, numbers, and underscore. Max 60 chars.
//                   </p>
//                   {formErrors.dbName && (
//                     <p className="text-red-500 text-xs mt-1">
//                       {formErrors.dbName}
//                     </p>
//                   )}
//                 </div>

//                 {/* Description */}
//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="description"
//                     className="text-sm font-medium text-[#374151] dark:text-gray-300"
//                   >
//                     Short Description (max 160 chars)
//                   </Label>
//                   <Textarea
//                     id="description"
//                     value={formData.description}
//                     onChange={(e) => {
//                       setFormData((prev) => ({
//                         ...prev,
//                         description: e.target.value,
//                       }));
//                       if (formErrors.description)
//                         setFormErrors((prev) => ({
//                           ...prev,
//                           description: undefined,
//                         }));
//                     }}
//                     className={`border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200 resize-none ${
//                       formData.description.length > 160
//                         ? "border-red-500 focus:border-red-500 focus:ring-red-500"
//                         : ""
//                     }`}
//                     maxLength={160}
//                     rows={3}
//                     placeholder="Brief description of your product"
//                   />
//                   <div className="flex justify-between items-center text-xs">
//                     {formErrors.description && (
//                       <p className="text-red-500">{formErrors.description}</p>
//                     )}
//                     <p
//                       className={`ml-auto ${
//                         formData.description.length > 160
//                           ? "text-red-500"
//                           : "text-gray-500"
//                       }`}
//                     >
//                       {formData.description.length}/160
//                     </p>
//                   </div>
//                 </div>

//                 {/* Category */}
//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="category"
//                     className="text-sm font-medium text-[#374151] dark:text-gray-300"
//                   >
//                     Category
//                   </Label>
//                   <Select
//                     value={formData.category}
//                     onValueChange={(value) =>
//                       setFormData((prev) => ({ ...prev, category: value }))
//                     }
//                   >
//                     <SelectTrigger className="border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
//                       <SelectItem value="General">General</SelectItem>
//                       <SelectItem value="Business Management">
//                         Business Management
//                       </SelectItem>
//                       <SelectItem value="HR Management">
//                         HR Management
//                       </SelectItem>
//                       <SelectItem value="Finance">Finance</SelectItem>
//                       <SelectItem value="Marketing">Marketing</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 {/* Status */}
//                 <div className="space-y-2">
//                   <Label
//                     htmlFor="status"
//                     className="text-sm font-medium text-[#374151] dark:text-gray-300"
//                   >
//                     Status
//                   </Label>
//                   <Select
//                     value={formData.status}
//                     onValueChange={(value: "Active" | "Draft" | "Archived") =>
//                       setFormData((prev) => ({ ...prev, status: value }))
//                     }
//                   >
//                     <SelectTrigger className="border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
//                       <SelectItem value="Active">Active</SelectItem>
//                       <SelectItem value="Draft">Draft</SelectItem>
//                       <SelectItem value="Archived">Archived</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="flex gap-3 pt-4">
//                   <Button
//                     onClick={handleAddProduct}
//                     className="flex-1 h-11 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:from-purple-700 hover:to-blue-700 text-white font-bold text-sm rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
//                   >
//                     Add Product
//                   </Button>
//                   <Button
//                     variant="ghost"
//                     onClick={() => {
//                       setIsAddModalOpen(false);
//                       resetForm();
//                     }}
//                     className="h-11 px-6 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200"
//                   >
//                     Cancel
//                   </Button>
//                 </div>
//               </div>
//             </DialogContent>
//           </Dialog>
//         </div>
//       </div>

//       {/* Overview Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card className="glass-morphism bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/20">
//           <CardContent className="p-4">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-lg">
//                 <PackageIcon className="h-5 w-5 text-purple-400" />
//               </div>
//               <div>
//                 <p className="text-sm text-muted-foreground">Total Products</p>
//                 <p className="font-semibold">{products.length}</p>
//                 <p className="text-xs text-green-400">
//                   {loading ? "Loading..." : "All active"}
//                 </p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="glass-morphism bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
//           <CardContent className="p-4">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg">
//                 <Users className="h-5 w-5 text-blue-400" />
//               </div>
//               <div>
//                 <p className="text-sm text-muted-foreground">Total Customers</p>
//                 <p className="font-semibold">
//                   {products
//                     .reduce((sum, p) => sum + p.totalCustomers, 0)
//                     .toLocaleString()}
//                 </p>
//                 <p className="text-xs text-green-400">+12% growth</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="glass-morphism bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
//           <CardContent className="p-4">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg">
//                 <DollarSign className="h-5 w-5 text-green-400" />
//               </div>
//               <div>
//                 <p className="text-sm text-muted-foreground">Monthly Revenue</p>
//                 <p className="font-semibold">
//                   $
//                   {products
//                     .reduce((sum, p) => sum + p.monthlyRevenue, 0)
//                     .toLocaleString()}
//                 </p>
//                 <p className="text-xs text-green-400">+18% vs last month</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="glass-morphism bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
//           <CardContent className="p-4">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg">
//                 <Star className="h-5 w-5 text-amber-400" />
//               </div>
//               <div>
//                 <p className="text-sm text-muted-foreground">Avg Rating</p>
//                 <p className="font-semibold">
//                   {products.length > 0
//                     ? (
//                         products.reduce((sum, p) => sum + p.rating, 0) /
//                         products.length
//                       ).toFixed(1)
//                     : "0.0"}
//                 </p>
//                 <p className="text-xs text-green-400">Excellent</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Search */}
//       <div className="flex items-center gap-4">
//         <div className="relative flex-1 max-w-md">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//           <Input
//             placeholder="Search products..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10 bg-background/50"
//           />
//         </div>
//       </div>

//       {/* Product List */}
//       {filteredProducts.length === 0 ? (
//         <Card className="glass-morphism bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border-purple-500/20">
//           <CardContent className="p-12 text-center">
//             <div className="text-6xl mb-4">📦</div>
//             <h3 className="text-xl font-semibold mb-2">
//               {loading ? "Loading..." : "No products yet"}
//             </h3>
//             <p className="text-muted-foreground mb-6">
//               Get started by adding your first product
//             </p>
//             <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
//               <DialogTrigger asChild>
//                 <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
//                   <Plus className="h-4 w-4 mr-2" />
//                   Add Product
//                 </Button>
//               </DialogTrigger>
//             </Dialog>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {filteredProducts.map((product) => (
//             <Card
//               key={product.id}
//               className={`glass-morphism bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border-purple-500/20 hover:border-purple-500/30 transition-all duration-300 ${
//                 highlightedProduct === product.id ||
//                 highlightedProduct === product.slug
//                   ? "ring-2 ring-purple-500/50 glow-accent"
//                   : ""
//               }`}
//             >
//               <CardHeader>
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-3">
//                     <div className="text-3xl">{product.logo || "📦"}</div>
//                     <div>
//                       <CardTitle className="text-xl">{product.name}</CardTitle>
//                       <p className="text-sm text-muted-foreground">
//                         {product.description}
//                       </p>
//                     </div>
//                   </div>
//                   {getStatusBadge(product.status)}
//                 </div>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="grid grid-cols-3 gap-4 text-sm">
//                   <div>
//                     <p className="text-muted-foreground">Customers</p>
//                     <p className="font-semibold text-blue-400">
//                       {product.totalCustomers.toLocaleString()}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-muted-foreground">Revenue</p>
//                     <p className="font-semibold text-green-400">
//                       ${product.monthlyRevenue.toLocaleString()}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-muted-foreground">Rating</p>
//                     <div className="flex items-center gap-1">
//                       <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
//                       <span className="font-semibold">{product.rating}</span>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <p className="text-sm font-medium">Quick Info</p>
//                   <div className="flex items-center justify-between text-xs text-muted-foreground">
//                     <span>Category: {product.category}</span>
//                     <span>DB: {product.dbName || "—"}</span>
//                     <span>Updated: {product.updatedAt}</span>
//                   </div>
//                 </div>

//                 <div className="flex gap-2">
//                   <Button
//                     size="sm"
//                     className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
//                     onClick={() => handleViewDetails(product)}
//                   >
//                     <Eye className="h-4 w-4 mr-2" />
//                     View Details
//                   </Button>
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     className="bg-background/50 hover:bg-purple-500/10"
//                     onClick={() => openEditModal(product)}
//                   >
//                     <Edit className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}

//       {/* Edit Product Modal */}
//       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
//         <DialogContent className="w-full max-w-[500px] rounded-xl p-0 bg-white dark:bg-slate-900 border-0 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl">
//           <DialogHeader className="p-6 pb-4">
//             <div className="flex items-center gap-3">
//               <span className="text-2xl">✏️</span>
//               <div>
//                 <DialogTitle className="text-lg font-bold text-[#5B21B6] dark:text-purple-400">
//                   ✏️ Edit Product
//                 </DialogTitle>
//                 <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
//                   Update your product details
//                 </p>
//               </div>
//             </div>
//           </DialogHeader>

//           <div className="px-6 pb-6 space-y-4">
//             {/* Name */}
//             <div className="space-y-2">
//               <Label
//                 htmlFor="edit-name"
//                 className="text-sm font-medium text-[#374151] dark:text-gray-300"
//               >
//                 Product Name *
//               </Label>
//               <Input
//                 id="edit-name"
//                 value={formData.name}
//                 onChange={(e) => {
//                   const name = e.target.value;
//                   setFormData((prev) => ({
//                     ...prev,
//                     name,
//                   }));
//                   if (formErrors.name)
//                     setFormErrors((prev) => ({ ...prev, name: undefined }));
//                 }}
//                 className={`border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200 ${
//                   formErrors.name
//                     ? "border-red-500 focus:border-red-500 focus:ring-red-500"
//                     : ""
//                 }`}
//                 placeholder="Enter product name"
//               />
//               {formErrors.name && (
//                 <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
//               )}
//             </div>

//             {/* Slug / product_code */}
//             <div className="space-y-2">
//               <Label
//                 htmlFor="edit-slug"
//                 className="text-sm font-medium text-[#374151] dark:text-gray-300"
//               >
//                 Code (A–Z, 0–9 only) *
//               </Label>
//               <Input
//                 id="edit-slug"
//                 value={formData.slug}
//                 onChange={(e) => {
//                   const val = formatCode(e.target.value);
//                   setFormData((prev) => ({ ...prev, slug: val }));
//                   if (formErrors.slug)
//                     setFormErrors((prev) => ({ ...prev, slug: undefined }));
//                 }}
//                 className={`border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200 ${
//                   formErrors.slug
//                     ? "border-red-500 focus:border-red-500 focus:ring-red-500"
//                     : ""
//                 }`}
//                 placeholder="PRODUCTCODE"
//                 disabled
//               />
//               {formErrors.slug && (
//                 <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>
//               )}
//               <p className="text-xs text-muted-foreground">
//                 Product code tidak bisa diubah.
//               </p>
//             </div>

//             {/* DB Name */}
//             <div className="space-y-2">
//               <Label
//                 htmlFor="edit-dbName"
//                 className="text-sm font-medium text-[#374151] dark:text-gray-300"
//               >
//                 DB Name *
//               </Label>
//               <Input
//                 id="edit-dbName"
//                 value={formData.dbName}
//                 onChange={(e) => {
//                   setFormData((prev) => ({ ...prev, dbName: e.target.value }));
//                   if (formErrors.dbName)
//                     setFormErrors((prev) => ({ ...prev, dbName: undefined }));
//                 }}
//                 className={`border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200 ${
//                   formErrors.dbName
//                     ? "border-red-500 focus:border-red-500 focus:ring-red-500"
//                     : ""
//                 }`}
//                 placeholder="my_product_db"
//               />
//               <p className="text-xs text-muted-foreground">
//                 Only letters, numbers, and underscore. Max 60 chars.
//               </p>
//               {formErrors.dbName && (
//                 <p className="text-red-500 text-xs mt-1">{formErrors.dbName}</p>
//               )}
//             </div>

//             {/* Description */}
//             <div className="space-y-2">
//               <Label
//                 htmlFor="edit-description"
//                 className="text-sm font-medium text-[#374151] dark:text-gray-300"
//               >
//                 Short Description (max 160 chars)
//               </Label>
//               <Textarea
//                 id="edit-description"
//                 value={formData.description}
//                 onChange={(e) => {
//                   setFormData((prev) => ({
//                     ...prev,
//                     description: e.target.value,
//                   }));
//                   if (formErrors.description)
//                     setFormErrors((prev) => ({
//                       ...prev,
//                       description: undefined,
//                     }));
//                 }}
//                 className={`border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200 resize-none ${
//                   formErrors.description
//                     ? "border-red-500 focus:border-red-500 focus:ring-red-500"
//                     : ""
//                 }`}
//                 maxLength={160}
//                 rows={3}
//                 placeholder="Brief description of your product"
//               />
//               <div className="flex justify-between items-center text-xs">
//                 {formErrors.description && (
//                   <p className="text-red-500">{formErrors.description}</p>
//                 )}
//                 <p
//                   className={`ml-auto ${
//                     formData.description.length > 160
//                       ? "text-red-500"
//                       : "text-gray-500"
//                   }`}
//                 >
//                   {formData.description.length}/160
//                 </p>
//               </div>
//             </div>

//             {/* Category */}
//             <div className="space-y-2">
//               <Label
//                 htmlFor="edit-category"
//                 className="text-sm font-medium text-[#374151] dark:text-gray-300"
//               >
//                 Category
//               </Label>
//               <Select
//                 value={formData.category}
//                 onValueChange={(value) =>
//                   setFormData((prev) => ({ ...prev, category: value }))
//                 }
//               >
//                 <SelectTrigger className="border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
//                   <SelectItem value="General">General</SelectItem>
//                   <SelectItem value="Business Management">
//                     Business Management
//                   </SelectItem>
//                   <SelectItem value="HR Management">HR Management</SelectItem>
//                   <SelectItem value="Finance">Finance</SelectItem>
//                   <SelectItem value="Marketing">Marketing</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             {/* Status */}
//             <div className="space-y-2">
//               <Label
//                 htmlFor="edit-status"
//                 className="text-sm font-medium text-[#374151] dark:text-gray-300"
//               >
//                 Status
//               </Label>
//               <Select
//                 value={formData.status}
//                 onValueChange={(value: "Active" | "Draft" | "Archived") =>
//                   setFormData((prev) => ({ ...prev, status: value }))
//                 }
//               >
//                 <SelectTrigger className="border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
//                   <SelectItem value="Active">Active</SelectItem>
//                   <SelectItem value="Draft">Draft</SelectItem>
//                   <SelectItem value="Archived">Archived</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="flex gap-3 pt-4">
//               <Button
//                 onClick={handleEditProduct}
//                 className="flex-1 h-11 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:from-purple-700 hover:to-blue-700 text-white font-bold text-sm rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
//               >
//                 Save Changes
//               </Button>
//               <Button
//                 variant="ghost"
//                 onClick={() => {
//                   setIsEditModalOpen(false);
//                   setEditingProduct(null);
//                   resetForm();
//                 }}
//                 className="h-11 px-6 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200"
//               >
//                 Cancel
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

// components/products/ProductManagement.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PackageIcon,
  Plus,
  Search,
  Edit,
  Eye,
  Star,
  DollarSign,
  Users,
  Upload,
} from "lucide-react";
import {
  BarChart3,
  Car,
  UserCheck,
  Building,
  MessageSquare,
  Mail,
  FileSpreadsheet,
  FileText,
  MapPin,
  Bell,
  Calculator,
  Calendar,
  UserCog,
  ClipboardList,
  Banknote,
  Receipt,
} from "lucide-react";

import {
  listPanelCatalogProducts,
  getPanelCatalogProduct,
  createProductPanel,
  updateProductPanel,
  API_URL,
} from "@/lib/api";

/* ================== Types (UI-local) ================== */
interface Product {
  id: string | number;
  name: string;
  slug: string; // mapped from product_code
  description: string;
  logo: string; // expects full URL or empty string
  category: string;
  status: "Active" | "Draft" | "Archived" | string;
  dbName: string; // <— NEW
  totalCustomers: number; // UI metric (not from DB) → default 0
  monthlyRevenue: number; // UI metric (not from DB) → default 0
  rating: number; // UI metric (not from DB) → default 0
  createdAt: string;
  updatedAt: string;
}

interface ProductFormData {
  name: string;
  slug: string; // product_code
  description: string;
  category: string;
  status: "Active" | "Draft" | "Archived";
  logo: string;
  dbName: string; // <— NEW
}

interface ProductManagementProps {
  onNavigateToDetails?: (productSlug: string) => void;
}

/* ================== ImageUploader (reusable) ================== */
type ImageUploaderProps = {
  label?: string;
  previewUrl: string | null;
  file?: File | null;
  inputId?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  onFileChange: (file: File | null) => void;
  maxSizeBytes?: number; // optional, default 4MB
};

function formatBytes(size = 0) {
  if (size === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function ImageUploader({
  label = "Product Image",
  previewUrl,
  file,
  inputId = "product-image",
  inputRef,
  onFileChange,
  maxSizeBytes = 4 * 1024 * 1024,
}: ImageUploaderProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#374151] dark:text-gray-300">
        {label}
      </Label>

      {/* Preview (besar, di atas input) */}
      <div className="w-full flex flex-col sm:flex-row items-start gap-4">
        <div className="w-full sm:w-36 h-36 rounded-lg border border-dashed overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="preview"
              className="object-cover w-full h-full"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "";
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center px-3 text-center">
              <div className="text-2xl">📷</div>
              <div className="text-xs text-muted-foreground mt-2">No image</div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              id={inputId}
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (f && f.size > maxSizeBytes) {
                  alert(
                    `Image too large. Max ${formatBytes(maxSizeBytes)} allowed.`
                  );
                  if (inputRef && (inputRef as any).current)
                    (inputRef as any).current.value = "";
                  onFileChange(null);
                  return;
                }
                onFileChange(f);
              }}
            />

            <label htmlFor={inputId}>
              <Button
                className="h-10 px-3 py-2 flex items-center gap-2 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white"
                onClick={(e) => {
                  e.preventDefault();
                  if (inputRef && (inputRef as any).current)
                    (inputRef as any).current.click();
                }}
              >
                <Upload className="h-4 w-4" />
                <span className="text-sm">Choose Image</span>
              </Button>
            </label>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (inputRef && (inputRef as any).current)
                  (inputRef as any).current.value = "";
                onFileChange(null);
              }}
              className="h-10"
            >
              Remove
            </Button>
          </div>

          {/* filename & size */}
          <div>
            {file ? (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">{file.name}</span>{" "}
                <span className="ml-2">— {formatBytes(file.size)}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Recommended: square image, max {formatBytes(maxSizeBytes)}.
              </p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Preview shown above. Image will be uploaded and stored on server
            storage.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================== Component ================== */
export function ProductManagement({
  onNavigateToDetails,
}: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [highlightedProduct, setHighlightedProduct] = useState<
    string | number | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Form data + image states
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    slug: "",
    description: "",
    category: "General",
    status: "Active",
    logo: "",
    dbName: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<ProductFormData>>({});

  // New: selected file for upload & preview (used for both add & edit)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // separate refs for add/edit inputs to avoid ref collision
  const fileInputAddRef = useRef<HTMLInputElement | null>(null);
  const fileInputEditRef = useRef<HTMLInputElement | null>(null);

  /* ========== Helpers ========== */
  // Format code: hanya huruf kapital A-Z dan angka 0-9 (hapus semua selain itu)
  const formatCode = (value: string) =>
    value.toUpperCase().replace(/[^A-Z0-9]/g, "");

  const validateForm = (data: ProductFormData): Partial<ProductFormData> => {
    const errors: Partial<ProductFormData> = {};
    if (!data.name.trim()) errors.name = "Product name is required";

    if (!data.slug.trim()) {
      errors.slug = "Code is required";
    } else {
      if (data.slug.length > 64) {
        errors.slug = "Code must be 64 characters or less";
      } else if (!/^[A-Z0-9]+$/.test(data.slug)) {
        errors.slug =
          "Code must contain only uppercase letters and numbers (A–Z, 0–9)";
      }
    }

    if (!data.description.trim())
      errors.description = "Description is required";
    if (data.description.length > 160)
      errors.description = "Description must be 160 characters or less";

    // db_name validations
    if (!data.dbName.trim()) {
      errors.dbName = "DB name is required";
    } else {
      if (data.dbName.length > 60) {
        errors.dbName = "DB name must be 60 characters or less";
      } else if (!/^[A-Za-z0-9_]+$/.test(data.dbName)) {
        errors.dbName =
          "DB name may only contain letters, numbers, and underscore (_)";
      }
    }
    return errors;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      category: "General",
      status: "Active",
      logo: "",
      dbName: "",
    });
    setFormErrors({});
    setImageFile(null);
    if (imagePreview && imagePreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(imagePreview);
      } catch {}
    }
    setImagePreview(null);

    if (fileInputAddRef.current) fileInputAddRef.current.value = "";
    if (fileInputEditRef.current) fileInputEditRef.current.value = "";
  };

  // handle file selection & preview with createObjectURL
  const handleFileChange = (file?: File | null) => {
    // revoke previous object url if we created one
    if (imagePreview && imagePreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(imagePreview);
      } catch {}
    }

    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    setImageFile(file);
    const blobUrl = URL.createObjectURL(file);
    setImagePreview(blobUrl);
  };

  const mapRowToProduct = (row: any): Product => {
    const apiBase = API_URL.replace(/\/api\/?$/i, "");
    const logoUrl = `${apiBase}${row.image_url}`;

    return {
      id: row.id,
      name: row.product_name ?? row.name ?? row.product_code ?? "Product",
      slug: row.product_code ?? row.slug ?? "",
      description: row.description ?? "",
      logo: logoUrl,
      category: row.category ?? "General",
      status: (row.status as any) ?? "Active",
      dbName: row.db_name ?? "",
      totalCustomers: 0,
      monthlyRevenue: 0,
      rating: 0,
      createdAt: (row.created_at ?? "").toString().slice(0, 10),
      updatedAt: (row.upstream_updated_at ?? row.updated_at ?? "")
        .toString()
        .slice(0, 10),
    };
  };

  const loadProducts = async (q?: string) => {
    setLoading(true);
    try {
      const json = await listPanelCatalogProducts(q, 200);
      const arr = Array.isArray(json?.data) ? json.data : [];
      setProducts(arr.map(mapRowToProduct));
    } catch (e: any) {
      console.error("Failed to load products:", e?.message || e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    loadProducts();
    // cleanup blob urls on unmount
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(imagePreview);
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ========== Actions ========== */
  const handleAddProduct = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    try {
      const fd = new FormData();
      fd.append("product_code", formData.slug);
      fd.append("product_name", formData.name);
      if (formData.category) fd.append("category", formData.category);
      fd.append("status", formData.status || "Active");
      if (formData.description) fd.append("description", formData.description);
      fd.append("db_name", formData.dbName || "");
      if (imageFile) fd.append("image", imageFile);

      await createProductPanel(fd);

      setIsAddModalOpen(false);
      resetForm();
      await loadProducts();

      const just = formData.slug;
      setHighlightedProduct(just);
      setTimeout(() => setHighlightedProduct(null), 2000);
    } catch (e: any) {
      console.error("Create product failed:", e?.message || e);
      alert(e?.message || "Create product failed");
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("product_name", formData.name);
      if (formData.category) fd.append("category", formData.category);
      fd.append("status", formData.status || "Active");
      if (formData.description) fd.append("description", formData.description);
      fd.append("db_name", formData.dbName || "");
      if (imageFile) fd.append("image", imageFile);

      await updateProductPanel(editingProduct.id, fd);

      setIsEditModalOpen(false);
      setEditingProduct(null);
      resetForm();
      await loadProducts();

      setHighlightedProduct(editingProduct.id);
      setTimeout(() => setHighlightedProduct(null), 2000);
    } catch (e: any) {
      console.error("Update product failed:", e?.message || e);
      alert(e?.message || "Update product failed");
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug, // product_code
      description: product.description,
      category: product.category,
      status: ["Active", "Draft", "Archived"].includes(product.status)
        ? (product.status as any)
        : "Active",
      logo: product.logo ?? "",
      dbName: product.dbName ?? "",
    });

    // set preview to existing URL if available (no file selected yet)
    setImageFile(null);
    setImagePreview(product.logo || null);
    if (fileInputEditRef.current) fileInputEditRef.current.value = "";
    setIsEditModalOpen(true);
  };

  const handleViewDetails = async (product: Product) => {
    if (onNavigateToDetails) {
      onNavigateToDetails(product.slug);
    }
  };

  const handleImportSync = async () => {
    setSyncing(true);
    try {
      await loadProducts();
    } catch (e: any) {
      console.error("Sync failed:", e?.message || e);
      alert(e?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  /* ========== UI helpers (tidak diubah) ========== */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Active
          </Badge>
        );
      case "Draft":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Draft
          </Badge>
        );
      case "Archived":
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            Archived
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ================== RENDER ================== */
  return (
    <div className="space-y-6">
      {/* Header – responsive: tombol di bawah deskripsi saat mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Products
          </h1>
          <p className="text-muted-foreground">Manage your product catalog</p>

          {/* MOBILE: tombol di bawah deskripsi */}
          <div className="mt-3 flex gap-2 sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportSync}
              disabled={syncing}
            >
              <Upload className="h-4 w-4 mr-2" />
              {syncing ? "Importing..." : "Import"}
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 glow-primary"
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* DESKTOP/TABLET: tombol tetap di kanan */}
        <div className="hidden sm:flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportSync}
            disabled={syncing}
          >
            <Upload className="h-4 w-4 mr-2" />
            {syncing ? "Importing..." : "Import"}
          </Button>
          <Button
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 glow-primary"
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Add Product Modal (satu saja, dibuka via state dari tombol manapun) */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={(v) => {
          if (v) resetForm();
          setIsAddModalOpen(v);
        }}
      >
        <DialogContent className="w-full max-w-[500px] rounded-xl p-0 bg-white dark:bg-slate-900 border-0 shadow-2xl">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <DialogTitle className="text-lg font-bold text-[#5B21B6] dark:text-purple-400">
                  ➕ Add New Product
                </DialogTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Create a new product in your catalog
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-[#374151] dark:text-gray-300"
              >
                Product Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData((prev) => ({ ...prev, name }));
                  if (formErrors.name)
                    setFormErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className={`border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]`}
                placeholder="Enter product name"
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label
                htmlFor="slug"
                className="text-sm font-medium text-[#374151] dark:text-gray-300"
              >
                Code (A–Z, 0–9 only) *
              </Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => {
                  const val = formatCode(e.target.value);
                  setFormData((prev) => ({ ...prev, slug: val }));
                  if (formErrors.slug)
                    setFormErrors((prev) => ({ ...prev, slug: undefined }));
                }}
                className={`border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]`}
                placeholder="PRODUCTCODE"
              />
              {formErrors.slug && (
                <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>
              )}
            </div>

            {/* DB Name */}
            <div className="space-y-2">
              <Label
                htmlFor="dbName"
                className="text-sm font-medium text-[#374151] dark:text-gray-300"
              >
                DB Name *
              </Label>
              <Input
                id="dbName"
                value={formData.dbName}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, dbName: e.target.value }));
                  if (formErrors.dbName)
                    setFormErrors((prev) => ({ ...prev, dbName: undefined }));
                }}
                className={`border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]`}
                placeholder="my_product_db"
              />
              <p className="text-xs text-muted-foreground">
                Only letters, numbers, and underscore. Max 60 chars.
              </p>
              {formErrors.dbName && (
                <p className="text-red-500 text-xs mt-1">{formErrors.dbName}</p>
              )}
            </div>

            {/* Product Image (ADD) */}
            <ImageUploader
              label="Product Image"
              previewUrl={imagePreview}
              file={imageFile}
              inputId="product-image-add"
              inputRef={fileInputAddRef}
              onFileChange={(f) => handleFileChange(f ?? null)}
              maxSizeBytes={2 * 1024 * 1024}
            />

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-[#374151] dark:text-gray-300"
              >
                Short Description (max 160 chars)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }));
                  if (formErrors.description)
                    setFormErrors((prev) => ({
                      ...prev,
                      description: undefined,
                    }));
                }}
                className={`border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#7C3AED]`}
                maxLength={160}
                rows={3}
                placeholder="Brief description of your product"
              />
              <div className="flex justify-between items-center text-xs">
                {formErrors.description && (
                  <p className="text-red-500">{formErrors.description}</p>
                )}
                <p
                  className={`ml-auto ${
                    formData.description.length > 160
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {formData.description.length}/160
                </p>
              </div>
            </div>

            {/* Category + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-300">
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger className="border border-[#E5E7EB] rounded-lg px-3 py-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 rounded-lg shadow-xl">
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Business Management">
                      Business Management
                    </SelectItem>
                    <SelectItem value="HR Management">HR Management</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-300">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "Active" | "Draft" | "Archived") =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="border border-[#E5E7EB] rounded-lg px-3 py-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 rounded-lg shadow-xl">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAddProduct}
                className="flex-1 h-11 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white font-bold text-sm rounded-lg"
              >
                Add Product
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="h-11 px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-morphism bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-lg">
                <PackageIcon className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="font-semibold">{products.length}</p>
                <p className="text-xs text-green-400">
                  {loading ? "Loading..." : "All active"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="font-semibold">
                  {products
                    .reduce((sum, p) => sum + p.totalCustomers, 0)
                    .toLocaleString()}
                </p>
                <p className="text-xs text-green-400">+12% growth</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="font-semibold">
                  $
                  {products
                    .reduce((sum, p) => sum + p.monthlyRevenue, 0)
                    .toLocaleString()}
                </p>
                <p className="text-xs text-green-400">+18% vs last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-morphism bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg">
                <Star className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="font-semibold">
                  {products.length > 0
                    ? (
                        products.reduce((sum, p) => sum + p.rating, 0) /
                        products.length
                      ).toFixed(1)
                    : "0.0"}
                </p>
                <p className="text-xs text-green-400">Excellent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50"
          />
        </div>
      </div>

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <Card className="glass-morphism bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border-purple-500/20">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">
              {loading ? "Loading..." : "No products yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              Get started by adding your first product
            </p>
            <Button
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className={`glass-morphism bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border-purple-500/20 hover:border-purple-500/30 transition-all duration-300 ${
                highlightedProduct === product.id ||
                highlightedProduct === product.slug
                  ? "ring-2 ring-purple-500/50 glow-accent"
                  : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded overflow-hidden flex items-center justify-center bg-white/60">
                      {product.logo ? (
                        <img
                          src={product.logo}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-3xl">📦</div>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(product.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Customers</p>
                    <p className="font-semibold text-blue-400">
                      {product.totalCustomers.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-semibold text-green-400">
                      ${product.monthlyRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rating</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{product.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Quick Info</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Category: {product.category}</span>
                    <span>DB: {product.dbName || "—"}</span>
                    <span>Updated: {product.updatedAt}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
                    onClick={() => handleViewDetails(product)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-background/50 hover:bg-purple-500/10"
                    onClick={() => openEditModal(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-full max-w-[500px] rounded-xl p-0 bg-white dark:bg-slate-900 border-0 shadow-2xl">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✏️</span>
              <div>
                <DialogTitle className="text-lg font-bold text-[#5B21B6] dark:text-purple-400">
                  Edit Product
                </DialogTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Update your product details
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label
                htmlFor="edit-name"
                className="text-sm font-medium text-[#374151] dark:text-gray-300"
              >
                Product Name *
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData((prev) => ({ ...prev, name }));
                  if (formErrors.name)
                    setFormErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className="border border-[#E5E7EB] rounded-lg px-3 py-2"
                placeholder="Enter product name"
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Slug (disabled) */}
            <div className="space-y-2">
              <Label
                htmlFor="edit-slug"
                className="text-sm font-medium text-[#374151] dark:text-gray-300"
              >
                Code (A–Z, 0–9 only) *
              </Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                disabled
                className="border border-[#E5E7EB] rounded-lg px-3 py-2"
              />
              <p className="text-xs text-muted-foreground">
                Product code tidak bisa diubah.
              </p>
            </div>

            {/* DB Name */}
            <div className="space-y-2">
              <Label
                htmlFor="edit-dbName"
                className="text-sm font-medium text-[#374151] dark:text-gray-300"
              >
                DB Name *
              </Label>
              <Input
                id="edit-dbName"
                value={formData.dbName}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, dbName: e.target.value }));
                  if (formErrors.dbName)
                    setFormErrors((prev) => ({ ...prev, dbName: undefined }));
                }}
                className="border border-[#E5E7EB] rounded-lg px-3 py-2"
                placeholder="my_product_db"
              />
              <p className="text-xs text-muted-foreground">
                Only letters, numbers, and underscore. Max 60 chars.
              </p>
              {formErrors.dbName && (
                <p className="text-red-500 text-xs mt-1">{formErrors.dbName}</p>
              )}
            </div>

            {/* Product Image (EDIT) */}
            <ImageUploader
              label="Product Image"
              previewUrl={imagePreview}
              file={imageFile}
              inputId="product-image-edit"
              inputRef={fileInputEditRef}
              onFileChange={(f) => handleFileChange(f ?? null)}
              maxSizeBytes={2 * 1024 * 1024}
            />

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="edit-description"
                className="text-sm font-medium text-[#374151] dark:text-gray-300"
              >
                Short Description (max 160 chars)
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }));
                  if (formErrors.description)
                    setFormErrors((prev) => ({
                      ...prev,
                      description: undefined,
                    }));
                }}
                className="border border-[#E5E7EB] rounded-lg px-3 py-2 resize-none"
                maxLength={160}
                rows={3}
                placeholder="Brief description of your product"
              />
              <div className="flex justify-between items-center text-xs">
                {formErrors.description && (
                  <p className="text-red-500">{formErrors.description}</p>
                )}
                <p
                  className={`ml-auto ${
                    formData.description.length > 160
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {formData.description.length}/160
                </p>
              </div>
            </div>

            {/* Category + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-300">
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger className="border border-[#E5E7EB] rounded-lg px-3 py-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 rounded-lg shadow-xl">
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Business Management">
                      Business Management
                    </SelectItem>
                    <SelectItem value="HR Management">HR Management</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#374151] dark:text-gray-300">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "Active" | "Draft" | "Archived") =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="border border-[#E5E7EB] rounded-lg px-3 py-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 rounded-lg shadow-xl">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleEditProduct}
                className="flex-1 h-11 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] text-white font-bold text-sm rounded-lg"
              >
                Save Changes
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                  resetForm();
                }}
                className="h-11 px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
