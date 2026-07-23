import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SlaGaugeCardProps {
  title: string;
  percentage: number;
  target: number;
  variant: "wan" | "trunk" | "switch";
  subtitle?: string;
}

export function SlaGaugeCard({ title, percentage, target, variant, subtitle }: SlaGaugeCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = percentage;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = start + (end - start) * (1 - Math.pow(1 - progress, 3));

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [percentage]);

  const radius = 56;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (displayValue / 100) * circumference;

  const gradients = {
    wan: {
      from: "#34d399",
      to: "#14b8a6",
      border: "border-t-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400"
    },
    trunk: {
      from: "#22d3ee",
      to: "#3b82f6",
      border: "border-t-cyan-500",
      text: "text-cyan-600 dark:text-cyan-400"
    },
    switch: {
      from: "#fbbf24",
      to: "#f97316",
      border: "border-t-amber-500",
      text: "text-amber-600 dark:text-amber-400"
    }
  };

  const config = gradients[variant];

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-3",
      "shadow-xs hover:border-amber-400 transition-all duration-200",
      "border-t-2", config.border
    )}>
      <div className="relative flex flex-col items-center justify-center">
        <div className="relative w-[120px] h-[120px] flex items-center justify-center">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90 drop-shadow-xs"
          >
            <defs>
              <linearGradient id={`gradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={config.from} />
                <stop offset="100%" stopColor={config.to} />
              </linearGradient>
            </defs>
            <circle
              stroke="currentColor"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="text-slate-100 dark:text-slate-800"
            />
            <circle
              stroke={`url(#gradient-${variant})`}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset, transition: "stroke-dashoffset 1s ease-out" }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
              {displayValue.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="mt-2 text-center w-full">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-black dark:text-slate-400 font-normal truncate mt-0.5">{subtitle}</p>
          )}

          <div className="mt-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 flex overflow-hidden">
            <div 
              className="h-full bg-slate-300 dark:bg-slate-600 transition-all duration-1000"
              style={{ width: `${target}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1.5 text-[10.5px] uppercase tracking-tight">
            <span className="text-black dark:text-slate-100 font-normal">TARGET: {target}%</span>
            <span className={cn(percentage >= target ? config.text : "text-rose-500 dark:text-rose-400", "font-normal")}>
              ACTUAL: {percentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
