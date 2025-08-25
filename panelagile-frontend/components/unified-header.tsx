"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
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
  Sun,
  Moon,
  LogOut,
  User,
  Menu,
  X,
  MoreHorizontal,
  DollarSign,
  Plug,
  Box,
  Star,
  UserCheck,
  History,
  MessageSquare,
  TrendingUp,
  Activity,
  Receipt,
  FileText,
  RefreshCw,
  Store,
  Shield,
  Key,
  Globe,
  Check,
  Eye,
  CheckCircle,
  Grid3X3,
  Clock,
} from "lucide-react";
import { useTheme } from "next-themes";
import { PolishedSubmenu } from "./polished-submenu";
import { fetchNavItems } from "@/lib/api"; // ← gunakan helper kamu yg sudah ada

interface UnifiedHeaderProps {
  activePage: string;
  onPageChange: (page: string) => void;
  onLogout?: () => void;
}

/** ====== Tipe dari backend (disederhanakan) ====== */
type ApiNavItem = {
  id: number;
  label: string;
  slug: string;
  icon?: string | null;
  parent_id?: number | null;
  order_number?: number | null;
  is_active?: boolean | null;
  children?: ApiNavItem[];
};

/** ====== Util: flattener tree ====== */
function flattenNav(items: ApiNavItem[]): ApiNavItem[] {
  const out: ApiNavItem[] = [];
  const walk = (arr: ApiNavItem[]) => {
    arr.forEach((it) => {
      out.push(it);
      if (it.children?.length) walk(it.children);
    });
  };
  walk(items);
  return out;
}

/** ====== Peta slug → grup UI existing (agar UI tidak berubah) ====== */
const GROUP_MAP = {
  products: [
    "products",
    "feature-product",
    "package-product",
    "matrix-package",
    "durasi",
    "pricelist",
  ],
  users: ["level-user", "matrix-level", "data-user"],
  dashboard: ["dashboard", "analytics"],
  customers: ["customers", "segments", "support"],
  finance: ["invoices", "payments", "subscriptions"],
  reports: ["sales-reports", "customer-reports", "financial-reports"],
  billing: ["subscription-billing", "payment-methods", "billing-history"],
  integrations: ["payment-gateways", "whatsapp-email", "api-keys"],
  settings: ["settings", "roles", "system-settings"],
  help: ["docs", "tutorials", "contact"],
} as const;

/** ====== Default menu (fallback visual persis seperti punyamu) ====== */
const DEFAULT_MAIN = [
  {
    id: "products",
    label: "Products",
    icon: Package,
    sections: [
      {
        id: "products-section",
        label: "Product Management",
        icon: Package,
        items: [
          { id: "products", label: "Products", icon: Package },
          { id: "feature-product", label: "Feature Product", icon: Zap },
          { id: "package-product", label: "Package Product", icon: Box },
          { id: "matrix-package", label: "Matrix Package", icon: Grid3X3 },
          { id: "durasi", label: "Durasi", icon: Clock },
          { id: "pricelist", label: "Pricelist", icon: DollarSign },
        ],
        accordion: false,
      },
    ],
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    sections: [
      {
        id: "users-section",
        label: "User Management",
        icon: Users,
        items: [
          { id: "level-user", label: "Level User", icon: Shield },
          { id: "matrix-level", label: "Matrix Level", icon: Grid3X3 },
          { id: "data-user", label: "Data User", icon: UserCheck },
        ],
        accordion: false,
      },
    ],
  },
] as const;

