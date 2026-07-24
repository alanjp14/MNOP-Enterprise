import { useState, useRef } from "react";
import type { ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Info, AlertTriangle, ShieldAlert, Zap, Filter, MapPin, Volume2 } from "lucide-react";
import { id } from "date-fns/locale/id";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEventStore } from "@/stores/event-store";
import type { LiveEvent } from "@/types";
import { playDownSound, playUpSound } from "@/utils/sound-alerts";

type SeverityFilter = "All" | "info" | "warning" | "error" | "critical";

const severityConfig: Record<LiveEvent["severity"], { icon: ElementType; color: string; bg: string; label: string }> = {
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10", label: "Info" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", label: "Warning" },
  error: { icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-500/10", label: "Error" },
  critical: { icon: ShieldAlert, color: "text-red-600", bg: "bg-red-600/10", label: "Critical" },
};

export default function LiveEventsPage() {
  const navigate = useNavigate();
  const { events } = useEventStore();
  const [filter, setFilter] = useState<SeverityFilter>("All");
  const listRef = useRef<HTMLDivElement>(null);

  const filteredEvents = events.filter((e) => filter === "All" || e.severity === filter);

  const handleShowLocation = (deviceName: string) => {
    navigate(`/topology?device=${encodeURIComponent(deviceName)}`);
  };

  return (
    <div className="w-full max-w-none px-6 py-4 space-y-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Sticky Header */}
      <div className="sticky -top-6 -mx-12 px-12 pt-6 pb-4 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="h-6 w-6 text-amber-500" />
              Live Event Log Real-Time Stream
              <span className="relative flex h-3 w-3 ml-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Total {events.length} real-time synchronized events logged</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Export Syslog Log & Audio Test Controls */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
              <Volume2 className="h-4 w-4 text-amber-500 ml-1" />
              <button
                onClick={() => playDownSound()}
                className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold transition-all active:scale-95"
                title="Uji coba suara alarm perangkat DOWN (3x Teeet)"
              >
                Test Down Sound
              </button>
              <button
                onClick={() => playUpSound()}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-bold transition-all active:scale-95"
                title="Uji coba suara notifikasi perangkat UP (1x Tiiiing)"
              >
                Test Up Sound
              </button>
              <button
                onClick={() => {
                  const logData = events
                    .map((e) => `[${new Date(e.timestamp).toISOString()}] [${e.severity.toUpperCase()}] [${e.source}] ${e.message}`)
                    .join("\n");
                  const blob = new Blob([logData], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `MNOP_Syslog_Collector_${new Date().toISOString().slice(0, 10)}.log`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="px-2.5 py-1 rounded-lg bg-sky-500 text-white font-bold transition-all active:scale-95 ml-1"
              >
                Export Syslog Log (.log)
              </button>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <Filter className="h-4 w-4 text-slate-400 ml-2" />
              {(["All", "info", "warning", "error", "critical"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize",
                    filter === s
                      ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs" ref={listRef}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Detailed Timestamp</th>
              <th className="px-6 py-4">Severity</th>
              <th className="px-6 py-4">Device / Source</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Message Log</th>
              <th className="px-6 py-4 text-right">Lokasi Topology</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            <AnimatePresence initial={false}>
              {filteredEvents.map((event) => {
                const config = severityConfig[event.severity] || severityConfig.info;
                const Icon = config.icon;
                return (
                  <motion.tr
                    key={event.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-200 font-mono text-xs font-semibold">
                      {format(event.timestamp, "EEEE, dd MMMM yyyy, HH:mm:ss", { locale: id })} WIB
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize", config.bg, config.color)}>
                        <Icon className="h-3.5 w-3.5" />
                        {config.label}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-200">
                      {event.source}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-semibold uppercase",
                          event.type === "up"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : event.type === "down"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        )}
                      >
                        {event.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {event.message}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleShowLocation(event.source)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl border border-amber-200/50 dark:border-amber-700/30 transition-all active:scale-95"
                      >
                        <MapPin className="h-3.5 w-3.5 text-amber-500" />
                        Lihat Lokasi
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {filteredEvents.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm">
            Tidak ada event log yang sesuai filter.
          </div>
        )}
      </div>
    </div>
  );
}
