import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { login } from "../utils/api";
import { HeartPulse, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@hospital.in");
  const [password, setPassword] = useState("Admin@1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await login(email, password);
      const { access_token, user_id, name, role } = res.data;
      setAuth(access_token, { id: user_id, name, email, role });
      navigate("/");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HeartPulse className="text-white w-9 h-9" />
          </div>
          <h1 className="text-white text-2xl font-bold">MedSOP AI</h1>
          <p className="text-slate-400 text-sm mt-1">Hospital SOP Assistant Platform</p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-gray-800 font-bold text-lg mb-6">Sign in to your account</h2>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-4">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-400 bg-gray-50" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign In"}
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-4">Default: admin@hospital.in / Admin@1234</p>
        </div>
      </div>
    </div>
  );
}
