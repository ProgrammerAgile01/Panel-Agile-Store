"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  Settings,
  Zap,
  CreditCard,
  Bell,
  HelpCircle,
  ChevronDown,
  Menu,
  X,
  ChevronLeft,
  ChevronRightIcon,
} from "lucide-react"

interface CollapsibleSidebarProps {
  activePage: string
  onPageChange: (page: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
  hidden: boolean
  onToggleHidden: () => void
}

export function CollapsibleSidebar({
  activePage,
  onPageChange,
  collapsed,
  onToggleCollapse,
  hidden,
  onToggleHidden,
}: CollapsibleSidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => (prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]))
  }

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
      items: [],
    },
    {
      id: "products",
      label: "Products",
      icon: Package,
      badge: "12",
      items: [
        { id: "products-list", label: "All Products" },
        { id: "packages", label: "Packages" },
        { id: "categories", label: "Categories" },
        { id: "coupons", label: "Coupons" },
      ],
    },
    {
      id: "customers",
      label: "Customers",
      icon: Users,
      badge: "847",
      items: [
        { id: "customers-list", label: "All Customers" },
        { id: "segments", label: "Segments" },
        { id: "support", label: "Support Tickets" },
      ],
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      badge: null,
      items: [
        { id: "sales", label: "Sales Reports" },
        { id: "growth", label: "Growth Analytics" },
        { id: "churn", label: "Churn Analysis" },
      ],
    },
    {
      id: "features",
      label: "Features",
      icon: Zap,
      badge: "Beta",
      items: [
        { id: "features-list", label: "All Features" },
        { id: "feature-groups", label: "Feature Groups" },
        { id: "beta-testing", label: "Beta Testing" },
      ],
    },
    {
      id: "billing",
      label: "Billing",
      icon: CreditCard,
      badge: null,
      items: [
        { id: "invoices", label: "Invoices" },
        { id: "payments", label: "Payments" },
        { id: "subscriptions", label: "Subscriptions" },
      ],
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      badge: "3",
      items: [
        { id: "alerts", label: "System Alerts" },
        { id: "campaigns", label: "Email Campaigns" },
        { id: "templates", label: "Templates" },
      ],
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: Settings,
      badge: null,
      items: [
        { id: "api-keys", label: "API Keys" },
        { id: "webhooks", label: "Webhooks" },
        { id: "third-party", label: "Third Party" },
      ],
    },
    {
      id: "help",
      label: "Help & Support",
      icon: HelpCircle,
      badge: null,
      items: [
        { id: "documentation", label: "Documentation" },
        { id: "contact", label: "Contact Support" },
        { id: "changelog", label: "Changelog" },
      ],
    },
  ]

  if (hidden) {
    return (
      <Button
        onClick={onToggleHidden}
        className="fixed top-20 left-4 z-50 bg-card/95 backdrop-blur-xl border border-primary/30 hover:bg-primary/10 text-foreground glow-primary"
        size="sm"
      >
        <Menu className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <TooltipProvider>
      <div
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gradient-to-b from-card/95 to-primary/5 backdrop-blur-xl border-r border-primary/20 transition-all duration-300 z-40 glow-primary ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary/20">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center glow-primary">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Agile Store
              </span>
            </div>
          )}

          <div className="flex items-center space-x-1">
            <Button
              onClick={onToggleCollapse}
              variant="ghost"
              size="sm"
              className="hover:bg-primary/20 text-foreground"
            >
              {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <Button onClick={onToggleHidden} variant="ghost" size="sm" className="hover:bg-primary/20 text-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100vh-144px)]">
          {menuItems.map((item) => (
            <div key={item.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activePage === item.id ? "secondary" : "ghost"}
                    className={`w-full justify-start hover:bg-primary/20 transition-all duration-200 text-foreground ${
                      collapsed ? "px-2" : "px-3"
                    } ${
                      activePage === item.id
                        ? "bg-gradient-to-r from-primary/30 to-secondary/20 border border-primary/30 text-primary-foreground glow-primary"
                        : ""
                    }`}
                    onClick={() => {
                      if (item.items.length > 0) {
                        toggleMenu(item.id)
                      } else {
                        onPageChange(item.id)
                      }
                    }}
                  >
                    <item.icon className={`h-4 w-4 ${collapsed ? "" : "mr-3"}`} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <Badge
                            variant={item.badge === "Beta" ? "secondary" : "default"}
                            className={`ml-2 text-xs ${
                              item.badge === "Beta"
                                ? "bg-accent/20 text-accent border-accent/30"
                                : "bg-primary/20 text-primary border-primary/30"
                            }`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                        {item.items.length > 0 && (
                          <ChevronDown
                            className={`h-4 w-4 ml-2 transition-transform text-muted-foreground ${
                              expandedMenus.includes(item.id) ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent
                    side="right"
                    className="bg-card/95 backdrop-blur-xl border border-primary/30 text-foreground glow-primary"
                  >
                    <p>{item.label}</p>
                  </TooltipContent>
                )}
              </Tooltip>

              {/* Submenu */}
              {!collapsed && item.items.length > 0 && expandedMenus.includes(item.id) && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.items.map((subItem) => (
                    <Button
                      key={subItem.id}
                      variant={activePage === subItem.id ? "secondary" : "ghost"}
                      className={`w-full justify-start text-sm hover:bg-primary/20 text-foreground ${
                        activePage === subItem.id ? "bg-primary/20 text-primary border-l-2 border-l-primary" : ""
                      }`}
                      onClick={() => onPageChange(subItem.id)}
                    >
                      <span className="w-2 h-2 rounded-full bg-primary/60 mr-3" />
                      {subItem.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </TooltipProvider>
  )
}
