import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Share2,
  Router,
  Network,
  Radio,
  Wifi,
  Shield,
  Server,
  Info,
  Zap,
  Lock,
  Plus,
  X,
  Building2,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { topologyService } from "@/services/topology-service";
import type { TopologyNode } from "@/services/topology-service";
import { deviceService } from "@/services/device-service";

export default function NetworkTopologyPage() {
  const [searchParams] = useSearchParams();
  const targetDeviceParam = searchParams.get("device");
  const queryClient = useQueryClient();

  const { data: nodes = [], isLoading: isLoadingNodes } = useQuery({
    queryKey: ["topology-nodes"],
    queryFn: () => topologyService.getNodes(),
  });

  const { data: links = [], isLoading: isLoadingLinks } = useQuery({
    queryKey: ["topology-links"],
    queryFn: () => topologyService.getLinks(),
  });

  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("ALL");

  // Modal State for Administrator Adding New Device / Site
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceIp, setNewDeviceIp] = useState("");
  const [newDeviceLocation, setNewDeviceLocation] = useState("");
  const [newDeviceType, setNewDeviceType] = useState<TopologyNode["type"]>("vpn");
  const [newDeviceSite, setNewDeviceSite] = useState<TopologyNode["siteCategory"]>("HeadOffice");

  const createDeviceMutation = useMutation({
    mutationFn: (newDevice: any) => deviceService.createDevice(newDevice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topology-nodes"] });
      setIsAddModalOpen(false);
      setNewDeviceName("");
      setNewDeviceIp("");
      setNewDeviceLocation("");
    },
  });

  useEffect(() => {
    if (targetDeviceParam && nodes.length > 0) {
      const match = nodes.find(
        (n) =>
          n.name.toLowerCase().includes(targetDeviceParam.toLowerCase()) ||
          targetDeviceParam.toLowerCase().includes(n.name.toLowerCase()) ||
          n.id.toLowerCase().includes(targetDeviceParam.toLowerCase())
      );
      if (match) {
        setSelectedNode(match);
      }
    }
  }, [targetDeviceParam, nodes]);

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName || !newDeviceIp) return;

    createDeviceMutation.mutate({
      name: newDeviceName,
      vendor: "MikroTik",
      model: "Generic",
      type: newDeviceType,
      siteCategory: newDeviceSite,
      location: newDeviceLocation || "Remote Branch Site",
      ip: newDeviceIp,
      status: "Online",
    });
  };

  const filteredNodes =
    activeCategoryFilter === "ALL"
      ? nodes
      : nodes.filter((n) => n.siteCategory === activeCategoryFilter);

  const getNodeIcon = (type: TopologyNode["type"]) => {
    switch (type) {
      case "router": return <Router className="h-6 w-6" />;
      case "switch": return <Network className="h-6 w-6" />;
      case "radio": return <Radio className="h-6 w-6" />;
      case "ap": return <Wifi className="h-6 w-6" />;
      case "firewall": return <Shield className="h-6 w-6" />;
      case "vpn": return <Lock className="h-6 w-6" />;
      default: return <Server className="h-6 w-6" />;
    }
  };

  return (
    <div className="w-full max-w-none px-6 py-4 space-y-4 min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="h-6 w-6 text-amber-500" />
            Real-Time Network Topology & VPN Tunnel Visualizer
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Head Office, Site Mining, Jetty Port, & Regional Hubs Topology Map</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Site Category Tabs */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: "ALL", label: "All Sites" },
              { id: "HeadOffice", label: "Head Office" },
              { id: "SiteMining", label: "Site Mining" },
              { id: "JettyPort", label: "Jetty / Port" },
              { id: "MessPalangkaraya", label: "Hub PKY" },
              { id: "MessBuntok", label: "Hub Buntok" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-colors",
                  activeCategoryFilter === cat.id
                    ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#020617"/>
  <text x="40" y="50" fill="#f59e0b" font-family="sans-serif" font-size="24" font-weight="bold">MNOP Enterprise Network Topology Map</text>
  <text x="40" y="80" fill="#94a3b8" font-family="sans-serif" font-size="14">Company: PT Kapuas Bara Utama | Multi-Site VPN & Uplink Diagram</text>
</svg>`;
              const blob = new Blob([svgContent], { type: "image/svg+xml" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `MNOP_Network_Topology_${activeCategoryFilter}_${new Date().toISOString().slice(0, 10)}.svg`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs transition-all active:scale-95"
          >
            <Download className="h-4 w-4" />
            Export Diagram Topologi (.svg)
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Tambah Node / Site Baru
          </button>
        </div>
      </div>

      {/* Main Canvas & Panel (FULL MONITOR WIDE SCREEN LAYOUT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 h-full min-h-[640px]">
        {/* Topology Canvas (9 Columns Wide) */}
        <div className="lg:col-span-9 bg-slate-950 border border-slate-800 rounded-2xl p-6 relative min-h-[600px] overflow-hidden shadow-2xl flex flex-col justify-between">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#0ea5e9_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none" />

          {isLoadingNodes || isLoadingLinks ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
          ) : (
            <>
              {/* Animated SVG Links & VPN Tunnels */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {links.map((link, idx) => {
                  const fromNode = nodes.find((n) => n.id === link.from);
                  const toNode = nodes.find((n) => n.id === link.to);
                  if (!fromNode || !toNode) return null;

                  const isHighlighted =
                    selectedNode && (selectedNode.id === fromNode.id || selectedNode.id === toNode.id);

                  const isOffline = toNode.status === "Offline";

                  return (
                    <g key={idx}>
                      {/* Glow under line when highlighted */}
                      {isHighlighted && (
                        <line
                          x1={`${fromNode.x}%`}
                          y1={`${fromNode.y}%`}
                          x2={`${toNode.x}%`}
                          y2={`${toNode.y}%`}
                          stroke={link.isVpn ? "#a855f7" : "#f59e0b"}
                          strokeWidth={6}
                          strokeOpacity={0.3}
                        />
                      )}

                      <line
                        x1={`${fromNode.x}%`}
                        y1={`${fromNode.y}%`}
                        x2={`${toNode.x}%`}
                        y2={`${toNode.y}%`}
                        stroke={isOffline ? "#f43f5e" : link.isVpn ? "#a855f7" : isHighlighted ? "#f59e0b" : "#0284c7"}
                        strokeWidth={isHighlighted ? 3 : 2}
                        strokeDasharray={link.isVpn ? "8 5" : isOffline ? "6 6" : undefined}
                        strokeOpacity={0.85}
                      />

                      {/* Signal Data Pulse */}
                      {!isOffline && (
                        <circle r="4" fill={link.isVpn ? "#c084fc" : isHighlighted ? "#fbbf24" : "#38bdf8"}>
                          <animateMotion
                            path={`M ${fromNode.x * 10} ${fromNode.y * 6} L ${toNode.x * 10} ${toNode.y * 6}`}
                            dur={`${2 + idx * 0.3}s`}
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Interactive Nodes */}
              <div className="relative w-full h-full min-h-[520px]">
                {filteredNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <motion.div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                      className={cn(
                        "absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center group z-10"
                      )}
                    >
                      {/* Node Icon Box */}
                      <div
                        className={cn(
                          "p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 relative shadow-lg",
                          isSelected
                            ? "bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.8)] scale-110"
                            : node.type === "vpn"
                            ? "bg-purple-950/90 text-purple-300 border-purple-500/60 hover:border-purple-400"
                            : node.status === "Online"
                            ? "bg-slate-900/90 text-emerald-400 border-slate-700 hover:border-emerald-400"
                            : node.status === "Warning"
                            ? "bg-slate-900/90 text-amber-400 border-amber-500/60 hover:border-amber-400"
                            : "bg-slate-900/90 text-rose-400 border-rose-500/60 hover:border-rose-400"
                        )}
                      >
                        {getNodeIcon(node.type)}

                        {/* Status Dot */}
                        <span
                          className={cn(
                            "absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950",
                            node.status === "Online"
                              ? "bg-emerald-500"
                              : node.status === "Warning"
                              ? "bg-amber-500"
                              : "bg-rose-500 animate-ping"
                          )}
                        />
                      </div>

                      {/* Node Label */}
                      <span
                        className={cn(
                          "mt-2.5 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap backdrop-blur-md border shadow-sm transition-all flex items-center gap-1",
                          isSelected
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                            : "bg-slate-900/90 text-slate-200 border-slate-800 group-hover:border-slate-700"
                        )}
                      >
                        {node.type === "vpn" && <Lock className="h-3 w-3 text-purple-400" />}
                        {node.name}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

          {/* Map Footer Legend */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs text-slate-400 z-10">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> Link Direct (Active)</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" /> VPN Tunnel Link</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" /> Warning</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" /> Link Down</span>
            </div>
            <span className="font-mono text-slate-400">Head Office • Site Mining • Jetty Port • Mess Hubs Visualizer</span>
          </div>
        </div>

        {/* Selected Node Detail Information Drawer Panel (3 Columns Wide) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          {selectedNode ? (
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                    {getNodeIcon(selectedNode.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{selectedNode.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedNode.ip}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    selectedNode.status === "Online"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : selectedNode.status === "Warning"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                  )}
                >
                  {selectedNode.status}
                </span>
              </div>

              <div className="space-y-5 text-sm">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Lokasi Infrastructure</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedNode.location}</span>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Kategori Site</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 uppercase font-semibold">{selectedNode.siteCategory}</span>
                </div>

                {selectedNode.vpnTunnel && (
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
                    <span className="font-bold text-purple-400 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" /> VPN Tunnel Active
                    </span>
                    <p className="text-slate-400 font-mono mt-1">{selectedNode.vpnTunnel}</p>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">Koneksi Link Terhubung</span>
                  <div className="space-y-2.5">
                    {links.filter((l) => l.from === selectedNode.id || l.to === selectedNode.id).map((l, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs font-mono">
                        <div className="flex flex-col">
                          <span className="text-slate-800 dark:text-slate-200 font-bold">{l.label}</span>
                          <span className="text-[10px] text-slate-500">{l.isVpn ? "Encrypted VPN Tunnel" : "Direct Cable/Radio"}</span>
                        </div>
                        <span className={cn("font-bold px-2 py-1 rounded-lg", l.isVpn ? "bg-purple-500/10 text-purple-400" : "bg-emerald-500/10 text-emerald-500")}>
                          {l.bandwidth}
                        </span>
                      </div>
                    ))}
                    {links.filter((l) => l.from === selectedNode.id || l.to === selectedNode.id).length === 0 && (
                      <div className="text-slate-400 text-xs">Belum ada koneksi topologi.</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
              <Info className="h-10 w-10 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-medium">Klik salah satu node pada peta diagram topologi untuk analisa detail.</p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-xs text-amber-500 font-bold flex items-center justify-center gap-1">
              <Zap className="h-3.5 w-3.5" /> NOC Multi-Site VPN Infrastructure
            </span>
          </div>
        </div>
      </div>

      {/* Modal Administrator Tambah Site / Node Baru */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-amber-500" />
                  Tambah Site / Node Baru
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddDevice} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Nama Perangkat / Site</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Router Mess Hub Buntok"
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">IP Address / Gateway</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 192.168.30.1"
                    value={newDeviceIp}
                    onChange={(e) => setNewDeviceIp(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Lokasi Fisik Site</label>
                  <input
                    type="text"
                    placeholder="Contoh: Mess Buntok Office"
                    value={newDeviceLocation}
                    onChange={(e) => setNewDeviceLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1">Tipe Modul</label>
                    <select
                      value={newDeviceType}
                      onChange={(e) => setNewDeviceType(e.target.value as TopologyNode["type"])}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100"
                    >
                      <option value="vpn">VPN Tunnel Node</option>
                      <option value="router">Router</option>
                      <option value="switch">Switch</option>
                      <option value="radio">Radio Link</option>
                      <option value="ap">Access Point</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1">Kategori Area Site</label>
                    <select
                      value={newDeviceSite}
                      onChange={(e) => setNewDeviceSite(e.target.value as TopologyNode["siteCategory"])}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100"
                    >
                      <option value="HeadOffice">Head Office</option>
                      <option value="SiteMining">Site Mining</option>
                      <option value="JettyPort">Jetty / Port</option>
                      <option value="MessPalangkaraya">Hub Palangkaraya</option>
                      <option value="MessBuntok">Hub Buntok</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={createDeviceMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold shadow-xs"
                  >
                    {createDeviceMutation.isPending ? "Menyimpan..." : "Simpan Node Topologi"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
