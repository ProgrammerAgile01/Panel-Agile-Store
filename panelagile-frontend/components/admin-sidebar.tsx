"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  ChevronRight,
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
} from "lucide-react"

interface AdminSidebarProps {
  collapsed: boolean
  style: "glass" | "gradient" | "minimal"
  onStyleChange: (style: "glass" | "gradient" | "minimal") => void
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
    label: "Product Management",
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
    label: "Feature Management",
    icon: Zap,
    subItems: [
      { id: "features-list", label: "Features List", icon: Zap, href: "/features" },
      { id: "feature-groups", label: "Feature Groups", icon: UserCheck, href: "/features/groups" },
      { id: "beta-testing", label: "Beta Testing", icon: Settings, href: "/features/beta" },
    ],
  },
  {
    id: "customers",
    label: "Customer Management",
    icon: Users,
    subItems: [
      { id: "customers-list", label: "Customers List", icon: Users, href: "/customers" },
      { id: "segmentation", label: "Segmentation", icon: UserCheck, href: "/customers/segments" },
      { id: "support-tickets", label: "Support Tickets", icon: FileText, href: "/customers/support", badge: "5" },
    ],
  },
  {
    id: "payments",
    label: "Payments & Finance",
    icon: CreditCard,
    subItems: [
      { id: "invoices", label: "Invoices", icon: FileText, href: "/payments/invoices" },
      { id: "gateways", label: "Payment Gateways", icon: CreditCard, href: "/payments/gateways" },
      { id: "refunds", label: "Refunds", icon: CreditCard, href: "/payments/refunds" },
    ],
  },
  {
    id: "analytics",
    label: "Reports & Analytics",
    icon: BarChart3,
    subItems: [
      { id: "sales-dashboard", label: "Sales Dashboard", icon: TrendingUp, href: "/analytics/sales" },
      { id: "customer-growth", label: "Customer Growth", icon: Users, href: "/analytics/growth" },
      { id: "usage-insights", label: "Usage Insights", icon: BarChart3, href: "/analytics/usage" },
    ],
  },
  {
    id: "user-management",
    label: "User & Role Management",
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

export function AdminSidebar({ collapsed, style, onStyleChange }: AdminSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(["dashboard"])
  const [activeItem, setActiveItem] = useState("dashboard")

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]))
  }

  const getSidebarStyles = () => {
    const baseStyles = "fixed left-4 top-1/2 -translate-y-1/2 h-[60vh] rounded-2xl transition-all duration-300 z-50"

    switch (style) {
      case "glass":
        return cn(baseStyles, "glass-morphism border-2 glow-primary", collapsed ? "w-16" : "w-60")
      case "gradient":
        return cn(
          baseStyles,
          "bg-gradient-to-b from-primary via-primary/90 to-secondary border border-primary/20 shadow-2xl",
          collapsed ? "w-16" : "w-60",
        )
      case "minimal":
        return cn(baseStyles, "bg-card border border-border shadow-lg", collapsed ? "w-16" : "w-60")
      default:
        return baseStyles
    }
  }

  const getItemStyles = (item: MenuItem, isActive: boolean, hasSubItems: boolean) => {
    const baseStyles = "w-full justify-start gap-3 h-11 transition-all duration-200"

    if (style === "glass") {
      return cn(
        baseStyles,
        isActive
          ? "bg-primary/20 text-primary glow-accent border border-primary/30"
          : "hover:bg-accent/10 hover:text-accent text-sidebar-foreground",
      )
    } else if (style === "gradient") {
      return cn(
        baseStyles,
        isActive ? "bg-white/20 text-white shadow-lg" : "hover:bg-white/10 text-white/90 hover:text-white",
      )
    } else {
      return cn(
        baseStyles,
        isActive
          ? "bg-primary text-primary-foreground border-l-4 border-l-accent"
          : "hover:bg-accent/10 hover:text-accent text-foreground",
      )
    }
  }

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isActive = activeItem === item.id
    const isExpanded = expandedItems.includes(item.id)
    const hasSubItems = item.subItems && item.subItems.length > 0

    if (collapsed && level === 0) {
      return (
        <TooltipProvider key={item.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={getItemStyles(item, isActive, hasSubItems)}
                onClick={() => setActiveItem(item.id)}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-accent text-accent-foreground rounded-full text-xs flex items-center justify-center animate-pulse-glow">
                    {item.badge}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-2">
              <p>{item.label}</p>
              {hasSubItems && (
                <div className="mt-2 space-y-1">
                  {item.subItems?.map((subItem) => (
                    <div key={subItem.id} className="text-sm opacity-80">
                      {subItem.label}
                    </div>
                  ))}
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return (
      <div key={item.id} className={level > 0 ? "ml-4" : ""}>
        <Button
          variant="ghost"
          className={getItemStyles(item, isActive, hasSubItems)}
          onClick={() => {
            setActiveItem(item.id)
            if (hasSubItems) {
              toggleExpanded(item.id)
            }
          }}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left truncate">{item.label}</span>
              {item.badge && (
                <span className="bg-accent text-accent-foreground px-2 py-0.5 rounded-full text-xs animate-pulse-glow">
                  {item.badge}
                </span>
              )}
              {hasSubItems && (
                <div className="ml-auto">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              )}
            </>
          )}
        </Button>

        {!collapsed && hasSubItems && isExpanded && (
          <div className="mt-1 space-y-1 pl-4">
            {item.subItems?.map((subItem) => renderMenuItem(subItem, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className={getSidebarStyles()}>
      <div className="flex flex-col h-full p-4">
        {/* Logo/Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              style === "glass"
                ? "bg-primary/20 text-primary"
                : style === "gradient"
                  ? "bg-white/20 text-white"
                  : "bg-primary text-primary-foreground",
            )}
          >
            <Store className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div>
              <h1
                className={cn(
                  "font-bold text-lg font-heading",
                  style === "gradient" ? "text-white" : "text-foreground",
                )}
              >
                Agile Store
              </h1>
              <p className={cn("text-xs", style === "gradient" ? "text-white/70" : "text-muted-foreground")}>
                Admin Panel
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto">{menuItems.map((item) => renderMenuItem(item))}</nav>

        {/* Footer */}
        {!collapsed && (
          <div
            className={cn(
              "mt-4 pt-4 border-t text-xs text-center",
              style === "gradient" ? "border-white/20 text-white/70" : "border-border text-muted-foreground",
            )}
          >
            v2.1.0 • Premium
          </div>
        )}
      </div>
    </aside>
  )
}
