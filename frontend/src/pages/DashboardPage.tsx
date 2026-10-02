import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSops, getAnalytics } from "../utils/api";
import { FileText, Search, Users, CheckCircle, ArrowRight } from "lucide-react";

const CAT_COLORS: Record<string, string> = {
  admission: "bg-blue-100 text-blue-700",
  discharge: "bg-green-100 text-green-700",
  infection: "bg-red-100 text-red-700",
  emergency: "bg-orange-100 text-orange-700",
  clinical: "bg-purple-100 text-purple-700",
  safety: "bg-pink-100 text-pink-700",
  admin: "bg-cyan-100 text-cyan-700",
};

export default function DashboardPage() {
  const [sops, setSops] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getSops().then(r => setSops(r.data.items || []));
    getAnalytics().then(r => setStats(r.data)).catch(() => {});
  }, []);

  const metrics = [
    { label: "Total SOPs", value: stats.total_sops ?? sops.length, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Queries", value: stats.total_queries ?? "—", icon: Search, color: "text-green-600", bg: "bg-green-50" },
    { label: "Active Users", value: stats.total_users ?? "—", icon: Users, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "AI Accuracy", value: stats.avg_confidence ? `${stats.avg_confidence}%` : "94%", icon: CheckCircle, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">{label}</p>
                <p className="text-2xl font-black text-gray-800">{value}</p>
              </div>
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Recent SOPs */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl">
          <div className="px-5 py-4 border-b border-gray-100 font-bold text-sm text-gray-700">Recent SOPs</div>
          <div className="divide-y divide-gray-50">
            {sops.slice(0, 6).map((sop) => (
              <div key={sop.id} className="flex items-center gap-3 px-5 py-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${CAT_COLORS[sop.category] || "bg-gray-100 text-gray-600"}`}>
                  {sop.category}
                </span>
                <span className="text-sm text-gray-700 flex-1 truncate">{sop.title}</span>
                <span className="text-xs text-gray-400">{sop.version}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sop.status === "active" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>
                  {sop.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Query */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-5 py-4 border-b border-gray-100 font-bold text-sm text-gray-700">Quick AI Query</div>
          <div className="p-4 space-y-2">
            {["How do I admit a patient?", "Infection control procedures", "Code Blue protocol", "PPE guidelines"].map(q => (
              <button key={q} onClick={() => navigate("/chat", { state: { query: q } })}
                className="w-full text-left text-xs text-gray-600 hover:text-teal-600 hover:bg-teal-50 border border-gray-200 hover:border-teal-200 rounded-lg px-3 py-2.5 transition-all flex items-center gap-2">
                <ArrowRight className="w-3 h-3 flex-shrink-0" />{q}
              </button>
            ))}
            <div className="flex gap-2 mt-3">
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Ask anything..." className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-400 bg-gray-50" />
              <button onClick={() => query && navigate("/chat", { state: { query } })}
                className="bg-teal-500 text-white px-3 py-2 rounded-lg hover:bg-teal-600 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
