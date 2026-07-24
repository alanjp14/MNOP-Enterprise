import { useState, useEffect } from "react";
import { Server, Plus, Edit2, Trash2, ShieldCheck, Search, X, Check, Building2, HardDrive, Printer, Tv, Video, Zap, Fingerprint, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { deviceService, type NetworkDevice } from "@/services/device-service";

const SITES_CONFIG = [
  { id: "ALL", label: "All Sites" },
  { id: "BatuahSite", label: "Batuah Site (Mining)" },
  { id: "HeadOffice", label: "Head Office" },
  { id: "JettyPort", label: "Jetty / Port" },
  { id: "MessPalangkaraya", label: "Hub PKY" },
  { id: "MessBuntok", label: "Hub Buntok" },
];

const INITIAL_FALLBACK_DEVICES: NetworkDevice[] = [
  { id: "dev-1", name: "Core Router CCR2004", vendor: "MikroTik", model: "CCR2004-16G-2S+", type: "router", siteCategory: "BatuahSite", location: "Main Server Room", ip: "10.0.0.1", status: "Online" },
  { id: "dev-2", name: "Core Switch CRS320", vendor: "MikroTik", model: "CRS320-8P-8B-4S+", type: "switch", siteCategory: "BatuahSite", location: "Main Server Room", ip: "10.0.0.2", status: "Online" },
  { id: "dev-3", name: "Fortigate Firewall", vendor: "Fortinet", model: "FortiGate 60F", type: "firewall", siteCategory: "BatuahSite", location: "Main Server Room", ip: "10.0.0.254", status: "Online" },
  { id: "dev-4", name: "Radio PIT-1 (Site A)", vendor: "MikroTik", model: "SXT sq 5 ac", type: "radio", siteCategory: "BatuahSite", location: "Tower PIT Utara", ip: "10.0.1.10", status: "Online" },
  { id: "dev-5", name: "Radio PIT-2 (Site B)", vendor: "MikroTik", model: "SXT sq 5 ac", type: "radio", siteCategory: "BatuahSite", location: "Tower PIT Selatan", ip: "10.0.1.11", status: "Warning" },
  { id: "dev-6", name: "HQ Core Gateway Router", vendor: "Fortinet", model: "FG-100F", type: "router", siteCategory: "HeadOffice", location: "HQ Server Room", ip: "172.16.0.1", status: "Online" },
  { id: "dev-7", name: "HQ Backup NAS Storage", vendor: "Synology", model: "RS2423+", type: "nas", siteCategory: "HeadOffice", location: "HQ Server Room", ip: "172.16.0.50", status: "Online" },
  { id: "dev-8", name: "Jetty NVR CCTV Camera", vendor: "Hikvision", model: "DS-7616NI", type: "cctv", siteCategory: "JettyPort", location: "Port Security Gate", ip: "10.0.1.30", status: "Online" },
];

export default function DeviceListPage() {
  const [devices, setDevices] = useState<NetworkDevice[]>(() => {
    try {
      const saved = localStorage.getItem("mnop_devices");
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_FALLBACK_DEVICES;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSiteFilter, setActiveSiteFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<NetworkDevice | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<NetworkDevice, "id">>({
    name: "",
    vendor: "MikroTik",
    model: "",
    type: "radio",
    siteCategory: "BatuahSite",
    location: "",
    ip: "",
    status: "Online",
  });

  // Fetch devices from backend API on mount or filter change
  useEffect(() => {
    let isMounted = true;
    async function loadDevices() {
      setLoading(true);
      const apiDevices = await deviceService.getDevices(activeSiteFilter);
      if (isMounted && apiDevices.length > 0) {
        setDevices(apiDevices);
      }
      if (isMounted) setLoading(false);
    }
    loadDevices();
    return () => { isMounted = false; };
  }, [activeSiteFilter]);

  const handleOpenAddModal = () => {
    setEditingDevice(null);
    setFormData({
      name: "",
      vendor: "MikroTik",
      model: "",
      type: "radio",
      siteCategory: activeSiteFilter !== "ALL" ? (activeSiteFilter as NetworkDevice["siteCategory"]) : "BatuahSite",
      location: "",
      ip: "10.0.1.",
      status: "Online",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (device: NetworkDevice) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      vendor: device.vendor,
      model: device.model,
      type: device.type,
      siteCategory: device.siteCategory,
      location: device.location,
      ip: device.ip,
      status: device.status,
    });
    setIsModalOpen(true);
  };

  const updateAndSaveDevices = (newDevices: NetworkDevice[]) => {
    setDevices(newDevices);
    try {
      localStorage.setItem("mnop_devices", JSON.stringify(newDevices));
    } catch {}
  };

  const handleDeleteDevice = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus device ini dari inventory?")) {
      try {
        await deviceService.deleteDevice(id);
      } catch (err) {
        console.warn("Backend delete API warning:", err);
      }
      const updated = devices.filter((d) => d.id !== id);
      updateAndSaveDevices(updated);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.ip) return;

    let updatedDevices: NetworkDevice[];
    if (editingDevice) {
      try {
        await deviceService.updateDevice(editingDevice.id, formData);
      } catch (err) {
        console.warn("Backend update API warning:", err);
      }
      updatedDevices = devices.map((d) => (d.id === editingDevice.id ? { ...formData, id: editingDevice.id } : d));
    } else {
      let newDev: NetworkDevice;
      try {
        newDev = await deviceService.createDevice(formData);
      } catch (err) {
        console.warn("Backend create API warning:", err);
        newDev = { ...formData, id: `dev-${Date.now()}` };
      }
      updatedDevices = [...devices, newDev];
    }
    updateAndSaveDevices(updatedDevices);
    setIsModalOpen(false);
  };

  const filteredDevices = devices.filter((d) => {
    const matchesSite = activeSiteFilter === "ALL" || d.siteCategory === activeSiteFilter;
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.ip.includes(searchQuery);

    return matchesSite && matchesSearch;
  });

  // Dynamically compute site filter tabs from SITES_CONFIG + any custom siteCategory in devices state
  const dynamicSiteTabs = [
    ...SITES_CONFIG,
    ...Array.from(new Set(devices.map((d) => d.siteCategory)))
      .filter((cat) => cat && !SITES_CONFIG.some((s) => s.id === cat))
      .map((cat) => ({ id: cat, label: cat })),
  ];

  const uniqueDeviceTypes = Array.from(new Set([
    "router", "switch", "radio", "ap", "firewall", "server", "nas", "fingerprint", "printer", "smarttv", "cctv", "ups",
    ...devices.map(d => d.type)
  ]));

  const getDeviceIcon = (type: NetworkDevice["type"]) => {
    switch (type) {
      case "nas": return <HardDrive className="h-4 w-4 text-purple-500" />;
      case "fingerprint": return <Fingerprint className="h-4 w-4 text-amber-500" />;
      case "printer": return <Printer className="h-4 w-4 text-sky-500" />;
      case "smarttv": return <Tv className="h-4 w-4 text-emerald-500" />;
      case "cctv": return <Video className="h-4 w-4 text-rose-500" />;
      case "ups": return <Zap className="h-4 w-4 text-yellow-500" />;
      default: return <Server className="h-4 w-4 text-amber-500" />;
    }
  };

  const handleExportBackup = (device: NetworkDevice) => {
    const backupContent = `# MNOP Enterprise Configuration Backup Export
# Device Name: ${device.name}
# Vendor: ${device.vendor} ${device.model} (${device.type.toUpperCase()})
# IP Address: ${device.ip}
# Site Category: ${device.siteCategory}
# Export Timestamp: ${new Date().toISOString()}

/system identity set name="${device.name.replace(/\s+/g, "_")}"
/ip address add address=${device.ip}/24 interface=ether1 comment="MNOP Management IP"
/system ntp client set enabled=yes primary-ntp=10.0.0.1
/tool snmp set enabled=yes community=public
/export hide-sensitive
`;

    const blob = new Blob([backupContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MNOP-Backup-${device.name.replace(/\s+/g, "-")}-${device.ip}.rsc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-none px-6 py-4 space-y-6">
      {/* Sticky Header Section */}
      <div className="sticky -top-6 -mx-12 px-12 pt-6 pb-4 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="h-6 w-6 text-amber-500" />
              Device Management & Infrastructure Inventory
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Pusat Inventaris & Konfigurasi Perangkat Jaringan (Multi-Site Enterprise)</p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm shadow-xs transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Tambah Device Baru
          </button>
        </div>

        {/* Multi-Site Selector & Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          {/* Site Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-xs font-semibold border border-slate-200/80 dark:border-slate-800">
            <Building2 className="h-4 w-4 text-slate-400 ml-2 mr-1" />
            {dynamicSiteTabs.map((site) => (
              <button
                key={site.id}
                onClick={() => setActiveSiteFilter(site.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap",
                  activeSiteFilter === site.id
                    ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                {site.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Device, IP, Vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Device Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Perangkat</th>
                <th className="px-6 py-4">Vendor & Tipe</th>
                <th className="px-6 py-4">Site Area</th>
                <th className="px-6 py-4">Lokasi Fisik</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredDevices.map((device) => (
                <tr key={device.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                        {getDeviceIcon(device.type)}
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">{device.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{device.vendor}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{device.model} • {device.type.toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-semibold">
                      {device.siteCategory}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    {device.location}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {device.ip}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                        device.status === "Online"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : device.status === "Offline"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          device.status === "Online"
                            ? "bg-emerald-500"
                            : device.status === "Offline"
                            ? "bg-rose-500 animate-pulse"
                            : "bg-amber-500"
                        )}
                      />
                      {device.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleExportBackup(device)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Export Backup Config (.rsc)"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(device)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Device"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDevice(device.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Hapus Device"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDevices.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada device ditemukan pada filter site ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Device */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                  {editingDevice ? "Edit Device Inventory" : "Tambah Device Inventory Baru"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Nama Device / Host</label>
                  <input
                    type="text"
                    required
                    placeholder="mis. NAS Storage Backup / Mesin Absen HR"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1">Kategori Site</label>
                    <input
                      list="site-categories"
                      value={formData.siteCategory}
                      onChange={(e) => setFormData({ ...formData, siteCategory: e.target.value as NetworkDevice["siteCategory"] })}
                      placeholder="Pilih atau Ketik Baru..."
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
                    />
                    <datalist id="site-categories">
                      {uniqueSiteCategories.map(cat => (
                        <option key={cat} value={cat}>
                          {SITES_CONFIG.find(s => s.id === cat)?.label || cat}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1">Tipe Device</label>
                    <input
                      list="device-types"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as NetworkDevice["type"] })}
                      placeholder="Pilih atau Ketik Baru..."
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
                    />
                    <datalist id="device-types">
                      {uniqueDeviceTypes.map(t => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1">Vendor</label>
                    <input
                      type="text"
                      required
                      placeholder="MikroTik / Ruijie / Synology / ZKTeco / Hikvision"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1">Model / Seri</label>
                    <input
                      type="text"
                      required
                      placeholder="mis. RS2423+ / MB20"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1">IP Address</label>
                    <input
                      type="text"
                      required
                      placeholder="10.0.1.x / 172.16.x.x"
                      value={formData.ip}
                      onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1">Status Awal</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as NetworkDevice["status"] })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
                    >
                      <option value="Online">Online</option>
                      <option value="Warning">Warning</option>
                      <option value="Offline">Offline</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Lokasi Fisik Network</label>
                  <input
                    type="text"
                    required
                    placeholder="mis. Main Server Room / HR Office Entrance"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-md transition-all active:scale-95"
                  >
                    <Check className="h-4 w-4" />
                    Simpan Device
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