const DEFAULT_MORE = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { id: "dashboard", label: "Overview", icon: LayoutDashboard },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
    ],
    accordion: true,
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    items: [
      { id: "customers", label: "Segmentation", icon: UserCheck },
      { id: "segments", label: "History", icon: History },
      { id: "support", label: "Support", icon: MessageSquare },
    ],
    accordion: true,
  },
  {
    id: "finance",
    label: "Finance",
    icon: DollarSign,
    items: [
      { id: "invoices", label: "Billing", icon: Receipt },
      { id: "payments", label: "Invoices", icon: FileText },
      { id: "subscriptions", label: "Refunds", icon: RefreshCw },
    ],
    accordion: true,
  },
  {
    id: "reports",
    label: "Reports",
    icon: FileText,
    items: [
      { id: "sales-reports", label: "Sales Reports", icon: TrendingUp },
      { id: "customer-reports", label: "Customer Reports", icon: Users },
      { id: "financial-reports", label: "Financial Reports", icon: DollarSign },
    ],
    accordion: true,
  },
  {
    id: "billing",
    label: "Billing",
    icon: CreditCard,
    items: [
      { id: "subscription-billing", label: "Subscriptions", icon: RefreshCw },
      { id: "payment-methods", label: "Payment Methods", icon: CreditCard },
      { id: "billing-history", label: "Billing History", icon: History },
    ],
    accordion: true,
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Plug,
    items: [
      { id: "payment-gateways", label: "Payment Gateways", icon: CreditCard },
      { id: "whatsapp-email", label: "WhatsApp/Email", icon: MessageSquare },
      { id: "api-keys", label: "API Keys", icon: Key },
    ],
    accordion: true,
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    items: [
      { id: "settings", label: "Store Settings", icon: Store },
      { id: "roles", label: "Roles & Access", icon: Shield },
      { id: "system-settings", label: "System", icon: Settings },
    ],
    accordion: true,
  },
  {
    id: "help",
    label: "Help & Support",
    icon: HelpCircle,
    items: [
      { id: "docs", label: "Documentation", icon: FileText },
      { id: "tutorials", label: "Tutorials", icon: Star },
      { id: "contact", label: "Contact Support", icon: MessageSquare },
    ],
    accordion: true,
  },
] as const;

