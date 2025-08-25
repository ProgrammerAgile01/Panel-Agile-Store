"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Star, Users, DollarSign, Calendar, Zap, Package, Grid3X3, Clock } from "lucide-react"

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

interface ProductDetailsProps {
  productSlug: string
  onBack: () => void
  onNavigateToFeatures: (productSlug: string) => void
  onNavigateToPackages: (productSlug: string) => void
  onNavigateToMatrix: (productSlug: string) => void
  onNavigateToPricing: (productSlug: string) => void
}

// Mock data - in real app this would come from props or API
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

export function ProductDetails({
  productSlug,
  onBack,
  onNavigateToFeatures,
  onNavigateToPackages,
  onNavigateToMatrix,
  onNavigateToPricing,
}: ProductDetailsProps) {
  const product = mockProducts.find((p) => p.slug === productSlug)

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
        <Card className="glass-morphism bg-gradient-to-br from-red-500/5 to-pink-500/5 border-red-500/20">
          <CardContent className="p-12 text-center">
            <h3 className="text-xl font-semibold mb-2">Product Not Found</h3>
            <p className="text-muted-foreground">The requested product could not be found.</p>
          </CardContent>
        </Card>
      </div>
    )
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>

      {/* Product Overview */}
      <Card className="glass-morphism bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border-purple-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-6xl">{product.logo}</div>
              <div>
                <CardTitle className="text-3xl font-heading bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {product.name}
                </CardTitle>
                <p className="text-lg text-muted-foreground mt-2">{product.description}</p>
                <div className="flex items-center gap-4 mt-3">
                  {getStatusBadge(product.status)}
                  <Badge variant="outline">{product.category}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background/50 rounded-lg border border-purple-500/10">
              <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-400">{product.totalCustomers.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Customers</p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg border border-purple-500/10">
              <DollarSign className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-400">${product.monthlyRevenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg border border-purple-500/10">
              <Star className="h-8 w-8 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-400">{product.rating}</p>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg border border-purple-500/10">
              <Calendar className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-400">{product.updatedAt}</p>
              <p className="text-sm text-muted-foreground">Last Updated</p>
            </div>
          </div>

          {/* Product Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Product Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product ID:</span>
                  <span className="font-mono">{product.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slug:</span>
                  <span className="font-mono">{product.slug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{product.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{product.updatedAt}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Management Shortcuts</h3>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  className="justify-start bg-background/50 hover:bg-purple-500/10"
                  onClick={() => onNavigateToFeatures(product.slug)}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Manage Features & Menus
                </Button>
                <Button
                  variant="outline"
                  className="justify-start bg-background/50 hover:bg-purple-500/10"
                  onClick={() => onNavigateToPackages(product.slug)}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Manage Packages
                </Button>
                <Button
                  variant="outline"
                  className="justify-start bg-background/50 hover:bg-purple-500/10"
                  onClick={() => onNavigateToMatrix(product.slug)}
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Matrix Package
                </Button>
                <Button
                  variant="outline"
                  className="justify-start bg-background/50 hover:bg-purple-500/10"
                  onClick={() => onNavigateToPricing(product.slug)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Duration & Pricing
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
