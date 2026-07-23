import { useMemo, useId } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrafficData {
  time: string;
  rx: number;
  tx: number;
}

interface LiveTrafficMiniChartProps {
  title: string;
  interfaceName: string;
  data: TrafficData[];
  color?: { rx: string; tx: string };
}

export function LiveTrafficMiniChart({
  title,
  interfaceName,
  data,
  color = { rx: "#0ea5e9", tx: "#10b981" }
}: LiveTrafficMiniChartProps) {
  const chartId = useId().replace(/:/g, "_");

  const currentTraffic = useMemo(() => {
    if (!data.length) return { rx: 0, tx: 0 };
    return data[data.length - 1];
  }, [data]);

  const peakRx = useMemo(() => {
    if (!data.length) return 0;
    return Math.max(...data.map((d) => d.rx));
  }, [data]);

  return (
    <div className={cn(
      "flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5",
      "shadow-xs dark:shadow-none hover:shadow-md transition-all duration-300 relative overflow-hidden"
    )}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{interfaceName}</p>
        </div>
        
        <div className="flex gap-3 text-right">
          <div className="flex flex-col items-end">
            <span className="flex items-center text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <ArrowDown className="w-3 h-3 mr-0.5 text-sky-500" />
              Download
            </span>
            <span className="text-sm sm:text-base font-bold font-mono text-sky-600 dark:text-sky-400 tabular-nums">
              {currentTraffic.rx.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">Mbps</span>
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="flex items-center text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <ArrowUp className="w-3 h-3 mr-0.5 text-emerald-500" />
              Upload
            </span>
            <span className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {currentTraffic.tx.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">Mbps</span>
            </span>
          </div>
        </div>
      </div>
      
      {/* Chart container */}
      <div className="h-[120px] w-full mt-2 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`colorRx_${chartId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color.rx} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color.rx} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id={`colorTx_${chartId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color.tx} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color.tx} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900/95 text-white border border-slate-800 p-2.5 rounded-xl shadow-xl text-xs backdrop-blur-md">
                      <p className="text-slate-400 mb-1 font-mono text-[10px]">{label}</p>
                      <div className="flex flex-col gap-1 font-mono">
                        <span className="text-sky-400 font-semibold flex justify-between gap-4">
                          <span>↓ DL:</span> <span>{Number(payload[0]?.value).toFixed(1)} Mbps</span>
                        </span>
                        <span className="text-emerald-400 font-semibold flex justify-between gap-4">
                          <span>↑ UL:</span> <span>{Number(payload[1]?.value).toFixed(1)} Mbps</span>
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="rx"
              stroke={color.rx}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#colorRx_${chartId})`}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="tx"
              stroke={color.tx}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#colorTx_${chartId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
        <span>Peak Download: <strong className="font-mono text-slate-700 dark:text-slate-300">{peakRx.toFixed(1)} Mbps</strong></span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live 1s</span>
      </div>
    </div>
  );
}
