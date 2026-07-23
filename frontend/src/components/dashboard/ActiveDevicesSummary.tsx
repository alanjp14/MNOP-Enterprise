import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Router, Network, Radio, Wifi, Shield, ChevronRight } from "lucide-react";
import type { ElementType } from "react";

export interface Device {
  id: string;
  name: string;
  type: string;
  vendor: string;
  model: string;
  location: string;
  status: "up" | "down";
}

export interface ActiveDevicesSummaryProps {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  devices: Device[];
}

const iconMap: Record<string, ElementType> = {
  router: Router,
  switch: Network,
  radio: Radio,
  ap: Wifi,
  firewall: Shield
};

export function ActiveDevicesSummary({ totalDevices, onlineDevices, devices }: ActiveDevicesSummaryProps) {
  const percentage = totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 0;
  
  // Mengurutkan perangkat, tampilkan sebagian untuk ringkasan
  const displayDevices = devices.slice(0, 6);

  return (
    <div className={cn(
      "flex flex-col h-full rounded-2xl overflow-hidden",
      "bg-white dark:bg-slate-900/80 backdrop-blur-sm",
      "border border-slate-200/80 dark:border-slate-800/80",
      "shadow-sm"
    )}>
      {/* Header Area */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Network Devices
        </h2>
        
        <div className="flex items-end justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {onlineDevices}
            </span>
            <span className="text-lg font-medium text-slate-500 dark:text-slate-400">
              / {totalDevices}
            </span>
          </div>
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
            percentage >= 90 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
            percentage >= 75 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
            "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
          )}>
            Active
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              percentage >= 90 ? "bg-emerald-500" : 
              percentage >= 75 ? "bg-amber-500" : "bg-rose-500"
            )}
          />
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="space-y-1">
          {displayDevices.map((device, index) => {
            const Icon = iconMap[device.type.toLowerCase()] || Network;
            const isUp = device.status === "up";
            
            return (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-all",
                  "hover:bg-slate-50 dark:hover:bg-slate-800/50 group cursor-default"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2.5 rounded-lg shrink-0",
                    isUp ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : 
                           "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                  )}>
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {device.name}
                    </span>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1.5 mt-0.5">
                      <span>{device.vendor} {device.model}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                      <span>{device.location}</span>
                    </div>
                  </div>
                </div>
                
                {/* Status Dot */}
                <div className="pl-4">
                  <span className="relative flex h-3 w-3">
                    {isUp && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                    <span className={cn(
                      "relative inline-flex rounded-full h-3 w-3",
                      isUp ? "bg-emerald-500" : "bg-rose-500"
                    )}></span>
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer Link */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
        <Link 
          to="/devices"
          className="flex items-center justify-center gap-2 w-full py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          View All Devices
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}
