"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { ChevronRight } from "lucide-react"

interface SubmenuItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string
  disabled?: boolean
}

interface SubmenuSection {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  items: SubmenuItem[]
  accordion?: boolean
}

interface PolishedSubmenuProps {
  trigger: React.ReactNode
  sections: SubmenuSection[]
  onItemClick: (itemId: string) => void
  activeItem?: string
  align?: "start" | "end"
  className?: string
}

export function PolishedSubmenu({
  trigger,
  sections,
  onItemClick,
  activeItem,
  align = "start",
  className = "",
}: PolishedSubmenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Get all focusable items
  const getAllItems = () => {
    const items: { id: string; sectionId: string; type: "section" | "item" }[] = []
    sections.forEach((section) => {
      if (section.accordion) {
        items.push({ id: section.id, sectionId: section.id, type: "section" })
        if (expandedSection === section.id) {
          section.items.forEach((item) => {
            items.push({ id: item.id, sectionId: section.id, type: "item" })
          })
        }
      } else {
        section.items.forEach((item) => {
          items.push({ id: item.id, sectionId: section.id, type: "item" })
        })
      }
    })
    return items
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setExpandedSection(null)
        setFocusedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isOpen) return

    const allItems = getAllItems()

    switch (event.key) {
      case "Escape":
        setIsOpen(false)
        setExpandedSection(null)
        setFocusedIndex(-1)
        triggerRef.current?.focus()
        break
      case "ArrowDown":
        event.preventDefault()
        setFocusedIndex((prev) => (prev + 1) % allItems.length)
        break
      case "ArrowUp":
        event.preventDefault()
        setFocusedIndex((prev) => (prev <= 0 ? allItems.length - 1 : prev - 1))
        break
      case "Enter":
      case " ":
        event.preventDefault()
        if (focusedIndex >= 0) {
          const focusedItem = allItems[focusedIndex]
          if (focusedItem.type === "section") {
            setExpandedSection(expandedSection === focusedItem.id ? null : focusedItem.id)
          } else {
            onItemClick(focusedItem.id)
            setIsOpen(false)
            setExpandedSection(null)
            setFocusedIndex(-1)
          }
        }
        break
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, focusedIndex, expandedSection])

  const handleItemClick = (itemId: string) => {
    onItemClick(itemId)
    setIsOpen(false)
    setExpandedSection(null)
    setFocusedIndex(-1)
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId)
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className={`absolute top-full mt-2 w-80 bg-card/95 backdrop-blur-xl border border-primary/30 rounded-xl shadow-2xl shadow-primary/20 glow-primary max-h-[60vh] overflow-y-auto z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-200 ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          <div className="p-4 space-y-2">
            {sections.map((section, sectionIndex) => (
              <div key={section.id} className="border-b border-primary/10 last:border-b-0 pb-2 last:pb-0">
                {section.accordion ? (
                  <>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-primary/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-card group ${
                        focusedIndex ===
                        getAllItems().findIndex((item) => item.id === section.id && item.type === "section")
                          ? "bg-primary/10 ring-2 ring-primary/50"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <section.icon className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors" />
                        <span className="font-medium text-foreground">{section.label}</span>
                        {section.badge && (
                          <Badge className="text-xs bg-pink-500/20 text-pink-400 border-pink-500/30">
                            {section.badge}
                          </Badge>
                        )}
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                          expandedSection === section.id ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-200 ease-out ${
                        expandedSection === section.id ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="mt-2 ml-8 space-y-1 border-l border-primary/20 pl-4">
                        {section.items.map((item, itemIndex) => {
                          const globalIndex = getAllItems().findIndex(
                            (globalItem) => globalItem.id === item.id && globalItem.type === "item",
                          )
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleItemClick(item.id)}
                              disabled={item.disabled}
                              className={`w-full text-left p-2 rounded-md text-sm transition-all duration-200 hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-card transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
                                expandedSection === section.id ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                              } ${
                                activeItem === item.id
                                  ? "bg-primary/20 text-primary border border-primary/30"
                                  : "text-muted-foreground"
                              } ${focusedIndex === globalIndex ? "bg-primary/10 ring-2 ring-primary/50" : ""}`}
                              style={{
                                transitionDelay: expandedSection === section.id ? `${itemIndex * 50}ms` : "0ms",
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {item.icon && <item.icon className="h-4 w-4" />}
                                  <span>{item.label}</span>
                                </div>
                                {item.badge && (
                                  <Badge className="text-xs bg-pink-500/20 text-pink-400 border-pink-500/30">
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const globalIndex = getAllItems().findIndex(
                        (globalItem) => globalItem.id === item.id && globalItem.type === "item",
                      )
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.id)}
                          disabled={item.disabled}
                          className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-primary/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-card group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
                            activeItem === item.id
                              ? "bg-primary/20 text-primary border border-primary/30"
                              : "text-muted-foreground hover:text-primary"
                          } ${focusedIndex === globalIndex ? "bg-primary/10 ring-2 ring-primary/50" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            {item.icon && (
                              <item.icon className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors" />
                            )}
                            <span className="font-medium">{item.label}</span>
                            {item.badge && (
                              <Badge className="text-xs bg-pink-500/20 text-pink-400 border-pink-500/30">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
