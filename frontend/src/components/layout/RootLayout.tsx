import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

export function RootLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex overflow-hidden selection:bg-amber-500/30 selection:text-white transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isHidden={isHidden}
        setIsHidden={setIsHidden}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className={cn(
        "flex flex-col flex-1 h-screen min-w-0 overflow-hidden transition-all duration-300 ease-in-out",
        isHidden
          ? "lg:ml-0"
          : isCollapsed
            ? "lg:ml-[80px]"
            : "lg:ml-[280px]"
      )}>
        {/* Top Header */}
        <Header
          onMenuClick={() => setIsMobileOpen(true)}
          onToggleSidebar={() => setIsHidden(!isHidden)}
          isSidebarHidden={isHidden}
        />

        {/* Scrollable Full-Width Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
