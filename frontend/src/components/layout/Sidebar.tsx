import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Activity, Network, Share2,
  BarChart3, FileText, Server, Bell, Cpu,
  Settings, ChevronLeft, ChevronRight, PanelLeftClose
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/traffic/router", label: "Live Traffic Router", icon: Activity },
  { path: "/traffic/switch", label: "Live Traffic Switch", icon: Network },
  { path: "/topology", label: "Network Topology", icon: Share2 },
  { path: "/sla/overview", label: "SLA Overview", icon: BarChart3 },
  { path: "/sla/detail", label: "SLA Detail Report", icon: FileText },
  { path: "/devices", label: "Device Management", icon: Server },
  { path: "/events", label: "Live Events", icon: Bell },
  { path: "/resources", label: "Resource Monitor", icon: Cpu },
  { path: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isHidden: boolean;
  setIsHidden: (value: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed, isHidden, setIsHidden, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? "80px" : "280px",
          x: isHidden ? "-100%" : "0%",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed top-0 left-0 z-50 h-screen flex flex-col",
          "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl",
          "border-r border-slate-200 dark:border-slate-800",
          "transition-transform duration-300 ease-in-out lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isHidden && "lg:pointer-events-none"
        )}
      >
        {/* Logo Area */}
        <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
              <span className="text-lg font-bold text-slate-900">KBU</span>
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-bold text-slate-800 dark:text-slate-100 truncate"
                >
                  PT Kapuas Bara Utama
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {/* Mobile Close Button */}
          <button
            className="lg:hidden p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            onClick={() => setIsMobileOpen(false)}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3 scrollbar-none">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                "hover:bg-slate-100 dark:hover:bg-slate-800/50",
                isActive
                  ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium shadow-sm shadow-amber-500/10"
                  : "text-slate-600 dark:text-slate-400"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-amber-600 dark:text-amber-400" : "group-hover:text-amber-500"
                  )} />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Controls */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 hidden lg:flex items-center gap-2">
          {/* Collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex flex-1 items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title={isCollapsed ? "Perluas sidebar" : "Kecilkan sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
          {/* Hide toggle */}
          {!isCollapsed && (
            <button
              onClick={() => setIsHidden(true)}
              className="flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              title="Sembunyikan sidebar"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          )}
        </div>
      </motion.aside>
    </>
  );
}
