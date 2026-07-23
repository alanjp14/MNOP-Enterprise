import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PingLatencyCardProps {
  name: string;
  host: string;
  latencyMs: number;
  status: "up" | "down" | "degraded";
  iconType: "google" | "cloudflare" | "microsoft" | "whatsapp" | "instagram" | "tiktok";
}

const icons = {
  google: (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
  cloudflare: (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="#F38020">
      <path d="M16.91 10.74a4.49 4.49 0 0 0-7.85-2.22 5.48 5.48 0 0 0-4.94 4.54A4.05 4.05 0 0 0 0 17.06c0 2.2 1.8 4 4 4h15.5c2.49 0 4.5-2.01 4.5-4.5 0-2.31-1.74-4.22-4.01-4.48zM19.5 19.56H4a2.5 2.5 0 0 1 0-5c.16 0 .32.02.47.05l1.09.21.36-1.05a3.98 3.98 0 0 1 3.76-2.71c.71 0 1.4.19 2.01.55l.93.55.57-.91a2.99 2.99 0 0 1 5.22 1.47v1.1l1.1.06a3.004 3.004 0 0 1 2.99 3.01c0 1.65-1.35 3.01-3 3.01z"/>
    </svg>
  ),
  microsoft: (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
      <path fill="#f35325" d="M1 1h10.5v10.5H1z"/>
      <path fill="#81bc06" d="M12.5 1H23v10.5H12.5z"/>
      <path fill="#05a6f0" d="M1 12.5h10.5V23H1z"/>
      <path fill="#ffba08" d="M12.5 12.5H23V23H12.5z"/>
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f09433"/>
          <stop offset="25%" stopColor="#e6683c"/>
          <stop offset="50%" stopColor="#dc2743"/>
          <stop offset="75%" stopColor="#cc2366"/>
          <stop offset="100%" stopColor="#bc1888"/>
        </linearGradient>
      </defs>
      <path fill="url(#ig-grad)" d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.85 3.9 2.31 7.15 2.16c1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07c-4.27.2-6.78 2.71-6.98 6.98C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.27 2.71 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.27-.2 6.78-2.71 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.27-2.71-6.78-6.98-6.98C15.67.01 15.26 0 12 0z"/>
      <path fill="url(#ig-grad)" d="M12 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4z"/>
      <circle fill="url(#ig-grad)" cx="18.41" cy="5.59" r="1.44"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.96-.5 3.86-1.57 5.43-1.43 2.15-3.8 3.51-6.38 3.54-3.13.04-6.19-1.92-7.39-4.89-1.23-3.05-.28-6.61 2.37-8.77l1.04-.79 2.66 3.19c-1.31.62-2.34 1.83-2.58 3.26-.22 1.25.07 2.58.91 3.5 1.13 1.22 3.01 1.48 4.45.69 1.34-.73 2.16-2.12 2.18-3.63V.02h4.22z" fill="currentColor"/>
    </svg>
  )
};

const iconBgs = {
  google: "bg-blue-50 dark:bg-blue-900/20 text-blue-500",
  cloudflare: "bg-orange-50 dark:bg-orange-900/20 text-orange-500",
  microsoft: "bg-blue-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200",
  whatsapp: "bg-green-50 dark:bg-green-900/20 text-green-500",
  instagram: "bg-pink-50 dark:bg-pink-900/20 text-pink-500",
  tiktok: "bg-slate-100 dark:bg-slate-800 text-black dark:text-white"
};

function getLatencyColor(latency: number): string {
  if (latency < 50) return "text-emerald-600 dark:text-emerald-400";
  if (latency < 100) return "text-amber-600 dark:text-amber-400";
  if (latency < 200) return "text-orange-600 dark:text-orange-400";
  return "text-rose-600 dark:text-rose-400";
}

function getStatusStyles(status: string): string {
  switch (status) {
    case "up": return "bg-emerald-500";
    case "degraded": return "bg-amber-500";
    case "down": return "bg-rose-500";
    default: return "bg-slate-500";
  }
}

export function PingLatencyCard({ name, host, latencyMs, status, iconType }: PingLatencyCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "flex items-center justify-between p-3 sm:p-4 rounded-xl min-w-0 w-full",
        "bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-sm",
        "border border-slate-200/80 dark:border-slate-800/80",
        "shadow-xs hover:shadow-md transition-all duration-200"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        <div className={cn("p-2 rounded-lg flex items-center justify-center shrink-0", iconBgs[iconType])}>
          {icons[iconType]}
        </div>

        <div className="flex flex-col min-w-0">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm truncate" title={name}>
            {name}
          </h3>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate" title={host}>
            {host}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end shrink-0 pl-2 border-l border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {status !== "down" && (
              <span className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                getStatusStyles(status)
              )}></span>
            )}
            <span className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              getStatusStyles(status)
            )}></span>
          </span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
            {status}
          </span>
        </div>
        
        <div className={cn("text-sm sm:text-base font-bold font-mono tracking-tight mt-0.5", getLatencyColor(latencyMs))}>
          {latencyMs.toFixed(0)}<span className="text-[10px] font-normal opacity-70 ml-0.5">ms</span>
        </div>
      </div>
    </motion.div>
  );
}
