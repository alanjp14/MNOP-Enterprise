import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale/id";
import { Clock } from "lucide-react";

export function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-xl backdrop-blur-md bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 shadow-xl relative overflow-hidden h-full min-h-[160px]">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Clock className="w-24 h-24" />
      </div>
      
      <div className="z-10 flex flex-col items-center">
        <div className="flex items-baseline space-x-2">
          <span className="text-5xl font-bold font-mono text-amber-500 tracking-wider tabular-nums drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
            {format(time, "HH:mm:ss")}
          </span>
          <span className="text-lg font-medium text-amber-500/70">WITA</span>
        </div>
        
        <div className="mt-2 text-sm font-medium text-slate-300 tracking-wide uppercase">
          {format(time, "EEEE, dd MMMM yyyy", { locale: id })}
        </div>
      </div>
    </div>
  );
}
