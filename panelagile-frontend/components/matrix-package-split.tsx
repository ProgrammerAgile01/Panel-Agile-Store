"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { toast } from "@/hooks/use-toast"
import React from "react"
import {
  PackageIcon,
  Search,
  Download,
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
  Info,
  Copy,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Loader2,
  ChevronRight,
} from "lucide-react"

interface Product {
  id: string
  name: string
  description: string
  icon: any
  status: "active" | "inactive"
  packages: Package[]
  features: Feature[]
}

interface Package {
  id: string
  name: string
  status: "active" | "archived"
  price: number
}

interface Feature {
  id: string
  name: string
  module: string
  type: "feature" | "menu"
  icon: any
  description?: string
  dependencies?: string[]
  subpath?: string
}

interface MatrixCell {
  enabled: boolean
  isDraft?: boolean
}

interface BulkAction {
  type: "enable" | "disable" | "rule"
  featureIds: string[]
  packageIds?: string[]
  rule?: string
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
      { id: "professional", name: "Professional", status: "active", price: 149 },
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
]

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
}

export function MatrixPackageSplit() {
  const [selectedProduct, setSelectedProduct] = useState<Product>(mockProducts[0])
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [viewMode, setViewMode] = useState<"features" | "menus">("features")
  const [filterMode, setFilterMode] = useState("all")
  const [groupByModule, setGroupByModule] = useState(true)
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false)
  const [compactDensity, setCompactDensity] = useState(false)
  const [matrixData, setMatrixData] = useState(initialMatrix)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const hasChanges = Object.values(matrixData[selectedProduct.id] || {}).some((cell) => cell.isDraft)

  const filteredFeatures = selectedProduct.features.filter((feature) => {
    if (viewMode === "features" && feature.type !== "feature") return false
    if (viewMode === "menus" && feature.type !== "menu") return false

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase()
      return feature.name.toLowerCase().includes(searchLower) || feature.module.toLowerCase().includes(searchLower)
    }

    return true
  })

  const filteredPackages = selectedProduct.packages.filter((pkg) => {
    if (filterMode === "active" && pkg.status !== "active") return false
    if (filterMode === "archived" && pkg.status !== "archived") return false
    return true
  })

  const groupedFeatures = groupByModule
    ? filteredFeatures.reduce(
        (acc, feature) => {
          if (!acc[feature.module]) acc[feature.module] = []
          acc[feature.module].push(feature)
          return acc
        },
        {} as Record<string, Feature[]>,
      )
    : { "All Features": filteredFeatures }

  const finalGroupedFeatures = showOnlyDifferences
    ? Object.entries(groupedFeatures).reduce(
        (acc, [module, features]) => {
          const filteredFeatures = features.filter((feature) => {
            const values = filteredPackages.map(
              (pkg) => matrixData[selectedProduct.id]?.[`${feature.id}-${pkg.id}`]?.enabled || false,
            )
            return !values.every((val) => val === values[0])
          })
          if (filteredFeatures.length > 0) {
            acc[module] = filteredFeatures
          }
          return acc
        },
        {} as Record<string, Feature[]>,
      )
    : groupedFeatures

  const toggleFeature = useCallback(
    (featureId: string, packageId: string) => {
      const key = `${featureId}-${packageId}`
      const productKey = selectedProduct.id

      setMatrixData((prev) => ({
        ...prev,
        [productKey]: {
          ...prev[productKey],
          [key]: {
            enabled: !prev[productKey]?.[key]?.enabled,
            isDraft: true,
          },
        },
      }))
    },
    [selectedProduct.id],
  )

  const toggleEntireRow = useCallback(
    (featureId: string, enabled: boolean) => {
      const productKey = selectedProduct.id
      const updates: Record<string, MatrixCell> = {}

      filteredPackages.forEach((pkg) => {
        const key = `${featureId}-${pkg.id}`
        updates[key] = { enabled, isDraft: true }
      })

      setMatrixData((prev) => ({
        ...prev,
        [productKey]: { ...prev[productKey], ...updates },
      }))
    },
    [selectedProduct.id, filteredPackages],
  )

  const toggleEntireColumn = useCallback(
    (packageId: string, enabled: boolean) => {
      const productKey = selectedProduct.id
      const updates: Record<string, MatrixCell> = {}

      filteredFeatures.forEach((feature) => {
        const key = `${feature.id}-${packageId}`
        updates[key] = { enabled, isDraft: true }
      })

      setMatrixData((prev) => ({
        ...prev,
        [productKey]: { ...prev[productKey], ...updates },
      }))
    },
    [selectedProduct.id, filteredFeatures],
  )

  const applyBulkAction = useCallback(
    (action: BulkAction) => {
      const productKey = selectedProduct.id
      const updates: Record<string, MatrixCell> = {}

      action.featureIds.forEach((featureId) => {
        const packages = action.packageIds || filteredPackages.map((p) => p.id)
        packages.forEach((packageId) => {
          const key = `${featureId}-${packageId}`
          updates[key] = {
            enabled: action.type === "enable",
            isDraft: true,
          }
        })
      })

      setMatrixData((prev) => ({
        ...prev,
        [productKey]: { ...prev[productKey], ...updates },
      }))

      setSelectedRows([])
      toast({
        title: "Bulk action applied",
        description: `${action.type === "enable" ? "Enabled" : "Disabled"} ${action.featureIds.length} features`,
      })
    },
    [selectedProduct.id, filteredPackages],
  )

  const saveChanges = useCallback(async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Remove draft flags
      const productKey = selectedProduct.id
      const cleanedData = Object.entries(matrixData[productKey] || {}).reduce(
        (acc, [key, cell]) => {
          acc[key] = { enabled: cell.enabled, isDraft: false }
          return acc
        },
        {} as Record<string, MatrixCell>,
      )

      setMatrixData((prev) => ({
        ...prev,
        [productKey]: cleanedData,
      }))

      toast({
        title: "Matrix saved",
        description: "Feature matrix has been successfully updated",
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save matrix changes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [selectedProduct.id, matrixData])

  const exportCSV = useCallback(() => {
    const rows = [["type", "group", "name", "package", "enabled"]]

    Object.entries(finalGroupedFeatures).forEach(([module, features]) => {
      features.forEach((feature) => {
        filteredPackages.forEach((pkg) => {
          const key = `${feature.id}-${pkg.id}`
          const enabled = matrixData[selectedProduct.id]?.[key]?.enabled ? "1" : "0"
          rows.push([feature.type, module, feature.name, pkg.name, enabled])
        })
      })
    })

    const csvContent = rows.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedProduct.name}-matrix.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "CSV exported",
      description: "Matrix data has been exported successfully",
    })
  }, [selectedProduct, finalGroupedFeatures, filteredPackages, matrixData])

  const checkDependencies = useCallback(
    (feature: Feature): boolean => {
      if (!feature.dependencies) return true

      return feature.dependencies.every((depId) => {
        const depFeature = selectedProduct.features.find((f) => f.id === depId)
        if (!depFeature) return true

        return filteredPackages.some((pkg) => {
          const key = `${depId}-${pkg.id}`
          return matrixData[selectedProduct.id]?.[key]?.enabled
        })
      })
    },
    [selectedProduct, filteredPackages, matrixData],
  )

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
          const IconComponent = product.icon
          const isSelected = selectedProduct.id === product.id

          return (
            <button
              key={product.id}
              onClick={() => {
                setSelectedProduct(product)
                setMobileDrawerOpen(false)
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
                <IconComponent className={`h-5 w-5 ${isSelected ? "text-slate-100" : "text-slate-300"}`} />
              </div>

              <div className="flex-1 text-left min-w-0">
                <h3
                  className={`font-semibold text-sm leading-tight truncate ${
                    isSelected ? "text-slate-100" : "text-slate-200 group-hover:text-slate-100"
                  }`}
                >
                  {product.name}
                </h3>
                <p className="text-xs text-slate-400 truncate mt-0.5">{product.description}</p>
              </div>

              <Badge variant={product.status === "active" ? "default" : "secondary"} className="text-xs flex-shrink-0">
                {product.status}
              </Badge>
            </button>
          )
        })}
      </div>

      <div className="p-3 border-t border-slate-700/50">
        <Button className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-slate-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>
    </div>
  )

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
            <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileDrawerOpen(false)} />
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
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setMobileDrawerOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">Matrix Packages for {selectedProduct.name}</h1>
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
                    viewMode === "features" ? "bg-primary text-primary-foreground" : "hover:bg-muted-foreground/10"
                  }`}
                  onClick={() => setViewMode("features")}
                >
                  Features
                </button>
                <button
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === "menus" ? "bg-primary text-primary-foreground" : "hover:bg-muted-foreground/10"
                  }`}
                  onClick={() => setViewMode("menus")}
                >
                  Menus
                </button>
              </div>

              {/* Filter Chips */}
              <div className="flex gap-2">
                {["all", "active", "inactive"].map((filter) => (
                  <Button
                    key={filter}
                    variant={filterMode === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterMode(filter)}
                    className="capitalize"
                  >
                    {filter}
                  </Button>
                ))}
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={groupByModule} onCheckedChange={setGroupByModule} id="group-by-module" />
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
              <Button variant="ghost" onClick={() => setCompactDensity(!compactDensity)}>
                {compactDensity ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>

              <Button variant="ghost">
                <Copy className="h-4 w-4 mr-2" />
                Copy from template...
              </Button>

              <Button variant="outline" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>

              <Button
                onClick={saveChanges}
                disabled={!hasChanges || isSaving}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg"
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
                {hasChanges && <div className="w-2 h-2 bg-accent rounded-full ml-2" />}
              </Button>
            </div>
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedRows.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/10 border-b border-primary/20">
              <span className="text-sm font-medium">{selectedRows.length} rows selected</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => applyBulkAction({ type: "enable", featureIds: selectedRows })}>
                  Enable in selected packages
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => applyBulkAction({ type: "disable", featureIds: selectedRows })}
                >
                  Disable in selected packages
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedRows([])}>
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
                  Create packages first to manage the feature matrix.
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
                  Please load from API in Features & Menus.
                </p>
                <Button>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Go to Features & Menus
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-card/95 backdrop-blur-xl z-10">
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card/95 backdrop-blur-xl z-20 min-w-[300px]">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedRows.length === filteredFeatures.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRows(filteredFeatures.map((f) => f.id))
                            } else {
                              setSelectedRows([])
                            }
                          }}
                        />
                        Features / Menus
                      </div>
                    </TableHead>
                    {filteredPackages.map((pkg) => (
                      <TableHead key={pkg.id} className="text-center min-w-[120px]">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{pkg.name}</span>
                            <Badge variant={pkg.status === "active" ? "default" : "secondary"} className="text-xs">
                              {pkg.status}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-6 px-2"
                                  onClick={() => {
                                    const allEnabled = filteredFeatures.every(
                                      (feature) => matrixData[selectedProduct.id]?.[`${feature.id}-${pkg.id}`]?.enabled,
                                    )
                                    toggleEntireColumn(pkg.id, !allEnabled)
                                  }}
                                >
                                  {filteredFeatures.every(
                                    (feature) => matrixData[selectedProduct.id]?.[`${feature.id}-${pkg.id}`]?.enabled,
                                  )
                                    ? "Disable all"
                                    : "Enable all"}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Toggle all features in this package</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(finalGroupedFeatures).map(([module, features]) => (
                    <React.Fragment key={`module-group-${module}`}>
                      {groupByModule && (
                        <TableRow key={`module-${module}`} className="bg-muted/30">
                          <TableCell
                            colSpan={filteredPackages.length + 1}
                            className="sticky left-0 bg-muted/30 backdrop-blur-xl z-10 font-semibold text-primary"
                          >
                            {module}
                          </TableCell>
                        </TableRow>
                      )}
                      {features.map((feature, index) => {
                        const IconComponent = feature.icon
                        const isSelected = selectedRows.includes(feature.id)
                        const hasDependencyIssues = !checkDependencies(feature)

                        return (
                          <TableRow
                            key={feature.id}
                            className={`hover:bg-muted/20 ${compactDensity ? "h-12" : "h-16"} ${
                              index % 2 === 0 ? "bg-card/20" : "bg-transparent"
                            } ${isSelected ? "bg-primary/10" : ""}`}
                          >
                            <TableCell className="sticky left-0 bg-inherit backdrop-blur-xl z-10">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedRows([...selectedRows, feature.id])
                                      } else {
                                        setSelectedRows(selectedRows.filter((id) => id !== feature.id))
                                      }
                                    }}
                                  />
                                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <IconComponent className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {feature.type}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        {feature.module}
                                      </Badge>
                                    </div>
                                    <button
                                      className="font-medium text-left hover:text-primary transition-colors"
                                      onClick={() => {
                                        setSelectedFeature(feature)
                                        setDetailDrawerOpen(true)
                                      }}
                                    >
                                      {feature.subpath || feature.name}
                                    </button>
                                    {feature.description && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Info className="h-3 w-3 text-muted-foreground inline ml-1" />
                                        </TooltipTrigger>
                                        <TooltipContent>{feature.description}</TooltipContent>
                                      </Tooltip>
                                    )}
                                    {hasDependencyIssues && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <AlertTriangle className="h-3 w-3 text-amber-500 inline ml-1" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Missing dependencies: {feature.dependencies?.join(", ")}
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-6 px-2 flex-shrink-0"
                                  onClick={() => {
                                    const allEnabled = filteredPackages.every(
                                      (pkg) => matrixData[selectedProduct.id]?.[`${feature.id}-${pkg.id}`]?.enabled,
                                    )
                                    toggleEntireRow(feature.id, !allEnabled)
                                  }}
                                >
                                  Toggle All
                                </Button>
                              </div>
                            </TableCell>
                            {filteredPackages.map((pkg) => {
                              const key = `${feature.id}-${pkg.id}`
                              const cell = matrixData[selectedProduct.id]?.[key]
                              const isEnabled = cell?.enabled || false
                              const isDraft = cell?.isDraft || false

                              return (
                                <TableCell key={pkg.id} className="text-center relative">
                                  <div className="flex items-center justify-center">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="relative">
                                          {isEnabled ? (
                                            <div className="w-8 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                              <Check className="h-3 w-3 text-white" />
                                            </div>
                                          ) : (
                                            <div className="w-8 h-6 bg-muted rounded-full flex items-center justify-center">
                                              <X className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                          )}
                                          {isDraft && (
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
                                          )}
                                          <button
                                            className="absolute inset-0 w-full h-full"
                                            onClick={() => toggleFeature(feature.id, pkg.id)}
                                            onKeyDown={(e) => {
                                              if (e.key === " ") {
                                                e.preventDefault()
                                                toggleFeature(feature.id, pkg.id)
                                              }
                                            }}
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {feature.name} in {pkg.name}: {isEnabled ? "Enabled" : "Disabled"}
                                        {isDraft && " (Draft)"}
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Detail Drawer */}
        <Sheet open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {selectedFeature?.icon && <selectedFeature.icon className="h-5 w-5" />}
                {selectedFeature?.name}
              </SheetTitle>
              <SheetDescription>
                {selectedFeature?.module} • {selectedFeature?.type}
              </SheetDescription>
            </SheetHeader>

            {selectedFeature && (
              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedFeature.description || "No description available"}
                  </p>
                </div>

                {selectedFeature.dependencies && (
                  <div>
                    <h4 className="font-medium mb-2">Dependencies</h4>
                    <div className="space-y-1">
                      {selectedFeature.dependencies.map((depId) => {
                        const dep = selectedProduct.features.find((f) => f.id === depId)
                        return (
                          <div key={depId} className="text-sm text-muted-foreground">
                            • {dep?.name || depId}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-3">Package Settings</h4>
                  <div className="space-y-3">
                    {filteredPackages.map((pkg) => {
                      const key = `${selectedFeature.id}-${pkg.id}`
                      const isEnabled = matrixData[selectedProduct.id]?.[key]?.enabled || false

                      return (
                        <div key={pkg.id} className="flex items-center justify-between">
                          <span className="text-sm">{pkg.name}</span>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => toggleFeature(selectedFeature.id, pkg.id)}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <Button className="w-full mt-4" onClick={() => setDetailDrawerOpen(false)}>
                    Apply Changes
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  )
}
