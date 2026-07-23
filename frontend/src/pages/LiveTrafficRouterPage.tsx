import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Server, ArrowDown, ArrowUp, Zap, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrafficData {
  time: string;
  download: number;
  upload: number;
}

const SITES_CONFIG = [
  { id: "batuah", name: "Batuah Site (Core Mining)", routerModel: "MikroTik CCR2004-16G-2S+", ip: "10.0.0.1", wan1Name: "WAN1 Starlink Primary", wan2Name: "WAN2 Starlink Secondary", wan3Name: "WAN3 Lintasmaya Radiolink", trunkName: "Trunk to Core Switch" },
  { id: "ho", name: "Head Office Jakarta", routerModel: "FortiGate 100F / CCR2004", ip: "172.16.0.1", wan1Name: "Biznet Fiber Primary", wan2Name: "Telkom Astinet Backup", wan3Name: "SD-WAN Overlay", trunkName: "LAN Core Backbone" },
  { id: "jetty", name: "Jetty / Port Terminal", routerModel: "MikroTik RB5009UG+S+", ip: "10.0.1.15", wan1Name: "Starlink Maritime", wan2Name: "Radiolink Site Link", wan3Name: "Cellular 4G Failover", trunkName: "Port Switch Uplink" },
  { id: "pky", name: "Mess Hub Palangkaraya", routerModel: "MikroTik hEX S", ip: "192.168.10.1", wan1Name: "Indihome Fiber", wan2Name: "VPN WireGuard Tunnel", wan3Name: "Local Wifi Mesh", trunkName: "Office LAN Switch" },
  { id: "bnt", name: "Mess Hub Buntok", routerModel: "MikroTik hEX S", ip: "192.168.20.1", wan1Name: "Icon+ Fiber Primary", wan2Name: "VPN IPsec Tunnel", wan3Name: "4G LTE Gateway", trunkName: "Basecamp LAN Switch" },
];

const generateInitialData = (baseDownload: number, baseUpload: number): TrafficData[] => {
  return Array.from({ length: 60 }).map((_, i) => {
    const now = new Date();
    now.setSeconds(now.getSeconds() - (59 - i));
    return {
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      download: Math.max(0, baseDownload + (Math.random() * 40 - 20)),
      upload: Math.max(0, baseUpload + (Math.random() * 20 - 10)),
    };
  });
};

