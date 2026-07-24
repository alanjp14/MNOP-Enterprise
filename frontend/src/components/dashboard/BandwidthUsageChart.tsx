import { useState, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type TimeRange = "Menit" | "Jam" | "Harian" | "Bulanan" | "Custom Date";

interface DataPoint {
  time: string;
  download: number;
  upload: number;
}

export default function BandwidthUsageChart({ 
  className, 
  title = "Bandwidth Usage (Rx/Tx)" 
}: { 
  className?: string;
  title?: string;
}) {
  const [timeRange, setTimeRange] = useState<TimeRange>("Jam");

  // Generate dummy data based on timeRange
  const data = useMemo(() => {
    const generate = (count: number, labelPrefix: string, downloadBase: number, uploadBase: number): DataPoint[] => {
      return Array.from({ length: count }).map((_, i) => ({
        time: `${labelPrefix} ${i + 1}`,
        download: Math.floor(Math.random() * 50) + downloadBase,
        upload: Math.floor(Math.random() * 30) + uploadBase,
      }));
    };

    switch (timeRange) {
      case "Menit":
        return generate(15, "Menit", 80, 40);
      case "Jam":
        return generate(24, "Jam", 150, 60);
      case "Harian":
        return generate(7, "Hari", 300, 100);
      case "Bulanan":
        return generate(12, "Bulan", 1200, 400);
      case "Custom Date":
        return generate(10, "Tgl", 200, 80);
      default:
        return [];
    }
  }, [timeRange]);

  const ranges: TimeRange[] = ["Menit", "Jam", "Harian", "Bulanan", "Custom Date"];

  return (
    <div className={cn("bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col h-full", className)}>
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{title}</h3>
            <p className="text-xs text-slate-500 font-medium">Rekapitulasi trafik jaringan Historis</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-x-auto w-full xl:w-auto">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5",
                timeRange === range
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {range === "Custom Date" ? <CalendarIcon className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#64748b' }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#64748b' }} 
              tickFormatter={(val) => `${val} Mbps`}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                borderRadius: '12px', 
                border: 'none',
                color: '#f8fafc',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
              itemStyle={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="download" 
              name="Download (Rx)"
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorDownload)" 
              animationDuration={800}
            />
            <Area 
              type="monotone" 
              dataKey="upload" 
              name="Upload (Tx)"
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorUpload)" 
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
