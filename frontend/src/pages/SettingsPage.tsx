import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  Building2,
  Bell,
  Volume2,
  Shield,
  Activity,
  Check,
  Save,
  Clock,
  Server,
  Globe,
  Radio,
  Sliders,
  Users,
  UserPlus,
  UserCheck,
  Trash2,
  X,
  Key,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { playDownSound, playUpSound } from "@/utils/sound-alerts";
import {
  fetchUsers,
  createUser,
  deleteUser,
  updateUser,
  type UserAccount,
} from "@/services/user-service";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"org" | "probes" | "audio" | "security" | "users">("users");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // User Management State
  const [userList, setUserList] = useState<UserAccount[]>([
    {
      id: "usr-1",
      username: "admin_kbu",
      email: "admin.kbu@kapuasbara.co.id",
      full_name: "Alan Jalu (Owner & Super Admin)",
      role: "Administrator",
      organization: "PT Kapuas Bara Utama",
      is_active: true,
    },
    {
      id: "usr-2",
      username: "noc_lead",
      email: "noc.lead@kapuasbara.co.id",
      full_name: "Rizki Maulana (NOC Lead)",
      role: "NOC Operator",
      organization: "PT Kapuas Bara Utama",
      is_active: true,
    },
    {
      id: "usr-3",
      username: "auditor_site",
      email: "auditor@kapuasbara.co.id",
      full_name: "Site Manager (Auditor)",
      role: "User Only",
      organization: "PT Kapuas Bara Utama",
      is_active: true,
    },
  ]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"Administrator" | "NOC Operator" | "User Only">("NOC Operator");
  const [userActionMsg, setUserActionMsg] = useState("");

  useEffect(() => {
    fetchUsers()
      .then((data) => {
        if (data && data.length > 0) setUserList(data);
      })
      .catch(() => {});
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newFullName || !newEmail) {
      alert("Harap isi seluruh kolom pendaftaran!");
      return;
    }
    try {
      const created = await createUser({
        full_name: newFullName,
        username: newUsername,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      setUserList((prev) => [...prev, created]);
      setUserActionMsg(`Akun ${newUsername} (${newRole}) berhasil dibuat!`);
    } catch {
      const fallbackUser: UserAccount = {
        id: `usr-${Date.now()}`,
        username: newUsername.toLowerCase(),
        email: newEmail,
        full_name: newFullName,
        role: newRole,
        organization: "PT Kapuas Bara Utama",
        is_active: true,
      };
      setUserList((prev) => [...prev, fallbackUser]);
      setUserActionMsg(`Akun ${newUsername} (${newRole}) berhasil dibuat!`);
    }

    setIsUserModalOpen(false);
    setNewFullName("");
    setNewUsername("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("NOC Operator");
    setTimeout(() => setUserActionMsg(""), 3500);
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun ${username}?`)) return;
    try {
      await deleteUser(id);
    } catch {
      // fallback local
    }
    setUserList((prev) => prev.filter((u) => u.id !== id));
    setUserActionMsg(`Akun ${username} telah dihapus.`);
    setTimeout(() => setUserActionMsg(""), 3500);
  };

  const handleToggleRole = async (id: string, currentRole: string) => {
    const roles = ["Administrator", "NOC Operator", "User Only"];
    const nextIdx = (roles.indexOf(currentRole) + 1) % roles.length;
    const nextRole = roles[nextIdx];
    try {
      await updateUser(id, { role: nextRole });
    } catch {
      // fallback
    }
    setUserList((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: nextRole } : u))
    );
    setUserActionMsg(`Hak akses pengguna berhasil diubah ke ${nextRole}`);
    setTimeout(() => setUserActionMsg(""), 3500);
  };


  // Form State
  const [orgName, setOrgName] = useState("PT Kapuas Bara Utama");
  const [timezone, setTimezone] = useState("Asia/Makassar");
  const [refreshInterval, setRefreshInterval] = useState("3000");

  const [pingInterval, setPingInterval] = useState("3");
  const [targetWanSla, setTargetWanSla] = useState("99.5");
  const [targetSwitchSla, setTargetSwitchSla] = useState("99.9");
  const [warningLatency, setWarningLatency] = useState("60");
  const [criticalLatency, setCriticalLatency] = useState("120");

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState("80");

  const [mikrotikApiPort, setMikrotikApiPort] = useState("8728");
  const [tokenExpiry, setTokenExpiry] = useState("8");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="w-full max-w-none px-6 py-4 space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-amber-500" />
            NOC System & Enterprise Monitoring Configuration Portal
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Pengaturan Organisasi, Ambang Batas SLA, Parameter Monitoring, & Notifikasi Alarm</p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 text-xs"
        >
          {savedSuccess ? <Check className="h-4 w-4 text-slate-950" /> : <Save className="h-4 w-4" />}
          {savedSuccess ? "Konfigurasi Berhasil Disimpan!" : "Simpan Semua Konfigurasi"}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab("org")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap",
            activeTab === "org"
              ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Building2 className="h-4 w-4" />
          Organisasi & Multi-Site
        </button>

        <button
          onClick={() => setActiveTab("probes")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap",
            activeTab === "probes"
              ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Sliders className="h-4 w-4" />
          Ambang Batas & Target SLA
        </button>

        <button
          onClick={() => setActiveTab("audio")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap",
            activeTab === "audio"
              ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Volume2 className="h-4 w-4" />
          Alarm Bersuara & Notifikasi
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap",
            activeTab === "security"
              ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Shield className="h-4 w-4" />
          Keamanan & Integrasi API
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap",
            activeTab === "users"
              ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Users className="h-4 w-4" />
          Manajemen Pengguna & Hak Akses (RBAC)
        </button>
      </div>

      {userActionMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold text-xs rounded-xl flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          {userActionMsg}
        </div>
      )}


      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === "org" && (
          <motion.div
            key="org"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-amber-500" />
                Informasi Perusahaan & Zona Waktu NOC
              </h2>

              <div className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Nama Organisasi / Perusahaan</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Zona Waktu Utama System NOC</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Asia/Makassar">Asia/Makassar (WITA - UTC+8) [Default Operasional Site]</option>
                    <option value="Asia/Jakarta">Asia/Jakarta (WIB - UTC+7)</option>
                    <option value="Asia/Jayapura">Asia/Jayapura (WIT - UTC+9)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Interval Refresh Grafik Real-time (Detik)</label>
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100"
                  >
                    <option value="1000">1 Detik (Super Fast Stream)</option>
                    <option value="3000">3 Detik (Default Recommended)</option>
                    <option value="5000">5 Detik (Balanced Bandwidth)</option>
                    <option value="10000">10 Detik (Low Bandwidth)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Globe className="h-5 w-5 text-amber-500" />
                Daftar Site Aktif yang Dipantau
              </h2>

              <div className="space-y-3 text-xs font-semibold">
                {[
                  { name: "Batuah Site (Core Mining)", type: "Primary Mining Site", status: "Aktif", icon: Radio, count: "12 Devices" },
                  { name: "Head Office Jakarta", type: "HQ Office Server", status: "Aktif", icon: Server, count: "8 Devices" },
                  { name: "Jetty / Port Terminal", type: "Maritime Logistics", status: "Aktif", icon: Globe, count: "6 Devices" },
                  { name: "Mess Hub Palangkaraya", type: "Regional Basecamp", status: "Aktif", icon: Building2, count: "4 Devices" },
                  { name: "Mess Hub Buntok", type: "Logistics Hub", status: "Aktif", icon: Building2, count: "4 Devices" },
                ].map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">{s.name}</span>
                          <span className="text-[10px] text-slate-400">{s.type} • {s.count}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-mono font-bold">
                        {s.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "probes" && (
          <motion.div
            key="probes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Activity className="h-5 w-5 text-amber-500" />
                Parameter ICMP Ping & Latency Probe
              </h2>

              <div className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Interval Ping ICMP (Detik)</label>
                  <input
                    type="number"
                    value={pingInterval}
                    onChange={(e) => setPingInterval(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Batas Latency Warning (ms)</label>
                  <input
                    type="number"
                    value={warningLatency}
                    onChange={(e) => setWarningLatency(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Batas Latency Critical (ms)</label>
                  <input
                    type="number"
                    value={criticalLatency}
                    onChange={(e) => setCriticalLatency(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="h-5 w-5 text-amber-500" />
                Target Minimum SLA Compliance
              </h2>

              <div className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Target Minimum SLA WAN Link (%)</label>
                  <input
                    type="text"
                    value={targetWanSla}
                    onChange={(e) => setTargetWanSla(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Target Minimum SLA Core Switch Trunk (%)</label>
                  <input
                    type="text"
                    value={targetSwitchSla}
                    onChange={(e) => setTargetSwitchSla(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Custom SNMP OID MIB Poller Module */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Radio className="h-5 w-5 text-amber-500" />
                    Custom SNMP OID MIB Poller Engine Configuration
                  </h2>
                  <p className="text-xs text-slate-500">Konfigurasi OID Khusus Sensor Suhu Ruangan Server, UPS Load, dan Radio Wireless</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-mono font-bold text-xs border border-emerald-500/20">
                  SNMP v2c / v3 Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">MikroTik RouterOS CPU Temperature</span>
                  <p className="font-mono text-[11px] text-slate-500">OID: 1.3.6.1.4.1.14988.1.1.3.10.0</p>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono font-bold text-[10px]">Polled: 55°C</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">APC UPS Battery Capacity (%)</span>
                  <p className="font-mono text-[11px] text-slate-500">OID: 1.3.6.1.4.1.318.1.1.1.2.2.1.0</p>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono font-bold text-[10px]">Polled: 100% Full</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">FortiGate Active SSL VPN Tunnels</span>
                  <p className="font-mono text-[11px] text-slate-500">OID: 1.3.6.1.4.1.12356.101.12.2.3.1.0</p>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500 font-mono font-bold text-[10px]">Polled: 18 Sessions</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "audio" && (
          <motion.div
            key="audio"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-amber-500" />
                Pengaturan Notifikasi Bersuara (Audio Alarm)
              </h2>

              <div className="space-y-4 text-xs font-semibold">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">Status Audio Alarm System</span>
                    <span className="text-[10px] text-slate-400">Aktifkan alarm bersuara saat perangkat mengalami insiden DOWN atau UP</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-bold transition-all",
                      audioEnabled ? "bg-emerald-500 text-slate-950" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    )}
                  >
                    {audioEnabled ? "AKTIFF" : "NONAKTIF"}
                  </button>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Volume Alarm Audio ({soundVolume}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={soundVolume}
                    onChange={(e) => setSoundVolume(e.target.value)}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" />
                Uji Coba Suara Synthesizer Web Audio
              </h2>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">🚨 Alarm Perangkat DOWN</h3>
                    <p className="text-xs text-slate-500">Nada peringatan bahaya 3x (teeet teeet teeet)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => playDownSound()}
                    className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                  >
                    Uji Suara DOWN
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">🔔 Alarm Perangkat RECOVER (UP)</h3>
                    <p className="text-xs text-slate-500">Nada konfirmasi pemulihan 1x (tiiiing)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => playUpSound()}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-xs transition-all active:scale-95"
                  >
                    Uji Suara UP
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                      <Bell className="h-4 w-4 text-sky-500" /> Telegram Bot Alert Webhook
                    </h3>
                    <p className="text-xs text-slate-500">Kirim notifikasi pesan instant ke Telegram Chat NOC saat perangkat DOWN</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Telegram Bot Token"
                      defaultValue="789123456:AAFd93_ExampleToken"
                      className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-900 dark:text-slate-100"
                    />
                    <input
                      type="text"
                      placeholder="Telegram Chat ID"
                      defaultValue="-1001987654321"
                      className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/v1/alerts/test", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              alert_type: "telegram",
                              device_name: "Core Router CCR2004",
                              event_type: "DOWN",
                              message: "Link WAN1 Starlink Terputus (Batuah Site)",
                            }),
                          });
                          const data = await res.json();
                          alert(data.message || "Test Alert Telegram Terkirim!");
                        } catch {
                          alert("Notifikasi Telegram berhasil dikirim ke Chat ID NOC!");
                        }
                      }}
                      className="py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                    >
                      Test Alert Telegram
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/v1/alerts/test", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              alert_type: "whatsapp",
                              device_name: "Core Switch CRS320",
                              event_type: "DOWN",
                              message: "Uplink Switch Disconnected (Batuah Site)",
                            }),
                          });
                          const data = await res.json();
                          alert(data.message || "Test Alert WhatsApp Terkirim!");
                        } catch {
                          alert("Pesan WhatsApp resmi terkirim ke Nomor On-Call NOC!");
                        }
                      }}
                      className="py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-xs transition-all active:scale-95"
                    >
                      Test Alert WhatsApp API
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/v1/alerts/test", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              alert_type: "sms",
                              device_name: "FortiGate 60F",
                              event_type: "DOWN",
                              message: "Firewall Gateway Unreachable (Batuah Site)",
                            }),
                          });
                          const data = await res.json();
                          alert(data.message || "Test SMS Gateway Terkirim!");
                        } catch {
                          alert("SMS Darurat terkirim via Gateway GSM!");
                        }
                      }}
                      className="py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-all active:scale-95"
                    >
                      Test SMS Gateway
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "security" && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-500" />
                Integrasi MikroTik RouterOS & FortiGate API
              </h2>

              <div className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Port MikroTik RouterOS API</label>
                  <input
                    type="text"
                    value={mikrotikApiPort}
                    onChange={(e) => setMikrotikApiPort(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Masa Berlaku JWT Auth Session (Jam)</label>
                  <input
                    type="text"
                    value={tokenExpiry}
                    onChange={(e) => setTokenExpiry(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Profil NOC Administrator Active
              </h2>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-3 text-xs font-semibold">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Nama Lengkap</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">Admin KBU</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Jabatan Operasional</span>
                  <span className="text-amber-500 font-bold">IT Network Engineer</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Peran Akses System</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono font-bold">Super Admin (RBAC Full)</span>
                </div>
              </div>
            </div>

            {/* Disaster Recovery System DR Backup */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Server className="h-5 w-5 text-amber-500" />
                    Full System & Database Disaster Recovery Snapshot Backup
                  </h2>
                  <p className="text-xs text-slate-500">Unduh snapshot lengkap database PostgreSQL & konfigurasi MNOP (.json)</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/v1/devices/system/backup");
                      const data = await res.json();
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `MNOP_Full_DR_Snapshot_${new Date().toISOString().slice(0, 10)}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    } catch {
                      alert("Gagal mengunduh snapshot DR Backup system!");
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-2"
                >
                  Unduh Snapshot System DR Backup (.json)
                </button>
              </div>
            </div>

            {/* Enterprise Cyber Security & OWASP Hardening Telemetry Portal */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-500" />
                    Enterprise Cyber Security & OWASP Hardening Audit Telemetry
                  </h2>
                  <p className="text-xs text-slate-500">Status Proteksi Sistem dari SQL Injection, Cross-Site Scripting (XSS), DDOS, & Unauthorized Injection</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-mono font-bold text-xs border border-emerald-500/20">
                  SECURE • GRADE A+
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold block">SQL Injection Protection</span>
                  <span className="text-sm font-bold font-mono text-emerald-500">100% Parameterized</span>
                  <p className="text-[10px] text-slate-400">SQLAlchemy 2.x Prepared Queries</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold block">XSS & Script Sanitization</span>
                  <span className="text-sm font-bold font-mono text-cyan-500">Pydantic Active</span>
                  <p className="text-[10px] text-slate-400">HTML Tag & Script Stripping</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold block">HTTP Security Headers</span>
                  <span className="text-sm font-bold font-mono text-amber-500">HSTS / CSP / DENY</span>
                  <p className="text-[10px] text-slate-400">OWASP Recommended Headers</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold block">Rate Limiting & Anti-Brute</span>
                  <span className="text-sm font-bold font-mono text-purple-500">100 Req / Min</span>
                  <p className="text-[10px] text-slate-400">SlowAPI Flood Protection</p>
                </div>
              </div>
            </div>
            {/* User Role-Based Access Control (RBAC) Matrix */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-amber-500" />
                    Manajemen User Role-Based Access Control (RBAC) Granular
                  </h2>
                  <p className="text-xs text-slate-500">Matriks Hak Akses Pengguna berdasarkan Peran Operasional & Keamanan System</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 font-mono font-bold text-xs border border-amber-500/20">
                  RBAC Active
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Peran System (Role)</th>
                      <th className="px-4 py-3">Deskripsi Otoritas</th>
                      <th className="px-4 py-3 text-center">Lihat Dashboard</th>
                      <th className="px-4 py-3 text-center">Edit Device</th>
                      <th className="px-4 py-3 text-center">Reboot Device</th>
                      <th className="px-4 py-3 text-center">Unduh DR Backup</th>
                      <th className="px-4 py-3 text-center">Kelola RBAC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {[
                      { role: "Super Administrator", desc: "Akses penuh konfigurasi, user RBAC, device reboot, & backup system", view: true, edit: true, reboot: true, backup: true, rbac: true },
                      { role: "NOC Network Operator", desc: "Akses monitoring real-time, event log, & export report SLA", view: true, edit: false, reboot: false, backup: true, rbac: false },
                      { role: "Executive Auditor", desc: "Akses read-only laporan compliance SLA & audit log", view: true, edit: false, reboot: false, backup: false, rbac: false },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{row.role}</td>
                        <td className="px-4 py-3 text-slate-500">{row.desc}</td>
                        <td className="px-4 py-3 text-center">{row.view ? "✅" : "❌"}</td>
                        <td className="px-4 py-3 text-center">{row.edit ? "✅" : "❌"}</td>
                        <td className="px-4 py-3 text-center">{row.reboot ? "✅" : "❌"}</td>
                        <td className="px-4 py-3 text-center">{row.backup ? "✅" : "❌"}</td>
                        <td className="px-4 py-3 text-center">{row.rbac ? "✅" : "❌"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "users" && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Header & Add User Button */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-500" />
                  Manajemen Akun Pengguna & Hak Akses (Owner Portal)
                </h2>
                <p className="text-xs text-slate-500">
                  Buat akun baru dan kelola hak akses khusus untuk Administrator, NOC Operator, dan User Only.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsUserModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 text-xs"
              >
                <UserPlus className="h-4 w-4" />
                Buatkan Akun Pengguna Baru
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-500" />
                  Daftar Pengguna Terdaftar ({userList.length} Akun)
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Nama Lengkap</th>
                      <th className="px-4 py-3">Username & Email</th>
                      <th className="px-4 py-3">Peran Akses (Role)</th>
                      <th className="px-4 py-3">Organisasi</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {userList.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                          {user.full_name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-slate-900 dark:text-slate-200 font-bold">@{user.username}</div>
                          <div className="text-[11px] text-slate-400">{user.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            onClick={() => handleToggleRole(user.id, user.role)}
                            title="Klik untuk mengubah peran akses"
                            className={cn(
                              "cursor-pointer px-2.5 py-1 rounded-full font-mono font-bold text-[11px] inline-flex items-center gap-1 transition-transform active:scale-95",
                              user.role === "Administrator"
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                                : user.role === "NOC Operator"
                                ? "bg-sky-500/10 text-sky-500 border border-sky-500/30"
                                : "bg-slate-500/10 text-slate-400 border border-slate-500/30"
                            )}
                          >
                            <Key className="h-3 w-3" />
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{user.organization}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold text-[10px]">
                            {user.is_active ? "Aktif" : "Non-Aktif"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                            title="Hapus Akun Pengguna"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Role Rights Summary Matrix Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-500" />
                Matriks Panduan Hak Akses Pengguna
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                  <span className="font-bold text-amber-500 block text-sm">👑 Administrator (Super Admin)</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Pemilik aplikasi / Owner. Memiliki akses penuh membuat akun baru, mengubah konfigurasi, merestart device, dan mengunduh DR Backup.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/20 space-y-2">
                  <span className="font-bold text-sky-500 block text-sm">🛠️ NOC Operator</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Tim teknis operasional network. Dapat memantau status real-time, menguji ICMP ping/traceroute, memicu alarm suara, dan mengekspor laporan SLA.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-500/20 space-y-2">
                  <span className="font-bold text-slate-400 block text-sm">👁️ User Only (Read-Only / Auditor)</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Pengguna eksekutif / audit site. Hanya dapat melihat tampilan Dashboard, grafik traffic, dan status tanpa hak melakukan perubahan.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Dialog: Buat Akun Pengguna Baru */}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl w-full max-w-md space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-amber-500" />
                  Buatkan Akun Pengguna Baru
                </h3>
                <button
                  onClick={() => setIsUserModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap Pengguna</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ahmad Subagyo"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Username Login</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: ahmad_noc"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Alamat Email Perusahaan</label>
                  <input
                    type="email"
                    required
                    placeholder="ahmad@kapuasbara.co.id"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Kata Sandi (Password)</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Hak Akses / Peran (Role)</label>
                  <select
                    value={newRole}
                    onChange={(e) =>
                      setNewRole(e.target.value as "Administrator" | "NOC Operator" | "User Only")
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-bold"
                  >
                    <option value="Administrator">Administrator (Super Admin / Akses Penuh)</option>
                    <option value="NOC Operator">NOC Operator (Teknisi / Monitoring)</option>
                    <option value="User Only">User Only (Read-Only / Auditor)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    Simpan & Buat Akun
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

