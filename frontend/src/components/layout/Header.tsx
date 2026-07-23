import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Menu, Bell, PanelLeft, Calendar, Clock, Maximize2, Minimize2, LogOut } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale/id";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
import { playDownSound } from "@/utils/sound-alerts";
import { useAuthStore } from "@/stores/auth-store";

const routeNames: Record<string, string> = {
  "/": "Dashboard",
  "/traffic/router": "Live Traffic Router",
  "/traffic/switch": "Live Traffic Switch",
  "/topology": "Network Topology",
  "/sla/overview": "SLA Overview",
  "/sla/detail": "SLA Detail Report",
  "/devices": "Device Management",
  "/events": "Live Events",
  "/resources": "Resource Monitor",
  "/settings": "Settings",
};

interface HeaderProps {
  onMenuClick: () => void;
  onToggleSidebar: () => void;
  isSidebarHidden: boolean;
}

export function Header({ onMenuClick, onToggleSidebar, isSidebarHidden }: HeaderProps) {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("Failed to enter fullscreen mode:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const pageTitle = routeNames[location.pathname] || "Dashboard";

  return (
    <header className={cn(
      "sticky top-0 z-50 shrink-0 flex h-14 w-full items-center justify-between px-4 sm:px-6",
      "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs",
      "border-b border-slate-200 dark:border-slate-800",
      "transition-colors duration-300"
    )}>
      {/* Kiri: Menu/Show sidebar + Title */}
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Show sidebar button (visible when sidebar is hidden) */}
        {isSidebarHidden && (
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex p-2 -ml-2 rounded-md text-slate-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            title="Tampilkan sidebar"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
        )}

        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 hidden sm:block">
          {pageTitle}
        </h1>
      </div>

      {/* Tengah: Compact clock + date + Live API Status Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm bg-slate-100/60 dark:bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/40">
          <Clock className="h-3.5 w-3.5 text-amber-500 hidden sm:block" />
          <span className="font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
            {format(currentTime, "HH:mm:ss")}
          </span>
          <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">|</span>
          <Calendar className="h-3.5 w-3.5 text-slate-400 hidden md:block" />
          <span className="text-slate-600 dark:text-slate-400 hidden sm:inline">
            {format(currentTime, "EEEE, dd MMM yyyy", { locale: id })}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium hidden md:inline">WIB</span>
        </div>

        {/* Live Backend Connection Status Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[11px] font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono">API & DB ONLINE</span>
        </div>
      </div>

      {/* Kanan: Actions + User info */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
        >
          {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </button>

        <ThemeToggle />

        {/* Notification bell with Audio Alert Controls */}
        <div className="relative">
          <button
            onClick={() => playDownSound()}
            className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            title="Sistem Notifikasi Bersuara: Klik untuk Uji Coba Suara Alarm Down (3x Teeet)"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            </span>
          </button>
        </div>

        <div className="hidden sm:block h-7 w-px bg-slate-200 dark:bg-slate-700"></div>

        {/* User profile */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5 py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 font-bold text-xs shadow-md shadow-amber-500/20">
              {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : "U"}
            </div>
            <div className="hidden md:flex flex-col items-start mr-2">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">{user?.full_name || "Unknown"}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{user?.role || "User"}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 rounded-full text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Keluar (Logout)"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
