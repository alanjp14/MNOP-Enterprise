import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale/id";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { LiveEvent } from "@/types";
import { ArrowDownCircle, ArrowUpCircle, Info, AlertTriangle, AlertCircle, MapPin } from "lucide-react";

export interface LiveEventFeedProps {
  events: LiveEvent[];
  maxVisible?: number;
}

export function LiveEventFeed({ events, maxVisible = 10 }: LiveEventFeedProps) {
  const navigate = useNavigate();
  const displayEvents = events.slice(0, maxVisible);

  const getSeverityConfig = (severity: string, type: string) => {
    if (type === "up") return { color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/10", icon: <ArrowUpCircle className="w-4 h-4 text-emerald-500" /> };
    if (type === "down") return { color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-500/10", icon: <ArrowDownCircle className="w-4 h-4 text-rose-500" /> };
    
    switch (severity) {
      case "critical":
      case "error": return { color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", icon: <AlertCircle className="w-4 h-4 text-rose-500" /> };
      case "warning": return { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> };
      default: return { color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10", icon: <Info className="w-4 h-4 text-sky-500" /> };
    }
  };

  const handleShowLocation = (deviceName: string) => {
    navigate(`/topology?device=${encodeURIComponent(deviceName)}`);
  };

  return (
    <div className="flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden h-[520px]">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Event Log
        </h3>
        <span className="text-xs text-slate-400 font-medium">{events.length} events logged</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        <AnimatePresence initial={false}>
          {displayEvents.map((event) => {
            const config = getSeverityConfig(event.severity, event.type);
            const timeStr = formatDistanceToNow(event.timestamp, { addSuffix: true, locale: localeId });
            
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex items-start justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 transition-colors",
                  config.bg
                )}
              >
                <div className="flex items-start gap-3 min-w-0 pr-2">
                  <div className="mt-0.5 shrink-0">{config.icon}</div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{event.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{event.source}</span>
                      <span className={cn("text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full border border-current opacity-80", config.color)}>
                        {event.type}
                      </span>
                      <span className="text-[10px] text-slate-400">{timeStr}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleShowLocation(event.source || event.message)}
                  className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 px-2 py-1 rounded-lg border border-amber-200/50 dark:border-amber-700/30 transition-all active:scale-95"
                  title="Lihat Lokasi Device di Network Topology"
                >
                  <MapPin className="w-3 h-3 text-amber-500" />
                  <span>Lihat Lokasi</span>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {displayEvents.length === 0 && (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            Tidak ada event terbaru
          </div>
        )}
      </div>
    </div>
  );
}
