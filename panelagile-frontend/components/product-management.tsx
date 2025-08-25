"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PackageIcon, Plus, Search, Edit, Eye, Star, DollarSign, Users, Upload } from "lucide-react"
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
} from "lucide-react"

interface Product {
  id: string
  name: string
  slug: string
  description: string
  logo: string
  category: string
  status: "Active" | "Draft" | "Archived"
  totalCustomers: number
  monthlyRevenue: number
  rating: number
  createdAt: string
  updatedAt: string
}

interface Feature {
  id: string
  name: string
  description: string
  icon: string
  productId: string
}

interface Module {
  id: string
  name: string
  description: string
  icon: string
  productId: string
  menus: Menu[]
}

interface Menu {
  id: string
  name: string
  description: string
  moduleId: string
}

interface Package {
  id: string
  name: string
  description: string
  color: string
  features: string[]
  durations: Duration[]
}

interface Duration {
  id: string
  name: string
  months: number
  packagePricing: { [packageId: string]: number }
}

const mockProducts: Product[] = [
  {
    id: "rentvix-pro",
    name: "RentVix Pro",
    slug: "rentvix-pro",
    description: "Complete rental management system for vehicle rental businesses",
    logo: "🚗",
    category: "Business Management",
    status: "Active",
    totalCustomers: 1247,
    monthlyRevenue: 89400,
    rating: 4.8,
    createdAt: "2024-01-15",
    updatedAt: "2024-03-10",
  },
  {
    id: "absen-pro",
    name: "Absen Pro",
    slug: "absen-pro",
    description: "Advanced attendance and payroll management system",
    logo: "👥",
    category: "HR Management",
    status: "Active",
    totalCustomers: 892,
    monthlyRevenue: 45600,
    rating: 4.7,
    createdAt: "2024-02-20",
    updatedAt: "2024-03-08",
  },
]

interface ProductFormData {
  name: string
  slug: string
  description: string
  category: string
  status: "Active" | "Draft" | "Archived"
  logo: string
}

interface ProductManagementProps {
  onNavigateToDetails?: (productSlug: string) => void
}

