import { useState } from "react";
import { motion } from "framer-motion";
import BandwidthUsageChart from "@/components/dashboard/BandwidthUsageChart";
import { BarChart3, ShieldCheck, CheckCircle2, AlertCircle, ArrowUpRight, Globe, Server, Radio, Network, Building2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const SITES_TAB_CONFIG = [
  { id: "ALL", label: "All Sites" },
  { id: "BatuahSite", label: "Batuah Site (Mining)" },
  { id: "HeadOffice", label: "Head Office Jakarta" },
  { id: "JettyPort", label: "Jetty / Port Terminal" },
  { id: "MessPalangkaraya", label: "Mess Hub Palangkaraya" },
  { id: "MessBuntok", label: "Mess Hub Buntok" },
];

const SITE_SLA_SUMMARY = [
  { siteId: "BatuahSite", site: "Site Mining Pit-1", location: "Tower PIT Utara", uptime: "99.89%", target: "98.0%", status: "Compliant", icon: Radio },
  { siteId: "BatuahSite", site: "Site Mining Pit-2", location: "Tower PIT Selatan", uptime: "97.92%", target: "98.0%", status: "Breached", icon: Radio },
  { siteId: "HeadOffice", site: "Head Office Jakarta", location: "HQ Server Room", uptime: "99.99%", target: "99.9%", status: "Compliant", icon: Server },
  { siteId: "JettyPort", site: "Jetty / Port Terminal", location: "Port Operational Center", uptime: "99.95%", target: "99.5%", status: "Compliant", icon: Globe },
  { siteId: "MessPalangkaraya", site: "Mess Hub Palangkaraya", location: "Regional Hub Office", uptime: "99.85%", target: "99.0%", status: "Compliant", icon: Network },
  { siteId: "MessBuntok", site: "Mess Hub Buntok", location: "Basecamp Logistics Hub", uptime: "99.78%", target: "99.0%", status: "Compliant", icon: Network },
];

export default function SlaOverviewPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [activeSiteTab, setActiveSiteTab] = useState("ALL");

  const filteredSites = SITE_SLA_SUMMARY.filter(
    (item) => activeSiteTab === "ALL" || item.siteId === activeSiteTab
  );

  return (
    <div className="w-full max-w-none px-6 py-4 space-y-6 pb-16">
      {/* Sticky Header & Site Selector */}
      <div className="sticky -top-6 -mx-12 px-12 pt-6 pb-4 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-amber-500" />
              SLA Executive Overview & Compliance Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400">High-Level Multi-Site Service Level Agreement Performance & Link Health Tracking</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Site Filter Tabs */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs font-semibold">
              <Building2 className="h-4 w-4 text-slate-400 ml-2" />
              {SITES_TAB_CONFIG.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSiteTab(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-colors",
                    activeSiteTab === tab.id
                      ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs font-semibold">
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
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Overall SLA ({activeSiteTab === "ALL" ? "All Sites" : activeSiteTab})</span>
            <h2 className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {activeSiteTab === "BatuahSite" ? "98.90%" : "99.88%"}
            </h2>
            <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="h-3 w-3" /> +0.38% vs SLA Target (99.50%)
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-sky-500/10 text-sky-500">
            <Globe className="h-7 w-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">WAN Link Average</span>
            <h2 className="text-2xl font-extrabold font-mono text-sky-600 dark:text-sky-400">99.87%</h2>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5">Starlink & Radiolink</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-500">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Core Switch Uplink</span>
            <h2 className="text-2xl font-extrabold font-mono text-slate-800 dark:text-slate-100">100.0%</h2>
            <span className="text-[11px] text-emerald-500 font-semibold mt-0.5">0 Downtime Minutes</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-500">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Breached Sites</span>
            <h2 className="text-2xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
              {activeSiteTab === "ALL" || activeSiteTab === "BatuahSite" ? "1 Site" : "0 Sites"}
            </h2>
            <span className="text-[11px] text-rose-500 font-medium mt-0.5">
              {activeSiteTab === "ALL" || activeSiteTab === "BatuahSite" ? "Site PIT-2 (97.92%)" : "Semua Site Compliant"}
            </span>
          </div>
        </div>
      </div>

      {/* Incident Reliability Key Performance Indicators (MTTR & MTBF) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-500">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Mean Time To Repair (MTTR)</span>
              <h3 className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">14.5 Menit</h3>
              <p className="text-[11px] text-slate-400">Rata-rata Durasi Pemulihan Insiden Downlink & WAN</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-xs font-mono">
            Fast Recovery
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-500">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Mean Time Between Failures (MTBF)</span>
              <h3 className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">168.2 Jam</h3>
              <p className="text-[11px] text-slate-400">Rata-rata Interval Keandalan Antar Gangguan</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 font-bold text-xs font-mono">
            High Reliability
          </span>
        </div>
      </div>

      {/* Multi-Site SLA Performance Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Infrastructure SLA Performance ({activeSiteTab === "ALL" ? "Semua Lokasi Site" : SITES_TAB_CONFIG.find(t => t.id === activeSiteTab)?.label})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.map((site, idx) => {
            const Icon = site.icon;
            const isCompliant = site.status === "Compliant";

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{site.site}</h3>
                      <p className="text-xs text-slate-500">{site.location}</p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-semibold",
                      isCompliant
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                    )}
                  >
                    {site.status}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Uptime Actual</span>
                    <span className={cn("font-mono font-extrabold text-sm", isCompliant ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                      {site.uptime}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", isCompliant ? "bg-emerald-500" : "bg-rose-500")}
                      style={{ width: site.uptime }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>Target Minimum: {site.target}</span>
                    <span>Status: {isCompliant ? "Lulus SLA" : "Di Bawah Target"}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bandwidth Usage Section */}
      <motion.div className="w-full">
        <BandwidthUsageChart title={`Bandwidth Usage (${activeSiteTab === "ALL" ? "Semua Lokasi Site" : SITES_TAB_CONFIG.find(t => t.id === activeSiteTab)?.label})`} />
      </motion.div>

      {/* Multi-Site Comparative SLA Benchmark Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              Matriks Benchmark Komparatif SLA Antar-Site
            </h2>
            <p className="text-xs text-slate-500">Perbandingan Kinerja SLA 5 Lokasi Infrastruktur Enterprise Bulan ke Bulan</p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Audit Ready SLA
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Lokasi Site Jaringan</th>
                <th className="px-4 py-3">Tipe Uplink Primary</th>
                <th className="px-4 py-3 font-mono">Target SLA</th>
                <th className="px-4 py-3 font-mono">SLA Bulan Ini</th>
                <th className="px-4 py-3 font-mono">SLA Bulan Lalu</th>
                <th className="px-4 py-3 font-mono">Delta Tren</th>
                <th className="px-4 py-3 text-right">Status Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {[
                { site: "Batuah Site (Core Mining)", wan: "Starlink Primary (WAN1)", target: "99.50%", current: "99.89%", previous: "99.75%", delta: "+0.14%", status: "Compliant" },
                { site: "Head Office Jakarta", wan: "Biznet Fiber (Primary)", target: "99.90%", current: "99.99%", previous: "99.98%", delta: "+0.01%", status: "Compliant" },
                { site: "Jetty / Port Terminal", wan: "Starlink Maritime", target: "99.50%", current: "99.95%", previous: "99.80%", delta: "+0.15%", status: "Compliant" },
                { site: "Mess Hub Palangkaraya", wan: "Indihome Fiber", target: "99.00%", current: "99.85%", previous: "99.70%", delta: "+0.15%", status: "Compliant" },
                { site: "Mess Hub Buntok", wan: "Icon+ Fiber", target: "99.00%", current: "99.78%", previous: "99.65%", delta: "+0.13%", status: "Compliant" },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{row.site}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.wan}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{row.target}</td>
                  <td className="px-4 py-3 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{row.current}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{row.previous}</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-500">{row.delta}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold font-mono text-[11px]">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLA Contract Downtime Financial Penalty Rebate Calculator */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-amber-500" />
              Kalkulator Rebate Penalti Finansial Kontrak SLA ISP
            </h2>
            <p className="text-xs text-slate-500">Perhitungan Otomatis Restitusi Tagihan Bulanan ISP akibat Pelanggaran Threshold Target Downtime</p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            ISP SLA Rebate Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Starlink Business Primary (WAN1)</span>
            <span className="text-base font-bold font-mono text-emerald-500">Rp 0 (SLA Compliant 99.93%)</span>
            <p className="text-[10px] text-slate-400">Total Downtime: 30 Mins (Threshold 216 Mins)</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Radio Link Downlink PIT-2 (Site B)</span>
            <span className="text-base font-bold font-mono text-rose-500">Rp 4.500.000 (Potongan 15%)</span>
            <p className="text-[10px] text-slate-400">Pelanggaran SLA: 97.92% vs Target 98.00%</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Estimasi Total Restitusi Klaim ISP</span>
            <span className="text-base font-bold font-mono text-amber-500">Rp 4.500.000 / Bulan</span>
            <p className="text-[10px] text-slate-400">Klaim Tagihan Resmi Ke Penyedia Layanan</p>
          </div>
        </div>
      </div>

      {/* 24-Hour Network Outage & Incident Heatmap */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-500" />
              Visualizer Heatmap Insiden & Gangguan Jaringan 24-Jam
            </h2>
            <p className="text-xs text-slate-500">Pola Jam Rawan Fluktuasi & Outage Perangkat di 5 Lokasi Infrastruktur Enterprise</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono font-semibold">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span> Normal (0)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block"></span> Warning (1-2)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block"></span> Outage (3+)</span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {[
            { site: "Batuah Site (Core Mining)", hours: [0,0,0,0,0,1,0,0,0,0,0,0,0,0,2,3,1,0,0,0,0,0,0,0] },
            { site: "Head Office Jakarta", hours: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
            { site: "Jetty / Port Terminal", hours: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] },
            { site: "Mess Hub Palangkaraya", hours: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0] },
            { site: "Mess Hub Buntok", hours: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0] },
          ].map((row, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200 w-52 shrink-0">{row.site}</span>
              <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 w-full">
                {row.hours.map((val, h) => (
                  <div
                    key={h}
                    title={`Jam ${h}:00 WIB - ${val === 0 ? "Normal Uptime" : val === 1 ? "1 Warning Flap" : `${val} Critical Incident Drops`}`}
                    className={cn(
                      "h-6 rounded-md transition-all flex items-center justify-center font-mono text-[9px] font-bold text-white shadow-xs cursor-pointer hover:scale-110",
                      val === 0 ? "bg-emerald-500/80 hover:bg-emerald-500" : val <= 2 ? "bg-amber-500/90 hover:bg-amber-500" : "bg-rose-500 hover:bg-rose-600 animate-pulse"
                    )}
                  >
                    {h}h
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