export function UnifiedHeader({
  activePage,
  onPageChange,
  onLogout,
}: UnifiedHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState("EN");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState<"unread" | "all">(
    "unread"
  );

  // ====== NEW: state untuk nav backend (tetap default ke menu statis agar UI tidak berubah) ======
  const [mainMenuItems, setMainMenuItems] = useState<any[]>(
    DEFAULT_MAIN as any
  );
  const [moreMenuSections, setMoreMenuSections] = useState<any[]>(
    DEFAULT_MORE as any
  );
  const [loadingNav, setLoadingNav] = useState(false);

  // ====== FETCH NAV ITEMS dari backend (fallback aman) ======
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingNav(true);
        // Kamu bisa pakai ?flat=1 agar selalu flat
        const res = await fetchNavItems(); // /api/nav-items (tree atau flat)
        const list: ApiNavItem[] =
          Array.isArray(res) &&
          res.length &&
          (res[0] as any)?.children !== undefined
            ? flattenNav(res)
            : (res as ApiNavItem[]);

        // filter aktif + sort by order_number
        const usable = (list || [])
          .filter((x) => x.is_active !== false)
          .sort((a, b) => (a.order_number ?? 0) - (b.order_number ?? 0));

        if (!usable.length) return; // kalau kosong, biarkan default

        // Bangun peta slug → label (biar label dari backend muncul di UI yg sama)
        const labelMap = new Map<string, string>();
        usable.forEach((x) => {
          if (x.slug && x.label) labelMap.set(x.slug, x.label);
        });

        // Util: update label jika slug cocok
        const rewriteLabels = (arr: any[]) =>
          arr.map((grp) => {
            if (grp.items) {
              return {
                ...grp,
                items: grp.items.map((it: any) => ({
                  ...it,
                  label: labelMap.get(it.id) ?? it.label,
                })),
              };
            }
            if (grp.sections) {
              return {
                ...grp,
                sections: grp.sections.map((sec: any) => ({
                  ...sec,
                  items: sec.items.map((it: any) => ({
                    ...it,
                    label: labelMap.get(it.id) ?? it.label,
                  })),
                })),
              };
            }
            return grp;
          });

        // Tambahkan item baru dari backend yang belum ada di default (dimasukkan ke grup sesuai GROUP_MAP)
        const knownSlugs = new Set<string>([
          ...Object.values(GROUP_MAP).flat(),
        ]);

        const missing = usable.filter((x) => !knownSlugs.has(x.slug));

        // builder untuk grup new item ke "More → Help" (biar UI tidak berubah layout-nya)
        const addToMoreHelp = (sections: any[]) => {
          const idx = sections.findIndex((s) => s.id === "help");
          const helpSec = idx >= 0 ? sections[idx] : null;
          if (!helpSec) return sections;
          const extraItems = missing.map((m) => ({
            id: m.slug,
            label: m.label || m.slug,
            icon: FileText, // ikon default
          }));
          const newHelp = {
            ...helpSec,
            items: [...helpSec.items, ...extraItems],
          };
          const out = sections.slice();
          out[idx] = newHelp;
          return out;
        };

        if (!mounted) return;

        // susun ulang urutan by order_number untuk slug yang diketahui per grup
        // (kalau ingin benar-benar mengikuti order backend, bisa sorting ulang tiap daftar berdasarkan order_number)
        const nextMain = rewriteLabels(DEFAULT_MAIN as any);
        const nextMore = addToMoreHelp(rewriteLabels(DEFAULT_MORE as any));

        setMainMenuItems(nextMain as any);
        setMoreMenuSections(nextMore as any);
      } catch (e) {
        console.warn(
          "Failed loading /api/nav-items. Using default static menus.",
          e
        );
      } finally {
        setLoadingNav(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ====== Notifikasi mock (tidak diubah) ======
  const notifications = [
    {
      id: 1,
      title: "New customer registered",
      snippet: "John Doe just signed up for Premium plan",
      time: "2m",
      unread: true,
      icon: UserCheck,
    },
    {
      id: 2,
      title: "Payment received",
      snippet: "$299 payment for Enterprise subscription",
      time: "15m",
      unread: true,
      icon: CreditCard,
    },
    {
      id: 3,
      title: "Feature usage alert",
      snippet: "API rate limit approaching for user #1234",
      time: "1h",
      unread: true,
      icon: Activity,
    },
    {
      id: 4,
      title: "System maintenance",
      snippet: "Scheduled maintenance completed successfully",
      time: "3h",
      unread: false,
      icon: Settings,
    },
  ];
  const unreadCount = notifications.filter((n) => n.unread).length;
  const displayedNotifications =
    notificationTab === "unread"
      ? notifications.filter((n) => n.unread)
      : notifications;

  // ====== Helper judul (tidak diubah) ======
  const getPageTitle = () => {
    const allItems: any[] = [...mainMenuItems, ...moreMenuSections];
    for (const item of allItems) {
      if (item.id === activePage) return item.label;
      for (const section of item.sections || []) {
        for (const subItem of section.items) {
          if (subItem.id === activePage) return subItem.label;
        }
      }
      for (const subItem of item.items || []) {
        if (subItem.id === activePage) return subItem.label;
      }
    }
    return "Dashboard";
  };

  const isActiveMenu = (item: any) => {
    if (activePage === item.id) return true;
    for (const section of item.sections || []) {
      if (section.items.some((sub: any) => sub.id === activePage)) return true;
    }
    for (const subItem of item.items || []) {
      if (subItem.id === activePage) return true;
    }
    return false;
  };

  return (
    <TooltipProvider>
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b border-primary/20 glow-primary">
        <div className="max-w-[1320px] mx-auto h-14 flex items-center justify-between px-4 md:px-5 lg:px-4">
          <div className="flex items-center flex-shrink-0">
            <div className="flex items-center space-x-2 hover:scale-[1.02] transition-transform duration-200">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-base md:text-lg lg:text-lg leading-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent whitespace-nowrap">
                <span className="hidden sm:inline">Agile Store</span>
                <span className="sm:hidden" title="Agile Store">
                  Agile
                </span>
              </span>
            </div>
          </div>

          {/* NAV DESKTOP (UI sama) */}
          <nav className="hidden lg:flex items-center justify-center flex-1 max-w-[720px] mx-8">
            <div className="flex items-center justify-center w-full">
              {mainMenuItems.map((item: any) => (
                <div key={item.id} className="relative">
                  {item.sections?.length > 0 ? (
                    <PolishedSubmenu
                      trigger={
                        <Button
                          variant="ghost"
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/20 relative ${
                            isActiveMenu(item)
                              ? "text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="font-medium">{item.label}</span>
                          <ChevronDown className="h-3 w-3" />
                          {isActiveMenu(item) && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full" />
                          )}
                        </Button>
                      }
                      sections={item.sections}
                      onItemClick={onPageChange}
                      activeItem={activePage}
                      align="start"
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/20 relative ${
                        isActiveMenu(item)
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => onPageChange(item.id)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.label}</span>
                      {isActiveMenu(item) && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="ml-4">
              <PolishedSubmenu
                trigger={
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/20 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="font-medium">More</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                }
                sections={moreMenuSections}
                onItemClick={onPageChange}
                activeItem={activePage}
                align="end"
              />
            </div>
          </nav>

          {/* TOGGLER MOBILE (UI sama) */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden hover:bg-primary/20"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* ACTIONS RIGHT (UI sama) */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-primary/20 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                onClick={() => setSettingsOpen(!settingsOpen)}
              >
                <Settings className="h-5 w-5" />
              </Button>

              {settingsOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 bg-card/95 backdrop-blur-xl border border-primary/30 rounded-xl shadow-lg z-50 p-4 animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-200"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setSettingsOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between h-11 px-3 rounded-lg hover:bg-primary/10 transition-colors">
                    <div className="flex items-center gap-3">
                      {theme === "dark" ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Sun className="h-4 w-4" />
                      )}
                      <span className="font-medium">Theme</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Light
                      </span>
                      <Switch
                        checked={theme === "dark"}
                        onCheckedChange={(checked) =>
                          setTheme(checked ? "dark" : "light")
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        Dark
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between h-11 px-3 rounded-lg hover:bg-primary/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4" />
                      <span className="font-medium">Language</span>
                    </div>
                    <div className="flex bg-muted rounded-lg p-1">
                      <button
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          language === "EN"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted-foreground/10"
                        }`}
                        onClick={() => setLanguage("EN")}
                      >
                        EN
                      </button>
                      <button
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          language === "IN"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted-foreground/10"
                        }`}
                        onClick={() => setLanguage("IN")}
                      >
                        IN
                      </button>
                    </div>
                  </div>

                  <button
                    className="w-full flex items-center gap-3 h-11 px-3 rounded-lg hover:bg-primary/10 transition-colors"
                    onClick={() => {
                      onPageChange("profile-settings");
                      setSettingsOpen(false);
                    }}
                  >
                    <User className="h-4 w-4" />
                    <span className="font-medium">Profile Settings</span>
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="relative hover:bg-primary/20 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center px-1 transform translate-x-1/2 -translate-y-1/2">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </div>
                )}
              </Button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-96 max-h-[60vh] bg-card/95 backdrop-blur-xl border border-primary/30 rounded-xl shadow-lg z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-200 overflow-hidden"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setNotificationsOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between p-4 border-b border-primary/20">
                    <div className="flex bg-muted rounded-lg p-1">
                      <button
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          notificationTab === "unread"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted-foreground/10"
                        }`}
                        onClick={() => setNotificationTab("unread")}
                      >
                        Unread ({unreadCount})
                      </button>
                      <button
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          notificationTab === "all"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted-foreground/10"
                        }`}
                        onClick={() => setNotificationTab("all")}
                      >
                        All
                      </button>
                    </div>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs hover:bg-primary/10"
                        onClick={() => {
                          console.log("Mark all as read");
                        }}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Mark all read
                      </Button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {displayedNotifications.length > 0 ? (
                      displayedNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="flex items-start gap-3 p-4 hover:bg-primary/5 transition-colors border-b border-primary/10 last:border-b-0"
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <notification.icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-sm leading-tight">
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs text-muted-foreground">
                                  {notification.time}
                                </span>
                                {notification.unread && (
                                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.snippet}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              {notification.unread && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs hover:bg-primary/10"
                                  onClick={() =>
                                    console.log("Mark as read", notification.id)
                                  }
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Mark read
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs hover:bg-primary/10"
                                onClick={() =>
                                  console.log("View", notification.id)
                                }
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 px-4">
                        <CheckCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                        <h3 className="font-medium text-sm mb-1">
                          You're all caught up!
                        </h3>
                        <p className="text-xs text-muted-foreground text-center">
                          No {notificationTab === "unread" ? "unread" : ""}{" "}
                          notifications at the moment.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-primary/20 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-card/95 backdrop-blur-xl border border-primary/30 glow-primary"
              >
                <DropdownMenuItem disabled>
                  <User className="h-4 w-4 mr-2" />
                  Admin User
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {onLogout && (
                  <DropdownMenuItem
                    onClick={onLogout}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* MOBILE NAV (UI sama) */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-primary/20 bg-card/95 backdrop-blur-xl">
            <nav className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {mainMenuItems.map((item: any) => (
                <div key={item.id}>
                  {item.sections?.length > 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </div>
                      <div className="ml-6 space-y-1">
                        {item.sections.map((section: any) =>
                          section.items.map((subItem: any) => (
                            <Button
                              key={subItem.id}
                              variant={
                                activePage === subItem.id
                                  ? "secondary"
                                  : "ghost"
                              }
                              className={`w-full justify-start text-sm hover:bg-primary/20 ${
                                activePage === subItem.id
                                  ? "bg-primary/20 text-primary"
                                  : ""
                              }`}
                              onClick={() => {
                                onPageChange(subItem.id);
                                setMobileMenuOpen(false);
                              }}
                            >
                              {subItem.icon && (
                                <subItem.icon className="h-4 w-4 mr-3" />
                              )}
                              {subItem.label}
                              {subItem.badge && (
                                <Badge
                                  variant="secondary"
                                  className="ml-auto text-xs bg-accent/20 text-accent"
                                >
                                  {subItem.badge}
                                </Badge>
                              )}
                            </Button>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant={activePage === item.id ? "secondary" : "ghost"}
                      className={`w-full justify-start hover:bg-primary/20 ${
                        activePage === item.id
                          ? "bg-primary/20 text-primary"
                          : ""
                      }`}
                      onClick={() => {
                        onPageChange(item.id);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <item.icon className="h-4 w-4 mr-3" />
                      {item.label}
                    </Button>
                  )}
                </div>
              ))}

              <div className="pt-2 border-t border-primary/20">
                <div className="text-xs font-medium text-muted-foreground px-3 py-2 uppercase tracking-wider">
                  More
                </div>
                {moreMenuSections.map((section: any) => (
                  <div key={section.id} className="space-y-1">
                    <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground">
                      <section.icon className="h-4 w-4" />
                      {section.label}
                      {section.badge && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-accent/20 text-accent"
                        >
                          {section.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="ml-6 space-y-1">
                      {section.items.map((item: any) => (
                        <Button
                          key={item.id}
                          variant={
                            activePage === item.id ? "secondary" : "ghost"
                          }
                          className={`w-full justify-start text-sm hover:bg-primary/20 ${
                            activePage === item.id
                              ? "bg-primary/20 text-primary"
                              : ""
                          }`}
                          onClick={() => {
                            onPageChange(item.id);
                            setMobileMenuOpen(false);
                          }}
                        >
                          {item.icon && <item.icon className="h-4 w-4 mr-3" />}
                          {item.label}
                          {item.badge && (
                            <Badge
                              variant="secondary"
                              className="ml-auto text-xs bg-accent/20 text-accent"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </nav>
          </div>
        )}
      </header>

      {(settingsOpen || notificationsOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setSettingsOpen(false);
            setNotificationsOpen(false);
          }}
        />
      )}
    </TooltipProvider>
  );
}