export function ProductManagement({ onNavigateToDetails }: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [highlightedProduct, setHighlightedProduct] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    slug: "",
    description: "",
    category: "General",
    status: "Active",
    logo: "",
  })
  const [formErrors, setFormErrors] = useState<Partial<ProductFormData>>({})

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const validateForm = (data: ProductFormData): Partial<ProductFormData> => {
    const errors: Partial<ProductFormData> = {}
    if (!data.name.trim()) errors.name = "Product name is required"
    if (!data.slug.trim()) errors.slug = "Slug is required"
    if (!data.description.trim()) errors.description = "Description is required"
    if (data.description.length > 160) errors.description = "Description must be 160 characters or less"
    return errors
  }

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      category: "General",
      status: "Active",
      logo: "",
    })
    setFormErrors({})
  }

  const handleAddProduct = () => {
    const errors = validateForm(formData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const newProduct: Product = {
      id: Date.now().toString(),
      ...formData,
      totalCustomers: 0,
      monthlyRevenue: 0,
      rating: 0,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    }

    setProducts((prev) => [newProduct, ...prev])
    setIsAddModalOpen(false)
    resetForm()

    // Highlight new product for 2 seconds
    setHighlightedProduct(newProduct.id)
    setTimeout(() => setHighlightedProduct(null), 2000)
  }

  const handleEditProduct = () => {
    if (!editingProduct) return

    const errors = validateForm(formData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === editingProduct.id ? { ...p, ...formData, updatedAt: new Date().toISOString().split("T")[0] } : p,
      ),
    )

    setIsEditModalOpen(false)
    setEditingProduct(null)
    resetForm()

    // Highlight updated product for 2 seconds
    setHighlightedProduct(editingProduct.id)
    setTimeout(() => setHighlightedProduct(null), 2000)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: product.category,
      status: product.status,
      logo: product.logo,
    })
    setIsEditModalOpen(true)
  }

  const handleViewDetails = (product: Product) => {
    if (onNavigateToDetails) {
      onNavigateToDetails(product.slug)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
      case "Draft":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Draft</Badge>
      case "Archived":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Archived</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPackageColor = (packageId: string) => {
    switch (packageId) {
      case "starter":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      case "medium":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "professional":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      MessageSquare,
      Mail,
      FileSpreadsheet,
      FileText,
      BarChart3,
      Building,
      MapPin,
      Bell,
      UserCheck,
      ClipboardList,
      Calendar,
      Calculator,
      UserCog,
      Banknote,
      Car,
      Receipt,
    }
    const IconComponent = icons[iconName] || PackageIcon
    return <IconComponent className="h-4 w-4" />
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Products
          </h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 glow-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-[500px] rounded-xl p-0 bg-white dark:bg-slate-900 border-0 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl">
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
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-[#374151] dark:text-gray-300">
                    Product Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value
                      setFormData((prev) => ({
                        ...prev,
                        name,
                        slug: generateSlug(name),
                      }))
                      if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }))
                    }}
                    className={`border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200 ${
                      formErrors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                    placeholder="Enter product name"
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-medium text-[#374151] dark:text-gray-300">
                    Slug/Code *
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                      if (formErrors.slug) setFormErrors((prev) => ({ ...prev, slug: undefined }))
                    }}
                    className={`border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200 ${
                      formErrors.slug ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                    placeholder="product-slug"
                  />
                  {formErrors.slug && <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-[#374151] dark:text-gray-300">
                    Short Description (max 160 chars)
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                      if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: undefined }))
                    }}
                    className={`border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200 resize-none ${
                      formErrors.description ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                    maxLength={160}
                    rows={3}
                    placeholder="Brief description of your product"
                  />
                  <div className="flex justify-between items-center text-xs">
                    {formErrors.description && <p className="text-red-500">{formErrors.description}</p>}
                    <p className={`ml-auto ${formData.description.length > 160 ? "text-red-500" : "text-gray-500"}`}>
                      {formData.description.length}/160
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-[#374151] dark:text-gray-300">
                    Category
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Business Management">Business Management</SelectItem>
                      <SelectItem value="HR Management">HR Management</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-[#374151] dark:text-gray-300">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "Active" | "Draft" | "Archived") =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleAddProduct}
                    className="flex-1 h-11 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:from-purple-700 hover:to-blue-700 text-white font-bold text-sm rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Add Product
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsAddModalOpen(false)
                      resetForm()
                    }}
                    className="h-11 px-6 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
                <p className="text-xs text-green-400">All active</p>
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
                  {products.reduce((sum, p) => sum + p.totalCustomers, 0).toLocaleString()}
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
                  ${products.reduce((sum, p) => sum + p.monthlyRevenue, 0).toLocaleString()}
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
                    ? (products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1)
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
            <h3 className="text-xl font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-6">Get started by adding your first product</p>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className={`glass-morphism bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border-purple-500/20 hover:border-purple-500/30 transition-all duration-300 ${
                highlightedProduct === product.id ? "ring-2 ring-purple-500/50 glow-accent" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{product.logo || "📦"}</div>
                    <div>
                      <CardTitle className="text-xl">{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(product.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Customers</p>
                    <p className="font-semibold text-blue-400">{product.totalCustomers.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-semibold text-green-400">${product.monthlyRevenue.toLocaleString()}</p>
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
                    <span>Updated: {product.updatedAt}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
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
        <DialogContent className="w-full max-w-[500px] rounded-xl p-0 bg-white dark:bg-slate-900 border-0 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✏️</span>
              <div>
                <DialogTitle className="text-lg font-bold text-[#5B21B6] dark:text-purple-400">
                  ✏️ Edit Product
                </DialogTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update your product details</p>
              </div>
            </div>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium text-[#374151] dark:text-gray-300">
                Product Name *
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value
                  setFormData((prev) => ({
                    ...prev,
                    name,
                    slug: generateSlug(name),
                  }))
                  if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }))
                }}
                className={`border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200 ${
                  formErrors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                }`}
                placeholder="Enter product name"
              />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-slug" className="text-sm font-medium text-[#374151] dark:text-gray-300">
                Slug/Code *
              </Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  if (formErrors.slug) setFormErrors((prev) => ({ ...prev, slug: undefined }))
                }}
                className={`border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200 ${
                  formErrors.slug ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                }`}
                placeholder="product-slug"
              />
              {formErrors.slug && <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-medium text-[#374151] dark:text-gray-300">
                Short Description (max 160 chars)
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                  if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: undefined }))
                }}
                className={`border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200 resize-none ${
                  formErrors.description ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                }`}
                maxLength={160}
                rows={3}
                placeholder="Brief description of your product"
              />
              <div className="flex justify-between items-center text-xs">
                {formErrors.description && <p className="text-red-500">{formErrors.description}</p>}
                <p className={`ml-auto ${formData.description.length > 160 ? "text-red-500" : "text-gray-500"}`}>
                  {formData.description.length}/160
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category" className="text-sm font-medium text-[#374151] dark:text-gray-300">
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Business Management">Business Management</SelectItem>
                  <SelectItem value="HR Management">HR Management</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status" className="text-sm font-medium text-[#374151] dark:text-gray-300">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: "Active" | "Draft" | "Archived") =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="border border-[#E5E7EB] dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleEditProduct}
                className="flex-1 h-11 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:from-purple-700 hover:to-blue-700 text-white font-bold text-sm rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Save Changes
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingProduct(null)
                  resetForm()
                }}
                className="h-11 px-6 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
