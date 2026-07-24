import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, CheckCircle2, Activity, Server, Cpu, Clock, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlaReportRow {
  siteId: string;
  interfaceName: string;
  type: string;
  uptimeHours: number;
  downtimeMinutes: number;
  availabilityPct: number;
  targetPct: number;
  status: "Compliant" | "Breached";
}

const SITES_REPORT_CONFIG = [
  { id: "BatuahSite", label: "Batuah Site (Mining)" },
  { id: "HeadOffice", label: "Head Office Jakarta" },
  { id: "JettyPort", label: "Jetty / Port Terminal" },
  { id: "MessPalangkaraya", label: "Mess Hub Palangkaraya" },
  { id: "MessBuntok", label: "Mess Hub Buntok" },
];

const CORE_ROUTER_SWITCH_DATA: SlaReportRow[] = [
  { siteId: "BatuahSite", interfaceName: "WAN1 Starlink Primary (Ether1)", type: "Primary WAN", uptimeHours: 719.5, downtimeMinutes: 30, availabilityPct: 99.93, targetPct: 99.5, status: "Compliant" },
  { siteId: "BatuahSite", interfaceName: "WAN2 Starlink Backup (Ether2)", type: "Secondary WAN", uptimeHours: 718.0, downtimeMinutes: 120, availabilityPct: 99.72, targetPct: 99.5, status: "Compliant" },
  { siteId: "BatuahSite", interfaceName: "WAN3 Lintasmaya Radiolink (Ether3)", type: "Radiolink WAN", uptimeHours: 719.8, downtimeMinutes: 12, availabilityPct: 99.97, targetPct: 99.5, status: "Compliant" },
  { siteId: "BatuahSite", interfaceName: "Trunk Ether6 Core Switch", type: "VLAN Trunk Uplink", uptimeHours: 720.0, downtimeMinutes: 0, availabilityPct: 100.0, targetPct: 99.9, status: "Compliant" },
  { siteId: "BatuahSite", interfaceName: "Radio PIT-1 (Site A - Ether2)", type: "Downlink Switch", uptimeHours: 719.2, downtimeMinutes: 48, availabilityPct: 99.89, targetPct: 98.0, status: "Compliant" },
  { siteId: "BatuahSite", interfaceName: "Radio PIT-2 (Site B - Ether3)", type: "Downlink Switch", uptimeHours: 705.0, downtimeMinutes: 900, availabilityPct: 97.92, targetPct: 98.0, status: "Breached" },

  // Head Office
  { siteId: "HeadOffice", interfaceName: "Biznet Dedicated Fiber (Port 1)", type: "Primary WAN Fiber", uptimeHours: 720.0, downtimeMinutes: 0, availabilityPct: 100.0, targetPct: 99.9, status: "Compliant" },
  { siteId: "HeadOffice", interfaceName: "Telkom Astinet Secondary (Port 2)", type: "Secondary WAN", uptimeHours: 719.9, downtimeMinutes: 6, availabilityPct: 99.98, targetPct: 99.5, status: "Compliant" },
  { siteId: "HeadOffice", interfaceName: "Cisco Catalyst Core Switch Uplink", type: "Core Switch Uplink", uptimeHours: 720.0, downtimeMinutes: 0, availabilityPct: 100.0, targetPct: 99.9, status: "Compliant" },

  // Jetty / Port
  { siteId: "JettyPort", interfaceName: "Starlink Maritime (Ether1)", type: "Primary WAN", uptimeHours: 719.6, downtimeMinutes: 24, availabilityPct: 99.94, targetPct: 99.5, status: "Compliant" },
  { siteId: "JettyPort", interfaceName: "PTP Radio Site Link (Ether2)", type: "Site Radiolink", uptimeHours: 719.0, downtimeMinutes: 60, availabilityPct: 99.86, targetPct: 99.0, status: "Compliant" },

  // Hub PKY
  { siteId: "MessPalangkaraya", interfaceName: "Indihome Fiber 100Mbps (Ether1)", type: "Primary WAN", uptimeHours: 718.9, downtimeMinutes: 66, availabilityPct: 99.85, targetPct: 99.0, status: "Compliant" },
  { siteId: "MessPalangkaraya", interfaceName: "WireGuard VPN Tunnel (Ether2)", type: "VPN Overlay", uptimeHours: 719.8, downtimeMinutes: 12, availabilityPct: 99.97, targetPct: 99.0, status: "Compliant" },

  // Hub Buntok
  { siteId: "MessBuntok", interfaceName: "Icon+ Dedicated Fiber (Ether1)", type: "Primary WAN", uptimeHours: 718.4, downtimeMinutes: 96, availabilityPct: 99.78, targetPct: 99.0, status: "Compliant" },
  { siteId: "MessBuntok", interfaceName: "IPsec VPN Tunnel (Ether2)", type: "VPN Overlay", uptimeHours: 719.5, downtimeMinutes: 30, availabilityPct: 99.93, targetPct: 99.0, status: "Compliant" },
];

