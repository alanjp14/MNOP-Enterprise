import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Cpu, MemoryStick, HardDrive, Thermometer, Activity, Building2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

import type { LiveEvent, TrafficData } from "@/types";
import { useEventStore } from "@/stores/event-store";

import { SlaGaugeCard } from "@/components/dashboard/SlaGaugeCard";
import { LiveTrafficMiniChart } from "@/components/dashboard/LiveTrafficMiniChart";
import { PingLatencyCard } from "@/components/dashboard/PingLatencyCard";
import { LiveEventFeed } from "@/components/dashboard/LiveEventFeed";
import { ActiveDevicesSummary } from "@/components/dashboard/ActiveDevicesSummary";
import { ResourceGauge } from "@/components/dashboard/ResourceGauge";
import BandwidthUsageChart from "@/components/dashboard/BandwidthUsageChart";

// Framer Motion Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

interface SiteConfig {
  id: string;
  name: string;
  routerName: string;
  switchName: string;
  wans: { wan1: string; wan2: string; wan3: string; trunk: string };
  switchPorts: { port: string; label: string }[];
  devices: { id: string; name: string; type: string; vendor: string; model: string; location: string; status: "up" | "down" }[];
}

const DASHBOARD_SITES: SiteConfig[] = [
  {
    id: "batuah",
    name: "Batuah Site (Core Mining)",
    routerName: "MikroTik CCR2004-16G-2S+",
    switchName: "MikroTik CRS320-8P-8B-4S+",
    wans: { wan1: "WAN1 Starlink Primary (Ether1)", wan2: "WAN2 Starlink Secondary (Ether2)", wan3: "WAN3 Lintasmaya Radiolink (Ether3)", trunk: "Trunk to Core Switch (Ether6)" },
    switchPorts: [
      { port: "Ether2", label: "Radio PIT-1" },
      { port: "Ether3", label: "Radio PIT-2" },
      { port: "Ether4", label: "Radio Office" },
      { port: "Ether5", label: "Radio Workshop" },
      { port: "Ether6", label: "Radio Mess" },
      { port: "Ether7", label: "Radio Port" },
      { port: "Ether8", label: "Radio Jetty" },
      { port: "Ether9", label: "Radio Fuel" },
      { port: "Ether10", label: "Radio Weigh" },
      { port: "Ether11", label: "Radio Clinic" },
      { port: "Ether12", label: "Radio Camp-A" },
      { port: "Ether13", label: "Radio Camp-B" },
      { port: "Ether14", label: "Radio Warehouse" },
      { port: "Ether15", label: "Radio Security" },
      { port: "Ether16", label: "Radio Parking" },
    ],
    devices: [
      { id: "1", name: "CCR2004-16G-2S+", type: "Router", vendor: "MikroTik", model: "CCR2004", location: "Core", status: "up" },
      { id: "2", name: "CRS320-8P-8B-4S+", type: "Switch", vendor: "MikroTik", model: "CRS320", location: "Core", status: "up" },
      { id: "3", name: "FortiGate 60F", type: "Firewall", vendor: "Fortinet", model: "FG-60F", location: "Edge", status: "up" },
      { id: "4", name: "Radio PIT-1", type: "Radio", vendor: "MikroTik", model: "SXT", location: "PIT-1", status: "up" },
      { id: "5", name: "Radio PIT-2", type: "Radio", vendor: "MikroTik", model: "SXT", location: "PIT-2", status: "down" },
      { id: "6", name: "Office Core AP", type: "Access Point", vendor: "Ruijie", model: "RG-AP820", location: "Office", status: "up" },
    ],
  },
  {
    id: "ho",
    name: "Head Office Jakarta",
    routerName: "FortiGate 100F / HQ Gateway",
    switchName: "Cisco Catalyst 9300 48-Port",
    wans: { wan1: "Biznet Dedicated Fiber (Port 1)", wan2: "Telkom Astinet Secondary (Port 2)", wan3: "SD-WAN Overlay Link (Port 3)", trunk: "HQ Core Switch Backbone (Port 5)" },
    switchPorts: [
      { port: "Gi1/0/1", label: "Server Rack 1" },
      { port: "Gi1/0/2", label: "Server Rack 2" },
      { port: "Gi1/0/3", label: "Executive Suite AP" },
      { port: "Gi1/0/4", label: "Finance Dept Switch" },
      { port: "Gi1/0/5", label: "HR Dept Switch" },
      { port: "Gi1/0/6", label: "NOC Monitoring Display" },
      { port: "Gi1/0/7", label: "Synology NAS Backup" },
      { port: "Gi1/0/8", label: "IP PBX Server" },
    ],
    devices: [
      { id: "ho-1", name: "FortiGate 100F HQ", type: "Firewall/Router", vendor: "Fortinet", model: "FG-100F", location: "HQ Server Room", status: "up" },
      { id: "ho-2", name: "Cisco Catalyst 9300", type: "Switch", vendor: "Cisco", model: "C9300-48T", location: "HQ Server Room", status: "up" },
      { id: "ho-3", name: "Synology RS2423+", type: "NAS", vendor: "Synology", model: "RS2423+", location: "HQ Server Room", status: "up" },
      { id: "ho-4", name: "HQ Fingerprint Lobby", type: "Fingerprint", vendor: "ZKTeco", model: "MB20", location: "HQ Entrance", status: "up" },
    ],
  },
  {
    id: "jetty",
    name: "Jetty / Port Terminal",
    routerName: "MikroTik RB5009UG+S+IN",
    switchName: "MikroTik CRS328-24P-4S+RM",
    wans: { wan1: "Starlink Maritime (Ether1)", wan2: "PTP Radio Site Link (Ether2)", wan3: "4G LTE Gateway (Ether3)", trunk: "Port Switch Trunk (Ether8)" },
    switchPorts: [
      { port: "Ether2", label: "Radio Port Tower" },
      { port: "Ether3", label: "Jetty Weightbridge" },
      { port: "Ether4", label: "Barge Loading Gate" },
      { port: "Ether5", label: "Port Office AP" },
      { port: "Ether6", label: "CCTV NVR Gate 1" },
      { port: "Ether7", label: "CCTV NVR Gate 2" },
      { port: "Ether8", label: "Fuel Storage Switch" },
      { port: "Ether9", label: "Port Security Checkpoint" },
    ],
    devices: [
      { id: "j-1", name: "MikroTik RB5009", type: "Router", vendor: "MikroTik", model: "RB5009", location: "Port Office", status: "up" },
      { id: "j-2", name: "MikroTik CRS328", type: "Switch", vendor: "MikroTik", model: "CRS328", location: "Port Office", status: "up" },
      { id: "j-3", name: "Jetty NVR Camera System", type: "CCTV", vendor: "Hikvision", model: "DS-7616NI", location: "Gate 1", status: "up" },
    ],
  },
  {
    id: "bjm",
    name: "Office Banjarmasin",
    routerName: "FortiGate 80F / BJM Branch Gateway",
    switchName: "MikroTik CRS328-24P-4S+RM",
    wans: { wan1: "Telkom Astinet 100Mbps (Port 1)", wan2: "Biznet Dedicated Secondary (Port 2)", wan3: "SD-WAN Overlay Link (Port 3)", trunk: "BJM Switch Trunk (Port 5)" },
    switchPorts: [
      { port: "Port 1", label: "BJM Branch Office" },
      { port: "Port 2", label: "Logistics Admin" },
      { port: "Port 3", label: "Meeting Room AP" },
      { port: "Port 4", label: "CCTV Gateway" },
    ],
    devices: [
      { id: "bjm-1", name: "FortiGate 80F BJM", type: "Firewall/Router", vendor: "Fortinet", model: "FG-80F", location: "BJM Server Room", status: "up" },
      { id: "bjm-2", name: "MikroTik CRS328 BJM", type: "Switch", vendor: "MikroTik", model: "CRS328", location: "BJM Server Room", status: "up" },
    ],
  },
  {
    id: "pky",
    name: "Mess Hub Palangkaraya",
    routerName: "MikroTik hEX S (RB760iGS)",
    switchName: "Ruijie RG-NBS3100-24GT",
    wans: { wan1: "Indihome Fiber 100Mbps (Ether1)", wan2: "WireGuard VPN Tunnel (Ether2)", wan3: "Mesh Backup Link (Ether3)", trunk: "Hub Switch Trunk (Ether5)" },
    switchPorts: [
      { port: "Port 1", label: "Mess Admin Office" },
      { port: "Port 2", label: "Mess Lobby AP" },
      { port: "Port 3", label: "Mess Guest Rooms AP" },
      { port: "Port 4", label: "Security CCTV NVR" },
    ],
    devices: [
      { id: "pky-1", name: "hEX S Hub PKY", type: "Router", vendor: "MikroTik", model: "RB760iGS", location: "PKY Office", status: "up" },
      { id: "pky-2", name: "Ruijie NBS3100 PKY", type: "Switch", vendor: "Ruijie", model: "RG-NBS3100", location: "PKY Office", status: "up" },
    ],
  },
  {
    id: "bnt",
    name: "Mess Hub Buntok",
    routerName: "MikroTik hEX S (RB760iGS)",
    switchName: "Ruijie RG-NBS3100-24GT",
    wans: { wan1: "Icon+ Dedicated Fiber (Ether1)", wan2: "IPsec VPN Tunnel (Ether2)", wan3: "Cellular 4G Failover (Ether3)", trunk: "Basecamp Switch Trunk (Ether5)" },
    switchPorts: [
      { port: "Port 1", label: "Buntok Basecamp Office" },
      { port: "Port 2", label: "Logistics Warehouse AP" },
      { port: "Port 3", label: "Staff Accommodation AP" },
      { port: "Port 4", label: "CCTV Storage NVR" },
    ],
    devices: [
      { id: "bnt-1", name: "hEX S Hub Buntok", type: "Router", vendor: "MikroTik", model: "RB760iGS", location: "Buntok Basecamp", status: "up" },
      { id: "bnt-2", name: "Ruijie NBS3100 Bnt", type: "Switch", vendor: "Ruijie", model: "RG-NBS3100", location: "Buntok Basecamp", status: "up" },
    ],
  },
];

