"use client"

import { Button } from "@/components/ui/button"
import { Menu, Sun, Moon, Settings, Bell, LogOut, User } from "lucide-react"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface AdminHeaderProps {
  onToggleSidebar: () => void
  sidebarStyle: "glass" | "gradient" | "minimal"
  onStyleChange: (style: "glass" | "gradient" | "minimal") => void
  onLogout?: () => void
}

export function AdminHeader({ onToggleSidebar, sidebarStyle, onStyleChange, onLogout }: AdminHeaderProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="hover:bg-accent/20">
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Dashboard</span>
          <span>/</span>
          <span>Overview</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-accent animate-pulse-glow">3</Badge>
        </Button>

        {/* Sidebar Style Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onStyleChange("glass")}>
              Glass Floating {sidebarStyle === "glass" && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStyleChange("gradient")}>
              Gradient Compact {sidebarStyle === "gradient" && "✓"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStyleChange("minimal")}>
              Minimal Slim {sidebarStyle === "minimal" && "✓"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button variant="ghost" size="sm" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem disabled>
              <User className="h-4 w-4 mr-2" />
              Admin User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onLogout && (
              <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