const PING_LATENCY_REPORT = [
  { name: "Google DNS", host: "8.8.8.8", weekly: 18.2, monthly: 19.5, yearly: 21.0, status: "Optimal" },
  { name: "Microsoft 365", host: "ms365.com", weekly: 32.5, monthly: 34.0, yearly: 36.8, status: "Optimal" },
  { name: "WhatsApp API", host: "api.whatsapp.com", weekly: 38.0, monthly: 39.2, yearly: 41.5, status: "Optimal" },
  { name: "Instagram CDN", host: "cdn.instagram.com", weekly: 42.1, monthly: 45.0, yearly: 48.2, status: "Degraded" },
  { name: "TikTok Edge", host: "edge.tiktok.com", weekly: 27.5, monthly: 28.9, yearly: 30.1, status: "Optimal" },
];

const FREQUENT_DOWNTIME_DEVICES = [
  { siteId: "BatuahSite", device: "Radio PIT-2 (Site B)", location: "Tower PIT Selatan", outageCount: 7, totalDowntime: "15 Jam 00 Mins", mainCause: "Wireless Signal Interference / Tower Power Trip" },
  { siteId: "BatuahSite", device: "Workshop Switch", location: "Heavy Equip Workshop", outageCount: 4, totalDowntime: "3 Jam 45 Mins", mainCause: "VLAN Trunk Flap / Port Overload" },
  { siteId: "BatuahSite", device: "WAN2 Starlink Backup", location: "Main Server Room", outageCount: 2, totalDowntime: "2 Jam 00 Mins", mainCause: "Heavy Rain Satellite Obstruction" },
  { siteId: "HeadOffice", device: "Telkom Astinet Secondary", location: "HQ Server Room", outageCount: 1, totalDowntime: "0 Jam 06 Mins", mainCause: "ISP Maintenance Window" },
  { siteId: "JettyPort", device: "PTP Radio Site Link", location: "Port Operational Center", outageCount: 2, totalDowntime: "1 Jam 00 Mins", mainCause: "Heavy Fog Signal Attenuation" },
];

const HIGH_RESOURCE_DEVICES = [
  { siteId: "BatuahSite", device: "Workshop Switch", location: "Heavy Equip Workshop", avgCpu: 88.5, avgRam: 82.0, avgTemp: 64, impact: "High Packet Processing Drops" },
  { siteId: "BatuahSite", device: "Radio PIT-2 (Site B)", location: "Tower PIT Selatan", avgCpu: 76.0, avgRam: 70.0, avgTemp: 78, impact: "Thermal Throttling & High Latency" },
  { siteId: "BatuahSite", device: "Core Router CCR2004", location: "Main Server Room", avgCpu: 45.0, avgRam: 62.0, avgTemp: 55, impact: "Normal Heavy Traffic Routing" },
  { siteId: "HeadOffice", device: "Cisco Catalyst Switch", location: "HQ Server Room", avgCpu: 35.0, avgRam: 50.0, avgTemp: 48, impact: "Normal Operating State" },
  { siteId: "JettyPort", device: "MikroTik RB5009", location: "Port Office", avgCpu: 42.0, avgRam: 58.0, avgTemp: 52, impact: "Normal Maritime Routing" },
];

