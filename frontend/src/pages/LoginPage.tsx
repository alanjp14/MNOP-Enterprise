import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, User, Lock, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuthStore, type UserProfile } from "@/stores/auth-store";
import { fetchApi } from "@/lib/api-client";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const login = useAuthStore((state) => state.login);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetchApi<{ access_token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      // Initially set token so fetchProfile works
      login(response.access_token, null as unknown as UserProfile);
      
      // Fetch full profile immediately after login
      await fetchProfile();

      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal melakukan login. Periksa username dan password Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a1128] to-[#040814] text-slate-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 mb-6 rotate-3 hover:rotate-0 transition-transform duration-300">
            <ShieldCheck className="h-8 w-8 text-slate-900" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">MNOP System</h1>
          <p className="text-slate-400 text-center text-sm">
            Monitoring Network Operations Platform
            <br />
            PT Kapuas Bara Utama
          </p>
        </div>

        <div className="backdrop-blur-xl bg-slate-800/40 p-8 rounded-3xl border border-slate-700/50 shadow-2xl">
          <h2 className="text-xl font-semibold mb-6">Autentikasi Akses</h2>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl mb-6 flex items-start gap-3">
              <div className="mt-0.5">⚠️</div>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 block p-3 pl-11 transition-all placeholder:text-slate-600"
                  placeholder="admin_kbu"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 block p-3 pl-11 pr-11 transition-all placeholder:text-slate-600"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-amber-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold rounded-xl px-4 py-3.5 mt-4 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Mengotentikasi...
                </>
              ) : (
                <>
                  Masuk Sistem
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>© 2026 PT Kapuas Bara Utama. All rights reserved.</p>
          <p className="mt-1">Restricted Access. Authorized Personnel Only.</p>
        </div>
      </div>
    </div>
  );
}