const TrafficChart = ({ 
  title, 
  subtitle, 
  data, 
  dlColor, 
  ulColor,
  chartKey
}: { 
  title: string; 
  subtitle: string; 
  data: TrafficData[]; 
  dlColor: string; 
  ulColor: string;
  chartKey: string;
}) => {
  const currentDl = data[data.length - 1]?.download.toFixed(1) || "0.0";
  const currentUl = data[data.length - 1]?.upload.toFixed(1) || "0.0";
  const peakDl = Math.max(...data.map(d => d.download)).toFixed(1);
  const avgDl = (data.reduce((acc, d) => acc + d.download, 0) / data.length).toFixed(1);

  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
              <ArrowDown className="h-3 w-3" style={{ color: dlColor }} /> Download
            </span>
            <span className="text-lg font-bold font-mono" style={{ color: dlColor }}>{currentDl} <span className="text-xs font-normal">Mbps</span></span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
              <ArrowUp className="h-3 w-3" style={{ color: ulColor }} /> Upload
            </span>
            <span className="text-lg font-bold font-mono" style={{ color: ulColor }}>{currentUl} <span className="text-xs font-normal">Mbps</span></span>
          </div>

          <div className="hidden sm:flex flex-col border-l border-slate-200 dark:border-slate-800 pl-4 items-end">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Peak DL</span>
            <span className="text-sm font-bold font-mono text-slate-700 dark:text-slate-300">{peakDl} <span className="text-[10px] font-normal">Mbps</span></span>
          </div>
        </div>
      </div>
      
      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad_dl_${chartKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={dlColor} stopOpacity={0.35}/>
                <stop offset="95%" stopColor={dlColor} stopOpacity={0.02}/>
              </linearGradient>
              <linearGradient id={`grad_ul_${chartKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ulColor} stopOpacity={0.35}/>
                <stop offset="95%" stopColor={ulColor} stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900/95 text-white border border-slate-800 p-3 rounded-xl shadow-xl text-xs backdrop-blur-md font-mono">
                      <p className="text-slate-400 mb-1.5 text-[11px] font-sans font-medium">{label}</p>
                      <div className="flex flex-col gap-1">
                        <span style={{ color: dlColor }} className="font-semibold flex justify-between gap-6">
                          <span>↓ Download:</span> <span>{Number(payload[0]?.value).toFixed(2)} Mbps</span>
                        </span>
                        <span style={{ color: ulColor }} className="font-semibold flex justify-between gap-6">
                          <span>↑ Upload:</span> <span>{Number(payload[1]?.value).toFixed(2)} Mbps</span>
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area type="monotone" dataKey="download" name="Download" stroke={dlColor} strokeWidth={2.5} fillOpacity={1} fill={`url(#grad_dl_${chartKey})`} isAnimationActive={false} />
            <Area type="monotone" dataKey="upload" name="Upload" stroke={ulColor} strokeWidth={2.5} fillOpacity={1} fill={`url(#grad_ul_${chartKey})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
        <span>Average Download: <strong className="font-mono text-slate-700 dark:text-slate-300">{avgDl} Mbps</strong></span>
        <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
          <Zap className="h-3.5 w-3.5" /> Live Streaming (1s interval)
        </span>
      </div>
    </motion.div>
  );
};

export default function LiveTrafficRouterPage() {
  const [selectedSiteId, setSelectedSiteId] = useState("batuah");

  const [wan1, setWan1] = useState<TrafficData[]>(() => generateInitialData(80, 20));
  const [wan2, setWan2] = useState<TrafficData[]>(() => generateInitialData(70, 15));
  const [wan3, setWan3] = useState<TrafficData[]>(() => generateInitialData(50, 40));
  const [trunk, setTrunk] = useState<TrafficData[]>(() => generateInitialData(200, 75));

  const activeSite = SITES_CONFIG.find((s) => s.id === selectedSiteId) || SITES_CONFIG[0];

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const updateData = (prev: TrafficData[]) => {
        const newData = [...prev.slice(1)];
        const lastDl = newData[newData.length - 1].download;
        const lastUl = newData[newData.length - 1].upload;
        newData.push({
          time: now,
          download: Math.max(0, lastDl + (Math.random() * 10 - 5)),
          upload: Math.max(0, lastUl + (Math.random() * 5 - 2.5)),
        });
        return newData;
      };

      setWan1(prev => updateData(prev));
      setWan2(prev => updateData(prev));
      setWan3(prev => updateData(prev));
      setTrunk(prev => updateData(prev));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-none px-6 py-4 space-y-6">
      {/* Header & Site Selection */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-amber-500" />
            Live Traffic Router Monitor
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Core Router Bandwidth & Throughput Monitoring across Multi-Site Network</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Multi-Site Selector Tabs */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs font-semibold">
            <Building2 className="h-4 w-4 text-slate-400 ml-2" />
            {SITES_CONFIG.map((site) => (
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
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{activeSite.routerModel}</span>
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

      <motion.div 
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <TrafficChart 
          title={`WAN1 (${activeSite.wan1Name})`} 
          subtitle="Primary Internet Uplink" 
          chartKey="wan1"
          data={wan1} 
          dlColor="#0ea5e9"
          ulColor="#10b981"
        />
        <TrafficChart 
          title={`WAN2 (${activeSite.wan2Name})`} 
          subtitle="Secondary Internet / Backup" 
          chartKey="wan2"
          data={wan2} 
          dlColor="#3b82f6"
          ulColor="#22c55e"
        />
        <TrafficChart 
          title={`WAN3 (${activeSite.wan3Name})`} 
          subtitle="Radiolink / Overlay Link" 
          chartKey="wan3"
          data={wan3} 
          dlColor="#8b5cf6"
          ulColor="#f59e0b"
        />
        <TrafficChart 
          title={`Trunk (${activeSite.trunkName})`} 
          subtitle="Switch Core Backbone" 
          chartKey="trunk"
          data={trunk} 
          dlColor="#06b6d4"
          ulColor="#f97316"
        />
      </motion.div>
    </div>
  );
}
