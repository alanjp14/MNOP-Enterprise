import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { LayoutGrid, ArrowDown, ArrowUp, Building2, Server } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrafficData {
  time: string;
  download: number;
  upload: number;
}

const SWITCH_SITES = [
  { id: "batuah", name: "Batuah Site (Core)", model: "MikroTik CRS320-8P-8B-4S+", ip: "10.0.0.2" },
  { id: "ho", name: "Head Office Jakarta", model: "Cisco Catalyst 9300", ip: "172.16.0.2" },
  { id: "jetty", name: "Jetty / Port Terminal", model: "MikroTik CRS328-24P-4S+", ip: "10.0.1.16" },
  { id: "pky", name: "Mess Hub Palangkaraya", model: "Ruijie RG-NBS3100-24GT", ip: "192.168.10.2" },
  { id: "bnt", name: "Mess Hub Buntok", model: "Ruijie RG-NBS3100-24GT", ip: "192.168.20.2" },
];

const generateInitialData = (baseDl: number, baseUl: number): TrafficData[] => {
  return Array.from({ length: 40 }).map((_, i) => {
    return {
      time: String(i),
      download: Math.max(0, baseDl + (Math.random() * baseDl * 0.4 - baseDl * 0.2)),
      upload: Math.max(0, baseUl + (Math.random() * baseUl * 0.4 - baseUl * 0.2)),
    };
  });
};

const PortChart = ({ 
  port, 
  device, 
  data, 
  large = false 
}: { 
  port: string; 
  device: string; 
  data: TrafficData[]; 
  large?: boolean 
}) => {
  const currentDl = data[data.length - 1]?.download.toFixed(1) || "0.0";
  const currentUl = data[data.length - 1]?.upload.toFixed(1) || "0.0";
  
  const dlColor = "#06b6d4"; // cyan
  const ulColor = "#22c55e"; // green

  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${large ? 'col-span-1 md:col-span-2 lg:col-span-4 p-6' : ''}`}
    >
      <div className={`mb-3 flex justify-between items-start ${large ? 'flex-row' : 'flex-col gap-2'}`}>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{port}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{device}</p>
        </div>
        <div className={`flex gap-3 ${large ? '' : 'w-full justify-between'}`}>
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-slate-500 flex items-center gap-1"><ArrowDown className="h-3 w-3 text-cyan-500"/> DL</span>
            <span className={`font-bold text-cyan-600 dark:text-cyan-400 ${large ? 'text-lg' : 'text-sm'}`}>{currentDl}</span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-slate-500 flex items-center gap-1"><ArrowUp className="h-3 w-3 text-green-500"/> UL</span>
            <span className={`font-bold text-green-600 dark:text-green-400 ${large ? 'text-lg' : 'text-sm'}`}>{currentUl}</span>
          </div>
        </div>
      </div>
      
      <div className={large ? "h-48 w-full" : "h-20 w-full"}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad_dl_${port}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={dlColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={dlColor} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id={`grad_ul_${port}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ulColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={ulColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="download" stroke={dlColor} strokeWidth={1.5} fillOpacity={1} fill={`url(#grad_dl_${port})`} isAnimationActive={false} />
            <Area type="monotone" dataKey="upload" stroke={ulColor} strokeWidth={1.5} fillOpacity={1} fill={`url(#grad_ul_${port})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default function LiveTrafficSwitchPage() {
  const [selectedSiteId, setSelectedSiteId] = useState("batuah");

  const [uplink, setUplink] = useState<TrafficData[]>(() => generateInitialData(150, 60));
  const [ports, setPorts] = useState<TrafficData[][]>(() => 
    Array.from({ length: 16 }).map(() => generateInitialData(Math.random() * 20 + 2, Math.random() * 10 + 1))
  );

  const activeSite = SWITCH_SITES.find((s) => s.id === selectedSiteId) || SWITCH_SITES[0];

  useEffect(() => {
    const interval = setInterval(() => {
      setUplink(prev => {
        const newData = [...prev.slice(1)];
        newData.push({
          time: String(Date.now()),
          download: Math.max(0, newData[newData.length - 1].download + (Math.random() * 10 - 5)),
          upload: Math.max(0, newData[newData.length - 1].upload + (Math.random() * 5 - 2.5)),
        });
        return newData;
      });

      setPorts(prevPorts => prevPorts.map((portData, idx) => {
        const newData = [...portData.slice(1)];
        const volatility = (idx % 3 === 0) ? 5 : 1;
        newData.push({
          time: String(Date.now()),
          download: Math.max(0, newData[newData.length - 1].download + (Math.random() * volatility - volatility/2)),
          upload: Math.max(0, newData[newData.length - 1].upload + (Math.random() * volatility - volatility/2)),
        });
        return newData;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-none px-6 py-4 space-y-6">
      {/* Sticky Header */}
      <div className="sticky -top-6 -mx-12 px-12 pt-6 pb-4 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-amber-500" />
              Live Traffic Switch Monitor
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Core & Branch Switch Port Bandwidth Monitoring</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Multi-Site Selector Tabs */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs font-semibold">
              <Building2 className="h-4 w-4 text-slate-400 ml-2" />
              {SWITCH_SITES.map((site) => (
                <button
                  key={site.id}
                  onClick={() => setSelectedSiteId(site.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-colors",
                    selectedSiteId === site.id
                      ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  {site.name.split(" ")[0]} Site
                </button>
              ))}
            </div>

            <div className="hidden sm:flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-2 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <Server className="h-5 w-5 text-amber-500" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{activeSite.model}</span>
                <span className="text-[11px] text-emerald-500 flex items-center gap-1 font-mono">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  Online • {activeSite.ip}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.div 
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <PortChart port="Ether1" device={`UPLINK to Router (${activeSite.name})`} data={uplink} large />
        
        {ports.map((data, idx) => (
          <PortChart 
            key={idx}
            port={`Ether${idx + 2}`} 
            device={`Connected Device ${idx + 1}`} 
            data={data} 
          />
        ))}
      </motion.div>
    </div>
  );
}
