"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Save,
  Eye,
  Copy,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Trash2,
  AlertCircle,
  Info,
  DollarSign,
  Clock,
  Settings,
  Printer,
} from "lucide-react"

interface Product {
  id: string
  name: string
  description: string
  status: "active" | "inactive"
  packages: any[]
  durations: any[]
}

interface Package {
  id: string
  name: string
  description: string
  status: "active" | "inactive"
}

interface Duration {
  id: string
  name: string
  code: string
  months: number
  status: "active" | "inactive"
}

interface PriceItem {
  duration_id: string
  package_id: string
  price: number
  discount?: number
  min_billing_cycle?: number
  prorate?: boolean
  effective_start?: string
  effective_end?: string
}

interface PricelistData {
  currency: string
  tax_mode: "inclusive" | "exclusive"
  items: PriceItem[]
}

export function Pricelist() {
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchDuration, setSearchDuration] = useState("")
  const [viewMode, setViewMode] = useState<"simple" | "advanced">("simple")
  const [currency, setCurrency] = useState("IDR")
  const [taxMode, setTaxMode] = useState<"inclusive" | "exclusive">("inclusive")
  const [pricelistData, setPricelistData] = useState<PricelistData>({
    currency: "IDR",
    tax_mode: "inclusive",
    items: [],
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewOptions, setPreviewOptions] = useState({
    showPackages: "all" as "all" | "selected",
    selectedPackages: [] as string[],
    showLegend: true,
    scale: 100,
  })

  // Sample data
  const sampleProducts: any[] = [
    {
      id: "1",
      name: "SaaS Platform",
      description: "Complete business management platform",
      status: "active",
      packages: [
        { id: "starter", name: "Starter", description: "Basic features", status: "active" },
        { id: "medium", name: "Medium", description: "Advanced features", status: "active" },
        { id: "professional", name: "Professional", description: "Premium features", status: "active" },
      ],
      durations: [
        { id: "m1", name: "1 Bulan", code: "M1", months: 1, status: "active" },
        { id: "m6", name: "6 Bulan", code: "M6", months: 6, status: "active" },
        { id: "m12", name: "12 Bulan", code: "M12", months: 12, status: "active" },
      ],
    },
    {
      id: "2",
      name: "E-commerce Suite",
      description: "Online store management tools",
      status: "active",
      packages: [
        { id: "basic", name: "Basic", description: "Essential tools", status: "active" },
        { id: "pro", name: "Pro", description: "Professional tools", status: "active" },
      ],
      durations: [
        { id: "m1", name: "1 Bulan", code: "M1", months: 1, status: "active" },
        { id: "m3", name: "3 Bulan", code: "M3", months: 3, status: "active" },
        { id: "m12", name: "12 Bulan", code: "M12", months: 12, status: "active" },
      ],
    },
  ]

  // Sample pricing data
  const samplePricing: Record<string, PriceItem[]> = {
    "1": [
      { duration_id: "m1", package_id: "starter", price: 149000 },
      { duration_id: "m6", package_id: "starter", price: 799000 },
      { duration_id: "m12", package_id: "starter", price: 1499000 },
      { duration_id: "m1", package_id: "medium", price: 249000 },
      { duration_id: "m6", package_id: "medium", price: 1299000 },
      { duration_id: "m12", package_id: "medium", price: 2399000 },
      { duration_id: "m1", package_id: "professional", price: 399000 },
      { duration_id: "m6", package_id: "professional", price: 2199000 },
      { duration_id: "m12", package_id: "professional", price: 3999000 },
    ],
  }

  const [products] = useState<any[]>(sampleProducts)
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  useEffect(() => {
    if (selectedProduct && samplePricing[selectedProduct.id]) {
      setPricelistData({
        currency: "IDR",
        tax_mode: "inclusive",
        items: samplePricing[selectedProduct.id],
      })
    }
  }, [selectedProduct])

  const formatCurrency = (amount: number) => {
    if (currency === "IDR") {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount)
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getPrice = (durationId: string, packageId: string): number => {
    const item = pricelistData.items.find((item) => item.duration_id === durationId && item.package_id === packageId)
    return item?.price || 0
  }

  const updatePrice = (durationId: string, packageId: string, price: number) => {
    const newItems = [...pricelistData.items]
    const existingIndex = newItems.findIndex((item) => item.duration_id === durationId && item.package_id === packageId)

    if (existingIndex >= 0) {
      newItems[existingIndex] = { ...newItems[existingIndex], price }
    } else {
      newItems.push({ duration_id: durationId, package_id: packageId, price })
    }

    setPricelistData({ ...pricelistData, items: newItems })
    setHasUnsavedChanges(true)
  }

  const copyPackagePrices = (fromPackageId: string, toPackageId: string) => {
    if (!selectedProduct) return

    const newItems = [...pricelistData.items]
    selectedProduct.durations.forEach((duration) => {
      const sourcePrice = getPrice(duration.id, fromPackageId)
      if (sourcePrice > 0) {
        const existingIndex = newItems.findIndex(
          (item) => item.duration_id === duration.id && item.package_id === toPackageId,
        )

        if (existingIndex >= 0) {
          newItems[existingIndex] = { ...newItems[existingIndex], price: sourcePrice }
        } else {
          newItems.push({ duration_id: duration.id, package_id: toPackageId, price: sourcePrice })
        }
      }
    })

    setPricelistData({ ...pricelistData, items: newItems })
    setHasUnsavedChanges(true)
  }

  const adjustPackagePrices = (packageId: string, percentage: number) => {
    if (!selectedProduct) return

    const newItems = [...pricelistData.items]
    selectedProduct.durations.forEach((duration) => {
      const currentPrice = getPrice(duration.id, packageId)
      if (currentPrice > 0) {
        const newPrice = Math.round(currentPrice * (1 + percentage / 100))
        const existingIndex = newItems.findIndex(
          (item) => item.duration_id === duration.id && item.package_id === packageId,
        )

        if (existingIndex >= 0) {
          newItems[existingIndex] = { ...newItems[existingIndex], price: newPrice }
        }
      }
    })

    setPricelistData({ ...pricelistData, items: newItems })
    setHasUnsavedChanges(true)
  }

  const roundPackagePrices = (packageId: string, roundTo: number) => {
    if (!selectedProduct) return

    const newItems = [...pricelistData.items]
    selectedProduct.durations.forEach((duration) => {
      const currentPrice = getPrice(duration.id, packageId)
      if (currentPrice > 0) {
        const newPrice = Math.round(currentPrice / roundTo) * roundTo
        const existingIndex = newItems.findIndex(
          (item) => item.duration_id === duration.id && item.package_id === packageId,
        )

        if (existingIndex >= 0) {
          newItems[existingIndex] = { ...newItems[existingIndex], price: newPrice }
        }
      }
    })

    setPricelistData({ ...pricelistData, items: newItems })
    setHasUnsavedChanges(true)
  }

  const fillRow = (durationId: string, price: number) => {
    if (!selectedProduct) return

    const newItems = [...pricelistData.items]
    selectedProduct.packages.forEach((pkg) => {
      const existingIndex = newItems.findIndex((item) => item.duration_id === durationId && item.package_id === pkg.id)

      if (existingIndex >= 0) {
        newItems[existingIndex] = { ...newItems[existingIndex], price }
      } else {
        newItems.push({ duration_id: durationId, package_id: pkg.id, price })
      }
    })

    setPricelistData({ ...pricelistData, items: newItems })
    setHasUnsavedChanges(true)
  }

  const clearAll = () => {
    setPricelistData({ ...pricelistData, items: [] })
    setHasUnsavedChanges(true)
  }

  const fillEmptyWithZero = () => {
    if (!selectedProduct) return

    const newItems = [...pricelistData.items]
    selectedProduct.durations.forEach((duration) => {
      selectedProduct.packages.forEach((pkg) => {
        const existingPrice = getPrice(duration.id, pkg.id)
        if (existingPrice === 0) {
          newItems.push({ duration_id: duration.id, package_id: pkg.id, price: 0 })
        }
      })
    })

    setPricelistData({ ...pricelistData, items: newItems })
    setHasUnsavedChanges(true)
  }

  const handleSave = () => {
    console.log("Saving pricelist:", pricelistData)
    setHasUnsavedChanges(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const filteredDurations =
    selectedProduct?.durations.filter(
      (duration) =>
        duration.name.toLowerCase().includes(searchDuration.toLowerCase()) ||
        duration.code.toLowerCase().includes(searchDuration.toLowerCase()),
    ) || []

  return (
    <TooltipProvider>
      <div
        id="priceLayout"
        className="grid min-h-[calc(100vh-76px)]"
        style={{ gridTemplateColumns: "300px minmax(0,1fr)", gap: 0 }}
      >
        <aside
          id="priceSidebar"
          style={{
            position: "fixed",
            top: "76px",
            left: "0",
            height: "calc(100vh - 76px)",
            width: "300px",
            minWidth: "300px",
            maxWidth: "300px",
            overflowY: "auto",
            background: "#0F1116",
            color: "#fff",
            padding: "20px 20px 24px",
            zIndex: 10,
          }}
        >
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-lg font-semibold">Products</h2>
            <p className="text-sm/5 text-slate-300">Select a product to manage pricing</p>

            <div className="mt-1 w-full">
              <input
                className="w-full h-10 px-4 rounded-full bg-[#171923] text-slate-200 placeholder:text-slate-500 border border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="mt-2 flex flex-col gap-3 pb-6 w-full">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`w-full rounded-xl bg-[#1A1C22] hover:bg-[#1F222A] border border-white/5 p-4 cursor-pointer transition-all duration-200 ${
                    selectedProduct?.id === product.id
                      ? "ring-1 ring-violet-500/50 shadow-[0_0_0_3px_rgba(139,92,246,0.12)]"
                      : ""
                  }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="flex flex-col w-full">
                    <h3 className="text-[15px] font-semibold text-white">{product.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{product.description}</p>

                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${product.status === "active" ? "bg-green-500" : "bg-gray-500"}`}
                        />
                        <span className="capitalize">{product.status}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>📦</span>
                        <span>{product.packages.length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>⏱️</span>
                        <span>{product.durations.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section
          id="priceContent"
          className="min-w-0 bg-white dark:bg-slate-950 border-l border-slate-200/60 dark:border-slate-800"
          style={{
            marginLeft: "0",
            paddingLeft: "320px",
            minWidth: "100vw",
            width: "100vw",
            padding: "0 24px 24px 320px",
            overflowX: "hidden",
          }}
        >
          {!selectedProduct ? (
            <div className="flex items-center justify-center h-full px-6">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Select a Product</h3>
                <p className="text-muted-foreground mb-4">
                  Choose a product from the left panel to start managing its pricing matrix.
                </p>
              </div>
            </div>
          ) : !selectedProduct.packages.length || !selectedProduct.durations.length ? (
            <div className="flex items-center justify-center h-full px-6">
              <Card className="max-w-md mx-auto">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Packages or Durations not found</h3>
                  <p className="text-muted-foreground mb-6">
                    This product needs packages and durations before you can set up pricing.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        /* Navigate to Package Product */
                      }}
                      className="flex items-center gap-2"
                    >
                      <div className="h-4 w-4" />
                      Setup Packages
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        /* Navigate to Duration */
                      }}
                      className="flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4" />
                      Setup Durations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="border-b border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    {/* Optional chaining added */}
                    <h1 className="text-2xl font-bold">Pricelist for {selectedProduct?.name || "Unknown Product"}</h1>
                    <p className="text-muted-foreground">Set prices per Package & Duration</p>
                  </div>
                  {hasUnsavedChanges && (
                    <Badge variant="destructive" className="animate-pulse">
                      Unsaved Changes
                    </Badge>
                  )}
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IDR">IDR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex bg-muted rounded-lg p-1">
                      <button
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          taxMode === "inclusive"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted-foreground/10"
                        }`}
                        onClick={() => setTaxMode("inclusive")}
                      >
                        Inclusive
                      </button>
                      <button
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          taxMode === "exclusive"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted-foreground/10"
                        }`}
                        onClick={() => setTaxMode("exclusive")}
                      >
                        Exclusive
                      </button>
                    </div>

                    <div className="flex bg-muted rounded-lg p-1">
                      <button
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          viewMode === "simple" ? "bg-primary text-primary-foreground" : "hover:bg-muted-foreground/10"
                        }`}
                        onClick={() => setViewMode("simple")}
                      >
                        Simple
                      </button>
                      <button
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          viewMode === "advanced"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted-foreground/10"
                        }`}
                        onClick={() => setViewMode("advanced")}
                      >
                        Advanced
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search duration..."
                        value={searchDuration}
                        onChange={(e) => setSearchDuration(e.target.value)}
                        className="pl-10 w-48"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSave}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button variant="outline" onClick={handlePrint}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print PDF
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bulk Tools */}
              <div className="border-b border-border p-4">
                <div className="flex items-center justify-between">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Info className="h-4 w-4" />
                        <span>Harga akhir = price ± discount. Tax dihitung sesuai mode.</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Final price calculation includes discounts and tax based on selected mode</p>
                    </TooltipContent>
                  </Tooltip>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={clearAll}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear all
                    </Button>
                    <Button variant="outline" size="sm" onClick={fillEmptyWithZero}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Fill empty with 0
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div
                  className="matrixScroller relative overflow-y-auto overflow-x-hidden"
                  style={{
                    maxHeight: "calc(100vh - var(--appTopbarH, 76px) - 160px)",
                  }}
                >
                  <table className="w-full border-separate border-spacing-0">
                    <thead>
                      <tr
                        className="price-grid sticky top-0 z-20 bg-white dark:bg-slate-900"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(220px, 0.9fr) repeat(auto-fit, minmax(180px, 1fr))",
                          boxShadow: "0 1px 0 rgba(0,0,0,.06)",
                        }}
                      >
                        <th className="text-left p-3 font-medium sticky left-0 z-30 bg-inherit border-r border-border">
                          Duration
                        </th>
                        {selectedProduct?.packages?.map((pkg) => (
                          <th key={pkg.id} className="text-center p-3 font-medium border-r border-border">
                            <div className="flex flex-col items-center gap-2">
                              <span>{pkg.name}</span>
                              <div className="flex items-center gap-1">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 px-2">
                                      <Settings className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="center">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const fromPackage = selectedProduct?.packages?.find((p) => p.id !== pkg.id)
                                        if (fromPackage) copyPackagePrices(fromPackage.id, pkg.id)
                                      }}
                                    >
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy from...
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => adjustPackagePrices(pkg.id, 10)}>
                                      <TrendingUp className="h-4 w-4 mr-2" />
                                      +10%
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => adjustPackagePrices(pkg.id, -10)}>
                                      <TrendingDown className="h-4 w-4 mr-2" />
                                      -10%
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => roundPackagePrices(pkg.id, 1000)}>
                                      Round to 1.000
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => roundPackagePrices(pkg.id, 5000)}>
                                      Round to 5.000
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDurations.map((duration) => (
                        <tr
                          key={duration.id}
                          className="price-grid hover:bg-muted/30"
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(220px, 0.9fr) repeat(auto-fit, minmax(180px, 1fr))",
                            minHeight: "56px",
                          }}
                        >
                          <td className="p-3 sticky left-0 z-30 bg-background border-r border-border border-b border-border flex items-center">
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <div className="font-medium">{duration.name}</div>
                                <div className="text-sm text-muted-foreground">{duration.code}</div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const price = prompt("Fill all packages with price:")
                                  if (price && !isNaN(Number(price))) {
                                    fillRow(duration.id, Number(price))
                                  }
                                }}
                                className="h-6 px-2"
                              >
                                Fill row
                              </Button>
                            </div>
                          </td>
                          {selectedProduct?.packages?.map((pkg) => {
                            const currentPrice = getPrice(duration.id, pkg.id)
                            const isEmpty = currentPrice === 0
                            const isActive = pkg.status === "active"

                            return (
                              <td
                                key={pkg.id}
                                className="p-3 text-center border-r border-border border-b border-border flex items-center justify-center"
                              >
                                <div className="w-full">
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={currentPrice || ""}
                                    onChange={(e) => {
                                      const value = e.target.value === "" ? 0 : Number(e.target.value)
                                      updatePrice(duration.id, pkg.id, value)
                                    }}
                                    className={`text-center min-w-0 ${
                                      isEmpty && isActive ? "border-red-500 focus:border-red-500" : ""
                                    }`}
                                    disabled={!isActive}
                                  />
                                  {currentPrice > 0 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {formatCurrency(currentPrice)}
                                    </div>
                                  )}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Pricing Preview</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex bg-muted rounded-lg p-1">
                  <button
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      previewOptions.showPackages === "all"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted-foreground/10"
                    }`}
                    onClick={() => setPreviewOptions({ ...previewOptions, showPackages: "all" })}
                  >
                    All Packages
                  </button>
                  <button
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      previewOptions.showPackages === "selected"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted-foreground/10"
                    }`}
                    onClick={() => setPreviewOptions({ ...previewOptions, showPackages: "selected" })}
                  >
                    Selected
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={previewOptions.showLegend}
                    onCheckedChange={(checked) => setPreviewOptions({ ...previewOptions, showLegend: checked })}
                  />
                  <span className="text-sm">Show legend</span>
                </div>

                <Select
                  value={previewOptions.scale.toString()}
                  onValueChange={(value) => setPreviewOptions({ ...previewOptions, scale: Number(value) })}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90%</SelectItem>
                    <SelectItem value="100">100%</SelectItem>
                    <SelectItem value="110">110%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>

            <div
              className="border rounded-lg p-6"
              style={{ transform: `scale(${previewOptions.scale / 100})`, transformOrigin: "top left" }}
            >
              <div className="text-center mb-6">
                {/* Optional chaining added */}
                <h2 className="text-2xl font-bold">{selectedProduct?.name || "Unknown Product"} - Pricing</h2>
                <p className="text-muted-foreground">
                  Currency: {currency} • Tax: {taxMode}
                </p>
              </div>

              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left">Duration</th>
                    {/* Optional chaining added */}
                    {selectedProduct?.packages?.map((pkg) => (
                      <th key={pkg.id} className="border border-border p-3 text-center">
                        {pkg.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Optional chaining added */}
                  {selectedProduct?.durations?.map((duration) => (
                    <tr key={duration.id}>
                      <td className="border border-border p-3 font-medium">{duration.name}</td>
                      {/* Optional chaining added */}
                      {selectedProduct?.packages?.map((pkg) => {
                        const price = getPrice(duration.id, pkg.id)
                        return (
                          <td key={pkg.id} className="border border-border p-3 text-center">
                            {price > 0 ? formatCurrency(price) : "-"}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {previewOptions.showLegend && (
                <div className="mt-6 text-sm text-muted-foreground">
                  <p>
                    {/* Optional chaining added */}
                    Agile Store • {selectedProduct?.name || "Unknown Product"} • {currency} •{" "}
                    {new Date().toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        :root { 
          --appTopbarH: 76px; 
        }
        
        html, body, #priceLayout, #priceContent {
          overflow-x: hidden;
        }
        
        #priceSidebar {
          box-shadow: inset -1px 0 0 rgba(255,255,255,0.06);
        }
        
        #priceLayout {
          display: block;
          position: relative;
        }
        
        #priceContent {
          padding-left: 320px;
          width: 100vw;
          box-sizing: border-box;
        }
        
        .matrixScroller {
          overflow-x: hidden;
        }
        
        thead th { 
          position: sticky; 
          top: 0; 
          z-index: 20; 
          background: inherit; 
        }
        
        th:first-child, td:first-child { 
          position: sticky; 
          left: 0; 
          z-index: 30; 
          background: inherit; 
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .price-grid {
          display: grid;
        }
        @media (min-width: 1280px) {
          .price-grid {
            grid-template-columns: minmax(220px, 0.9fr) repeat(auto-fit, minmax(200px, 1fr));
          }
        }
        @media (max-width: 768px) {
          #priceLayout {
            display: block;
          }
          #priceSidebar {
            position: relative !important;
            height: auto !important;
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
          #priceContent {
            padding-left: 0 !important;
            width: 100% !important;
          }
          .price-grid {
            display: block;
          }
          .price-grid th,
          .price-grid td {
            display: block;
            border: none;
            padding: 8px;
          }
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 1in;
            size: A4 portrait;
          }
        }
      `}</style>
    </TooltipProvider>
  )
}