const generateRandomSla = (min: number, max: number) => Number((Math.random() * (max - min) + min).toFixed(2));

export default function DashboardPage() {
  const { events, addEvent } = useEventStore();
  const [selectedSiteId, setSelectedSiteId] = useState("batuah");
  const [showSites, setShowSites] = useState(true);

  const currentSite = DASHBOARD_SITES.find((s) => s.id === selectedSiteId) || DASHBOARD_SITES[0];

  // Static SLA generation
  const [wansSla] = useState({
    wan1: generateRandomSla(98.5, 99.99),
    wan2: generateRandomSla(98.5, 99.99),
    wan3: generateRandomSla(98.5, 99.99),
    trunk: generateRandomSla(99.0, 100),
  });

  const [switchPortsSla] = useState(() => {
    const slas: Record<string, number> = {};
    currentSite.switchPorts.forEach((p) => {
      slas[p.port] = generateRandomSla(97.5, 99.99);
    });
    return slas;
  });

  const [uplinkSla] = useState(generateRandomSla(99.0, 100));

  // Dynamic state
  const [traffic, setTraffic] = useState<Record<string, TrafficData[]>>({
    wan1: [], wan2: [], wan3: [], trunk: []
  });
  const [pingLatency, setPingLatency] = useState({
    google: 22, cloudflare: 18, cfApp: 15, ms: 34, wa: 38, ig: 44, tiktok: 28
  });
  const [resources, setResources] = useState({
    cpu: 18, memory: 42, storage: 35, temp: 52
  });

  // Simulation effect
  useEffect(() => {
    const now = new Date();
    const initialTraffic = ["wan1", "wan2", "wan3", "trunk"].reduce((acc, iface) => {
      acc[iface] = Array.from({ length: 20 }).map((_, i) => ({
        time: new Date(now.getTime() - (19 - i) * 3000).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }),
        rx: Math.random() * 100,
        tx: Math.random() * 50,
      }));
      return acc;
    }, {} as Record<string, TrafficData[]>);

    setTraffic(initialTraffic);

    const interval = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });

      setTraffic((prev) => {
        const next = { ...prev };
        ["wan1", "wan2", "wan3", "trunk"].forEach((iface) => {
          const newData = [
            ...next[iface].slice(1),
            {
              time: timeStr,
              rx: Math.random() * 100,
              tx: Math.random() * 50,
            },
          ];
          next[iface] = newData;
        });
        return next;
      });

      setPingLatency({
        google: 15 + Math.random() * 15,
        cloudflare: 12 + Math.random() * 12,
        cfApp: 10 + Math.random() * 10,
        ms: 30 + Math.random() * 20,
        wa: 35 + Math.random() * 15,
        ig: 40 + Math.random() * 25,
        tiktok: 25 + Math.random() * 20,
      });

      setResources((prev) => ({
        ...prev,
        cpu: Math.max(5, Math.min(95, prev.cpu + (Math.random() * 20 - 10))),
        memory: Math.max(20, Math.min(90, prev.memory + (Math.random() * 5 - 2.5))),
        temp: Math.max(40, Math.min(80, prev.temp + (Math.random() * 4 - 2))),
      }));

      if (Math.random() < 0.25) {
        const eventSources = [currentSite.routerName, currentSite.switchName, "Fortigate Firewall", "Radio Link", "Access Point"];
        const eventMessages = ["High latency spike detected", "Real-time state change detected", "Bandwidth threshold 80% exceeded", "Link state UP confirmed"];
        const severities: LiveEvent["severity"][] = ["info", "warning", "critical", "error"];
        const types: LiveEvent["type"][] = ["up", "down", "warning", "info"];

        const randomSource = eventSources[Math.floor(Math.random() * eventSources.length)];
        const randomMsg = eventMessages[Math.floor(Math.random() * eventMessages.length)];

        addEvent({
          message: `${randomMsg} on ${randomSource}`,
          timestamp: Date.now(),
          severity: severities[Math.floor(Math.random() * severities.length)],
          source: randomSource,
          type: types[Math.floor(Math.random() * types.length)],
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [addEvent, currentSite]);

  const totalSwitchSla = Object.values(switchPortsSla).reduce((a, b) => a + b, 0) / (currentSite.switchPorts.length || 1);

  return (
    <motion.div
      className="w-full max-w-none px-5 pt-0 pb-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 space-y-2.5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ═══════════════════════════════════════════════════════════
          MULTI-SITE DASHBOARD FILTER TABS (VERY TOP OF DASHBOARD)
      ═══════════════════════════════════════════════════════════ */}
      {showSites ? (
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xs">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-500" />
              NOC Public Real-Time Infrastructure Dashboard
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Pilih Lokasi Site Jaringan untuk Memantau Latency, Router, Switch, Traffic & Resources</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-xs font-semibold border border-slate-200/80 dark:border-slate-800">
              {DASHBOARD_SITES.map((site) => (
                <button
                  key={site.id}
                  onClick={() => setSelectedSiteId(site.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all text-xs",
                    selectedSiteId === site.id
                      ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  {site.name}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowSites(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shadow-xs"
              title="Sembunyikan Menu Site"
            >
              <Eye className="h-3.5 w-3.5 text-amber-500" />
              Sembunyikan Menu
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="flex justify-end pt-0.5 pb-2 mb-2">
          <button
            type="button"
            onClick={() => setShowSites(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
            title="Tampilkan Menu Site"
          >
            <Eye className="h-3.5 w-3.5 text-amber-500" />
            Tampilkan Menu
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ROW 1: External Target Latency
      ═══════════════════════════════════════════════════════════ */}
      <motion.section variants={itemVariants} className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <h2 className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100 uppercase">
              External Target Latency &mdash; Public NOC Services ({currentSite.name})
            </h2>
          </div>
          <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800/60">
            Real-time Ping ICMP
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
          <PingLatencyCard name="Google DNS" host="8.8.8.8" latencyMs={pingLatency.google} status="up" iconType="google" />
          <PingLatencyCard name="Cloudflare DNS" host="1.1.1.1" latencyMs={pingLatency.cloudflare} status="up" iconType="cloudflare" />
          <PingLatencyCard name="Cloudflare App" host="cloudflare.com" latencyMs={pingLatency.cfApp} status="up" iconType="cloudflare" />
          <PingLatencyCard name="Microsoft 365" host="ms365.com" latencyMs={pingLatency.ms} status="up" iconType="microsoft" />
          <PingLatencyCard name="WhatsApp API" host="api.whatsapp.com" latencyMs={pingLatency.wa} status="up" iconType="whatsapp" />
          <PingLatencyCard name="Instagram CDN" host="cdn.instagram.com" latencyMs={pingLatency.ig} status="up" iconType="instagram" />
          <PingLatencyCard name="TikTok Edge" host="edge.tiktok.com" latencyMs={pingLatency.tiktok} status="up" iconType="tiktok" />
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════
          ROW 2: Core Router SLA
      ═══════════════════════════════════════════════════════════ */}
      <motion.section variants={itemVariants} className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Core Router &mdash; {currentSite.routerName}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <SlaGaugeCard title={currentSite.wans.wan1.split("(")[0].trim()} percentage={wansSla.wan1} target={99.5} variant="wan" subtitle={currentSite.wans.wan1.match(/\((.*?)\)/)?.[1] || "WAN1"} />
          <SlaGaugeCard title={currentSite.wans.wan2.split("(")[0].trim()} percentage={wansSla.wan2} target={99.5} variant="wan" subtitle={currentSite.wans.wan2.match(/\((.*?)\)/)?.[1] || "WAN2"} />
          <SlaGaugeCard title={currentSite.wans.wan3.split("(")[0].trim()} percentage={wansSla.wan3} target={99.5} variant="wan" subtitle={currentSite.wans.wan3.match(/\((.*?)\)/)?.[1] || "WAN3"} />
          <SlaGaugeCard title={currentSite.wans.trunk.split("(")[0].trim()} percentage={wansSla.trunk} target={99.9} variant="trunk" subtitle={currentSite.wans.trunk.match(/\((.*?)\)/)?.[1] || "Trunk"} />
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════
          ROW 3: Core Switch SLA (Executive 5-Column Grid — 3 Compact Rows)
      ═══════════════════════════════════════════════════════════ */}
      <motion.section variants={itemVariants} className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Core Switch &mdash; {currentSite.switchName}</h2>
          </div>
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
            Managed Switch ICMP & SNMP
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
          {/* Left Panel: Integrated Uplink Gauge & Switch Overview (Shrunk Left lg:col-span-3) */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-1.5">
              <h3 className="text-[11px] font-bold text-black dark:text-slate-100 uppercase tracking-wider">Core Switch Uplink</h3>
              <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800">
                Ether1
              </span>
            </div>

            <div className="flex flex-col items-center justify-center my-1 gap-2">
              {/* Prominent Large SLA Gauge Circle & Text */}
              <div className="relative w-[120px] h-[120px] flex items-center justify-center shrink-0">
                <svg height="112" width="112" className="transform -rotate-90 drop-shadow-sm">
                  <circle stroke="currentColor" fill="transparent" strokeWidth="8" r="52" cx="56" cy="56" className="text-slate-100 dark:text-slate-800" />
                  <circle
                    stroke="url(#gradient-switch-uplink)"
                    fill="transparent"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                    style={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - uplinkSla / 100) }}
                    strokeLinecap="round"
                    r="52" cx="56" cy="56"
                  />
                  <defs>
                    <linearGradient id="gradient-switch-uplink" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
                    {uplinkSla.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="w-full space-y-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 px-1">
                <div className="flex justify-between items-center">
                  <span className="text-black dark:text-slate-300 font-bold">Total Ports:</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{currentSite.switchPorts.length} Ports</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-black dark:text-slate-300 font-bold">Active Links:</span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{currentSite.switchPorts.length} / {currentSite.switchPorts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-black dark:text-slate-300 font-bold">Avg Port SLA:</span>
                  <span className="font-bold font-mono text-amber-600 dark:text-amber-400">{totalSwitchSla.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-[9px] font-bold border-t border-slate-100 dark:border-slate-800 pt-2 mt-1">
              <span className="text-black dark:text-slate-300 font-bold">TARGET: 99.9%</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">ACTUAL: {uplinkSla.toFixed(2)}%</span>
            </div>
          </div>

          {/* Right Panel: Sleek 5-Column Port Chips Grid (lg:col-span-9 — 3 Rows for 15 Ports) */}
          <div className="lg:col-span-9 bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-bold text-black dark:text-slate-100 uppercase tracking-wider">Downlink Ports SLA &mdash; {currentSite.name}</h3>
              <span className="text-[10px] text-slate-900 dark:text-slate-300 font-mono font-bold">15 Active Ports</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {currentSite.switchPorts.map((port) => {
                const sla = switchPortsSla[port.port] || 99.2;
                const colorClass =
                  sla >= 99.5
                    ? "text-emerald-600 dark:text-emerald-400"
                    : sla >= 98
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-rose-600 dark:text-rose-400";

                const progressColorClass = sla >= 99.5 ? "bg-emerald-500" : sla >= 98 ? "bg-amber-500" : "bg-rose-500";

                return (
                  <div
                    key={port.port}
                    className="group relative bg-slate-50/80 dark:bg-slate-950/80 rounded-xl p-2 border border-slate-100 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-700/50 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[9px] font-bold text-black dark:text-slate-300 uppercase font-mono">{port.port}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="text-[11px] font-bold text-black dark:text-slate-200 truncate leading-tight" title={port.label}>
                      {port.label}
                    </div>
                    <div className="flex justify-between items-end mt-1">
                      <div className="w-full mr-2">
                        <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", progressColorClass)} style={{ width: `${sla}%` }} />
                        </div>
                      </div>
                      <span className={cn("text-[11px] font-mono font-black tracking-tight shrink-0", colorClass)}>
                        {sla.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════
          ROW 4: Live Traffic Monitor
      ═══════════════════════════════════════════════════════════ */}
      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Activity className="w-4 h-4 text-sky-500" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Live Traffic Monitor &mdash; {currentSite.name}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <LiveTrafficMiniChart title={currentSite.wans.wan1.split("(")[0]} interfaceName="ether1" data={traffic.wan1} />
          <LiveTrafficMiniChart title={currentSite.wans.wan2.split("(")[0]} interfaceName="ether2" data={traffic.wan2} />
          <LiveTrafficMiniChart title={currentSite.wans.wan3.split("(")[0]} interfaceName="ether3" data={traffic.wan3} />
          <LiveTrafficMiniChart title={currentSite.wans.trunk.split("(")[0]} interfaceName="ether6" data={traffic.trunk} />
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════
          ROW 5: Split Resources Monitor (Kiri: Core Router, Kanan: Core Switch)
      ═══════════════════════════════════════════════════════════ */}
      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Cpu className="w-4 h-4 text-emerald-500" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Core Devices Resources Monitor &mdash; {currentSite.name}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Core Router Resources */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Core Router Resources &mdash; {currentSite.routerName}</h3>
              </div>
              <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                Router Node
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ResourceGauge label="CPU Usage" value={resources.cpu} max={100} unit="%" icon={<Cpu className="w-4 h-4" />} />
              <ResourceGauge label="Memory" value={resources.memory} max={100} unit="%" icon={<MemoryStick className="w-4 h-4" />} />
              <ResourceGauge label="Storage" value={resources.storage} max={100} unit="%" icon={<HardDrive className="w-4 h-4" />} />
              <ResourceGauge label="Temperature" value={resources.temp} max={100} unit="°C" icon={<Thermometer className="w-4 h-4" />} thresholds={{ warning: 60, critical: 80 }} />
            </div>
          </div>

          {/* RIGHT: Core Switch Resources */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Core Switch Resources &mdash; {currentSite.switchName}</h3>
              </div>
              <span className="text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                Switch Node
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ResourceGauge label="CPU Usage" value={Math.max(5, Math.min(95, Math.round(resources.cpu * 0.85 + 4)))} max={100} unit="%" icon={<Cpu className="w-4 h-4" />} />
              <ResourceGauge label="Memory" value={Math.max(10, Math.min(90, Math.round(resources.memory * 0.9 + 5)))} max={100} unit="%" icon={<MemoryStick className="w-4 h-4" />} />
              <ResourceGauge label="Storage" value={Math.max(10, Math.min(90, Math.round(resources.storage * 0.8))) } max={100} unit="%" icon={<HardDrive className="w-4 h-4" />} />
              <ResourceGauge label="Temperature" value={Math.max(35, Math.min(80, Math.round(resources.temp - 3)))} max={100} unit="°C" icon={<Thermometer className="w-4 h-4" />} thresholds={{ warning: 60, critical: 80 }} />
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════════
          ROW 6: Live Events, Bandwidth Usage & Active Network Devices
      ═══════════════════════════════════════════════════════════ */}
      <motion.section variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1">
          <LiveEventFeed events={events} maxVisible={10} />
        </div>
        <div className="xl:col-span-2">
          <BandwidthUsageChart title="Bandwidth Usage (All Links)" />
        </div>
        <div className="xl:col-span-1">
          <ActiveDevicesSummary
            totalDevices={currentSite.devices.length}
            onlineDevices={currentSite.devices.filter((d) => d.status === "up").length}
            offlineDevices={currentSite.devices.filter((d) => d.status === "down").length}
            devices={currentSite.devices}
          />
        </div>
      </motion.section>
    </motion.div>
  );
}
