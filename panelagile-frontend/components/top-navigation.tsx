"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  Package,
  Settings,
  Users,
  CreditCard,
  BarChart3,
  Shield,
  Zap,
  ChevronDown,
  Store,
  Tag,
  Gift,
  UserCheck,
  FileText,
  TrendingUp,
  UserCog,
  Webhook,
  Bell,
  Lock,
  Sun,
  Moon,
} from "lucide-react"

interface TopNavigationProps {
  activePage: string
  onPageChange: (page: string) => void
}

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  subItems?: MenuItem[]
  badge?: string
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    id: "products",
    label: "Products",
    icon: Package,
    subItems: [
      { id: "product-list", label: "Products List", icon: Package, href: "/products" },
      { id: "packages", label: "Packages", icon: Store, href: "/products/packages" },
      { id: "categories", label: "Categories", icon: Tag, href: "/products/categories" },
      { id: "coupons", label: "Coupons", icon: Gift, href: "/products/coupons" },
    ],
  },
  {
    id: "features",
    label: "Features",
    icon: Zap,
    subItems: [
      { id: "features-list", label: "Features List", icon: Zap, href: "/features" },
      { id: "feature-groups", label: "Feature Groups", icon: UserCheck, href: "/features/groups" },
      { id: "beta-testing", label: "Beta Testing", icon: Settings, href: "/features/beta" },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    subItems: [
      { id: "customers-list", label: "Customers List", icon: Users, href: "/customers" },
      { id: "segmentation", label: "Segmentation", icon: UserCheck, href: "/customers/segments" },
      { id: "support-tickets", label: "Support Tickets", icon: FileText, href: "/customers/support", badge: "5" },
    ],
  },
  {
    id: "payments",
    label: "Payments",
    icon: CreditCard,
    subItems: [
      { id: "invoices", label: "Invoices", icon: FileText, href: "/payments/invoices" },
      { id: "gateways", label: "Payment Gateways", icon: CreditCard, href: "/payments/gateways" },
      { id: "refunds", label: "Refunds", icon: CreditCard, href: "/payments/refunds" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    subItems: [
      { id: "sales-dashboard", label: "Sales Dashboard", icon: TrendingUp, href: "/analytics/sales" },
      { id: "customer-growth", label: "Customer Growth", icon: Users, href: "/analytics/growth" },
      { id: "usage-insights", label: "Usage Insights", icon: BarChart3, href: "/analytics/usage" },
    ],
  },
  {
    id: "user-management",
    label: "Users",
    icon: Shield,
    subItems: [
      { id: "admin-roles", label: "Admin Roles", icon: UserCog, href: "/users/roles" },
      { id: "access-rights", label: "Access Rights", icon: Lock, href: "/users/access" },
      { id: "activity-log", label: "Activity Log", icon: FileText, href: "/users/activity" },
    ],
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Webhook,
    subItems: [
      { id: "api-keys", label: "API Keys", icon: Webhook, href: "/integrations/api" },
      { id: "whatsapp", label: "WhatsApp Integration", icon: Webhook, href: "/integrations/whatsapp" },
      { id: "email", label: "Email Integration", icon: Webhook, href: "/integrations/email" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    subItems: [
      { id: "store-branding", label: "Store Branding", icon: Store, href: "/settings/branding" },
      { id: "notifications", label: "Notifications", icon: Bell, href: "/settings/notifications" },
      { id: "authentication", label: "Authentication", icon: Lock, href: "/settings/auth" },
    ],
  },
]

export function TopNavigation({ activePage, onPageChange }: TopNavigationProps) {
  const { theme, setTheme } = useTheme()

  const renderMenuItem = (item: MenuItem) => {
    const isActive = activePage === item.id
    const hasSubItems = item.subItems && item.subItems.length > 0

    if (hasSubItems) {
      return (
        <DropdownMenu key={item.id}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-10 px-4 py-2 gap-2 transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border-b-2 border-primary"
                  : "hover:bg-accent/10 hover:text-accent text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <Badge className="ml-1 h-5 w-5 p-0 text-xs bg-accent animate-pulse-glow">{item.badge}</Badge>
              )}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 glass-morphism border border-border/50">
            {item.subItems?.map((subItem, index) => (
              <div key={subItem.id}>
                <DropdownMenuItem
                  className="gap-3 cursor-pointer hover:bg-accent/10"
                  onClick={() => onPageChange(subItem.id)}
                >
                  <subItem.icon className="h-4 w-4" />
                  <span>{subItem.label}</span>
                  {subItem.badge && (
                    <Badge className="ml-auto h-5 w-5 p-0 text-xs bg-accent animate-pulse-glow">{subItem.badge}</Badge>
                  )}
                </DropdownMenuItem>
                {index < item.subItems!.length - 1 && <DropdownMenuSeparator />}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    return (
      <Button
        key={item.id}
        variant="ghost"
        className={cn(
          "h-10 px-4 py-2 gap-2 transition-all duration-200",
          isActive
            ? "bg-primary/10 text-primary border-b-2 border-primary"
            : "hover:bg-accent/10 hover:text-accent text-foreground",
        )}
        onClick={() => onPageChange(item.id)}
      >
        <item.icon className="h-4 w-4" />
        <span className="font-medium">{item.label}</span>
      </Button>
    )
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg font-heading text-foreground">Agile Store</h1>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex items-center gap-1">{menuItems.map((item) => renderMenuItem(item))}</nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-accent animate-pulse-glow">3</Badge>
          </Button>

          {/* Theme Toggle */}
          <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </header>
  )
}