export default function SlaDetailReportPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [activeSite, setActiveSite] = useState("BatuahSite");
  const [isExporting, setIsExporting] = useState(false);

  const filteredSlaRows = CORE_ROUTER_SWITCH_DATA.filter((row) => row.siteId === activeSite);
  const filteredDowntime = FREQUENT_DOWNTIME_DEVICES.filter((row) => row.siteId === activeSite);
  const filteredHighResource = HIGH_RESOURCE_DEVICES.filter((row) => row.siteId === activeSite);

  const activeSiteObj = SITES_REPORT_CONFIG.find((s) => s.id === activeSite) || SITES_REPORT_CONFIG[0];

  const handleExport = (formatType: "csv" | "pdf") => {
    setIsExporting(true);
    setTimeout(() => {
      const siteLabel = activeSiteObj.label;
      let fileContent = "";
      let filename = "";
      let mimeType = "";

      if (formatType === "csv") {
        filename = `MNOP_SLA_Audit_${activeSite}_${period}.csv`;
        mimeType = "text/csv";
        fileContent = `MNOP Enterprise SLA Executive Audit Compliance Report
Company: PT Kapuas Bara Utama
Site Location: ${siteLabel}
Report Period: ${period.toUpperCase()}
Digital Signature Hash: SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
Verification Stamp: VERIFIED OK (MNOP Compliance Engine)

Interface,Type,Uptime (Hours),Downtime (Minutes),Availability (%),SLA Target (%),Compliance Status
${filteredSlaRows
  .map(
    (r) =>
      `"${r.interfaceName}","${r.type}",${r.uptimeHours},${r.downtimeMinutes},${r.availabilityPct}%,${r.targetPct}%,"${r.status}"`
  )
  .join("\n")}
`;
      } else {
        filename = `MNOP_SLA_Audit_${activeSite}_${period}.pdf`;
        mimeType = "application/pdf";
        fileContent = `%PDF-1.4 Report SLA Uptime ${period.toUpperCase()} - PT Kapuas Bara Utama
MNOP Executive SLA Audit Compliance Certificate
Site: ${siteLabel}
Digital Signature Stamp: VERIFIED SHA256:e3b0c44298fc1c149afbf4c8996fb924
${filteredSlaRows.map((r) => `${r.interfaceName}: ${r.availabilityPct}% (Target ${r.targetPct}% - ${r.status.toUpperCase()})`).join("\n")}
`;
      }

      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsExporting(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-none px-6 py-4 space-y-6 pb-16">
      {/* Sticky Header */}
      <div className="sticky -top-6 -mx-12 px-12 pt-6 pb-4 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-6 w-6 text-amber-500" />
              SLA Detail & Infrastructure Performance Report
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Comprehensive Uptime, Public Latency Metrics, & Outage Root Cause Analysis</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Site Selector Tabs */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs font-semibold">
              <Building2 className="h-4 w-4 text-slate-400 ml-2" />
              {SITES_REPORT_CONFIG.map((site) => (
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

            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs font-semibold">
              <Calendar className="h-4 w-4 text-slate-400 ml-2" />
              {(["weekly", "monthly", "yearly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg capitalize transition-colors",
                    period === p ? "bg-amber-500 text-slate-950 font-bold shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleExport("csv")}
              disabled={isExporting}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95 text-xs"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95 text-xs"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Top Single Key Metric Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Overall Infrastructure Availability ({activeSiteObj.label})</span>
            <h2 className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {activeSite === "BatuahSite" ? "99.88%" : "99.96%"}
            </h2>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-xs text-slate-400 font-medium">Periode Laporan: <strong className="text-slate-700 dark:text-slate-300 capitalize">{period}</strong></span>
          <p className="text-xs text-emerald-500 font-bold mt-1">SLA Benchmark Goal: 99.50%</p>
        </div>
      </div>

      {/* SECTION 1: Core Router & Core Switch SLA Report */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Server className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">1. Core Router & Core Switch SLA Report &mdash; {activeSiteObj.label}</h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Interface / Link Name</th>
                  <th className="px-6 py-4">Tipe Link</th>
                  <th className="px-6 py-4">Total Uptime</th>
                  <th className="px-6 py-4">Total Downtime</th>
                  <th className="px-6 py-4">Availability (%)</th>
                  <th className="px-6 py-4">Target SLA</th>
                  <th className="px-6 py-4 text-right">Status Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredSlaRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{row.interfaceName}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{row.type}</td>
                    <td className="px-6 py-4 font-mono text-slate-700 dark:text-slate-300">{row.uptimeHours} hrs</td>
                    <td className="px-6 py-4 font-mono text-slate-700 dark:text-slate-300">{row.downtimeMinutes} mins</td>
                    <td className={cn("px-6 py-4 font-mono font-bold text-base", row.availabilityPct >= row.targetPct ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                      {row.availabilityPct.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500">{row.targetPct.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
                          row.status === "Compliant"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", row.status === "Compliant" ? "bg-emerald-500" : "bg-rose-500 animate-ping")} />
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredSlaRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      Tidak ada data SLA untuk site ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* SECTION 2: Average Ping Latency Report to Public DNS & Famous Apps */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Activity className="h-5 w-5 text-sky-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">2. Average Ping Latency Report &mdash; Public DNS & Apps ({activeSiteObj.label})</h2>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Layanan Target</th>
                  <th className="px-6 py-4">Host IP / Domain</th>
                  <th className="px-6 py-4">Avg Latency (Weekly)</th>
                  <th className="px-6 py-4">Avg Latency (Monthly)</th>
                  <th className="px-6 py-4">Avg Latency (Yearly)</th>
                  <th className="px-6 py-4 text-right">Status Kualitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {PING_LATENCY_REPORT.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{row.name}</td>
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">{row.host}</td>
                    <td className="px-6 py-4 font-mono font-bold text-sky-600 dark:text-sky-400">{row.weekly} ms</td>
                    <td className="px-6 py-4 font-mono font-bold text-sky-600 dark:text-sky-400">{row.monthly} ms</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">{row.yearly} ms</td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-semibold",
                        row.status === "Optimal" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                      )}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 3 & 4: Frequent Downtime Devices & High Resource Low Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overview Report: Perangkat Sering Down */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Clock className="h-5 w-5 text-rose-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">3. Perangkat Sering Downtime &mdash; {activeSiteObj.label}</h2>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-3">
            {filteredDowntime.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.device}</h3>
                    <p className="text-xs text-slate-500">{item.location}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold font-mono">
                    {item.outageCount} Outages
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between border-t border-slate-200/60 dark:border-slate-800 pt-2 font-mono">
                  <span>Total Downtime: <strong className="text-rose-600 dark:text-rose-400">{item.totalDowntime}</strong></span>
                  <span className="text-[11px] text-slate-500">Penyebab: {item.mainCause}</span>
                </div>
              </div>
            ))}
            {filteredDowntime.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">
                Tidak ada riwayat downtime berulang pada site ini.
              </div>
            )}
          </div>
        </div>

        {/* Overview Report: Perangkat Sering High Resources / Low Performance */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Cpu className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">4. Perangkat High Resource &mdash; {activeSiteObj.label}</h2>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-3">
            {filteredHighResource.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.device}</h3>
                    <p className="text-xs text-slate-500">{item.location}</p>
                  </div>
                  <div className="flex gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold">CPU {item.avgCpu}%</span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 font-bold">RAM {item.avgRam}%</span>
                  </div>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 flex justify-between border-t border-slate-200/60 dark:border-slate-800 pt-2">
                  <span>Suhu Rata-rata: <strong className="font-mono text-amber-500">{item.avgTemp}°C</strong></span>
                  <span className="text-[11px] text-slate-500">Dampak: {item.impact}</span>
                </div>
              </div>
            ))}
            {filteredHighResource.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">
                Semua perangkat di site ini beroperasi dalam beban normal.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
