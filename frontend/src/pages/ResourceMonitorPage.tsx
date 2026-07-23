import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Cpu, MemoryStick, HardDrive, Thermometer, Activity, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResourceDataPoint {
  time: string;
  value: number;
}

interface ResourceCardProps {
  title: string;
  icon: LucideIcon;
  data: ResourceDataPoint[];
  color: string;
  unit?: string;
}

const SITES_RESOURCE_CONFIG = [
  { id: "BatuahSite", label: "Batuah Site (Mining)", routerName: "MikroTik CCR2004", switchName: "MikroTik CRS320" },
  { id: "HeadOffice", label: "Head Office Jakarta", routerName: "FortiGate 100F HQ", switchName: "Cisco Catalyst 9300" },
  { id: "JettyPort", label: "Jetty / Port Terminal", routerName: "MikroTik RB5009", switchName: "MikroTik CRS328" },
  { id: "MessPalangkaraya", label: "Hub Palangkaraya", routerName: "MikroTik hEX S", switchName: "Ruijie RG-NBS3100" },
  { id: "MessBuntok", label: "Hub Buntok", routerName: "MikroTik hEX S", switchName: "Ruijie RG-NBS3100" },
];

const generateData = (base: number): ResourceDataPoint[] => Array.from({ length: 60 }).map((_, i) => ({
  time: String(i),
  value: Math.max(0, Math.min(100, base + (Math.random() * 20 - 10)))
}));

const ResourceCard = ({ title, icon: Icon, data, color, unit = "%" }: ResourceCardProps) => {
  const current = data[data.length - 1]?.value.toFixed(1);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-base">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          {title}
        </div>
        <div className="text-3xl font-extrabold font-mono" style={{ color }}>{current}{unit}</div>
      </div>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <YAxis domain={[0, 100]} hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px' }}
              itemStyle={{ fontSize: '14px' }}
            />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function ResourceMonitorPage() {
  const [activeSite, setActiveSite] = useState("BatuahSite");
  const [deviceNode, setDeviceNode] = useState<"router" | "switch">("router");

  const [cpu, setCpu] = useState(generateData(45));
  const [memory, setMemory] = useState(generateData(60));
  const [storage, setStorage] = useState(generateData(25));
  const [temp, setTemp] = useState(generateData(55));

  const currentSiteObj = SITES_RESOURCE_CONFIG.find((s) => s.id === activeSite) || SITES_RESOURCE_CONFIG[0];
  const currentNodeName = deviceNode === "router" ? currentSiteObj.routerName : currentSiteObj.switchName;

  useEffect(() => {
    const baseCpu = deviceNode === "router" ? 42 : 35;
    const baseRam = deviceNode === "router" ? 58 : 48;
    const baseStorage = deviceNode === "router" ? 30 : 20;
    const baseTemp = deviceNode === "router" ? 54 : 46;

    setCpu(generateData(baseCpu));
    setMemory(generateData(baseRam));
    setStorage(generateData(baseStorage));
    setTemp(generateData(baseTemp));

    const interval = setInterval(() => {
      const updateData = (prev: ResourceDataPoint[]) => {
        const newData = [...prev.slice(1)];
        newData.push({
          time: String(Date.now()),
          value: Math.max(0, Math.min(100, newData[newData.length - 1].value + (Math.random() * 6 - 3)))
        });
        return newData;
      };
      setCpu(p => updateData(p));
      setMemory(p => updateData(p));
      setStorage(p => updateData(p));
      setTemp(p => updateData(p));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSite, deviceNode]);

  return (
    <div className="w-full max-w-none px-6 py-4 space-y-6 pb-24 md:pb-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-amber-500" />
            System Resource Monitor &mdash; {currentSiteObj.label} ({currentNodeName})
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Real-time CPU, RAM, Storage, & Temperature Health Monitoring</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Site Filter Tabs */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs font-semibold">
            <Building2 className="h-4 w-4 text-slate-400 ml-2" />
            {SITES_RESOURCE_CONFIG.map((site) => (
              <button
                key={site.id}
                onClick={() => setActiveSite(site.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-colors",
                  activeSite === site.id
                    ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                {site.label}
              </button>
            ))}
          </div>

          {/* Device Node Switcher */}
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <button 
              onClick={() => setDeviceNode("router")}
              className={cn(
                "px-4 py-1.5 rounded-lg transition-colors",
                deviceNode === "router" ? "bg-amber-500 text-slate-950 font-bold shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              Core Router ({currentSiteObj.routerName})
            </button>
            <button 
              onClick={() => setDeviceNode("switch")}
              className={cn(
                "px-4 py-1.5 rounded-lg transition-colors",
                deviceNode === "switch" ? "bg-amber-500 text-slate-950 font-bold shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              Core Switch ({currentSiteObj.switchName})
            </button>
          </div>
        </div>
      </div>

      {/* 4 Full-Width Resource Charts */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={`${activeSite}-${deviceNode}`}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <ResourceCard title="CPU Usage" icon={Cpu} data={cpu} color="#3b82f6" />
        <ResourceCard title="Memory Usage" icon={MemoryStick} data={memory} color="#8b5cf6" />
        <ResourceCard title="Storage Usage" icon={HardDrive} data={storage} color="#10b981" />
        <ResourceCard title="Temperature" icon={Thermometer} data={temp} color="#f59e0b" unit="°C" />
      </motion.div>
    </div>
  );
}
