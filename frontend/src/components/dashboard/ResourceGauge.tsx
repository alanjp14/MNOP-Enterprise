import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface ResourceGaugeProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  icon: ReactNode;
  thresholds?: { warning: number; critical: number };
}

export function ResourceGauge({
  label,
  value,
  max,
  unit,
  icon,
  thresholds = { warning: 75, critical: 90 }
}: ResourceGaugeProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  let statusColor = "url(#gradient-ok)";
  let textColor = "text-emerald-500 dark:text-emerald-400";
  let bgGlow = "bg-emerald-500/10";
  
  if (percentage >= thresholds.critical) {
    statusColor = "url(#gradient-critical)";
    textColor = "text-rose-500 dark:text-rose-400";
    bgGlow = "bg-rose-500/10";
  } else if (percentage >= thresholds.warning) {
    statusColor = "url(#gradient-warning)";
    textColor = "text-amber-500 dark:text-amber-400";
    bgGlow = "bg-amber-500/10";
  }

  // Semi-circle SVG maths
  const radius = 60;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const warningOffset = circumference - (thresholds.warning / 100) * circumference;
  const criticalOffset = circumference - (thresholds.critical / 100) * circumference;

  return (
    <div className={cn(
      "relative bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col",
      "shadow-sm dark:shadow-none hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
    )}>
      {/* Background patterns */}
      <div className={cn("absolute inset-0 transition-colors duration-500 pointer-events-none", bgGlow)} />
      <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" fillRule="evenodd"><g fill="currentColor" fillOpacity="1"><path d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/></g></g>
        </svg>
      </div>

      <div className="flex items-center gap-2 mb-6 z-10">
        <div className={cn("p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700", textColor)}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide">{label}</h3>
      </div>

      <div className="relative flex flex-col items-center justify-center flex-1 z-10">
        <div className="relative h-[70px] flex items-end justify-center overflow-hidden">
          <svg
            width={radius * 2}
            height={radius}
            className="transform"
          >
            <defs>
              <linearGradient id="gradient-ok" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <linearGradient id="gradient-warning" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
              <linearGradient id="gradient-critical" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#f87171" />
              </linearGradient>
            </defs>
            
            {/* Background Arc */}
            <path
              stroke="currentColor"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="text-slate-100 dark:text-slate-800"
              d={`M ${strokeWidth/2} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius*2 - strokeWidth/2} ${radius}`}
            />
            
            {/* Value Arc */}
            <motion.path
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              stroke={statusColor}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeLinecap="round"
              className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
              d={`M ${strokeWidth/2} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius*2 - strokeWidth/2} ${radius}`}
            />
            
            {/* Threshold markers */}
            <circle cx={radius} cy={radius} r={normalizedRadius} fill="none" stroke="currentColor" className="text-slate-300 dark:text-slate-600" strokeWidth="3" strokeDasharray={`2 ${circumference}`} strokeDashoffset={warningOffset} transform={`rotate(-180 ${radius} ${radius})`} />
            <circle cx={radius} cy={radius} r={normalizedRadius} fill="none" stroke="currentColor" className="text-rose-300 dark:text-rose-900/50" strokeWidth="3" strokeDasharray={`2 ${circumference}`} strokeDashoffset={criticalOffset} transform={`rotate(-180 ${radius} ${radius})`} />
          </svg>
          
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end pb-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">
                {value % 1 !== 0 ? value.toFixed(1) : value}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{unit}</span>
            </div>
          </div>
        </div>
        
        <div className="w-full flex justify-between mt-4 px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <span>0 {unit}</span>
          <span>{max} {unit}</span>
        </div>
      </div>
    </div>
  );
}
