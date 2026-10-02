import { useEffect, useState } from "react";
import { getAnalytics, getTopSops } from "../utils/api";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>({});
  const [topSops, setTopSops] = useState<any[]>([]);

  useEffect(() => {
    getAnalytics().then(r => setStats(r.data)).catch(() => {});
    getTopSops().then(r => setTopSops(r.data)).catch(() => {});
  }, []);

  const maxCount = topSops[0]?.count || 1;

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total SOPs", value: stats.total_sops ?? "—" },
          { label: "Total Queries", value: stats.total_queries ?? "—" },
          { label: "Active Users", value: stats.total_users ?? "—" },
          { label: "Avg Confidence", value: stats.avg_confidence ? `${stats.avg_confidence}%` : "—" },
        ].map(m => (
          <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">{m.label}</p>
            <p className="text-3xl font-black text-gray-800">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Top SOPs */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-5 py-4 border-b border-gray-100 font-bold text-sm text-gray-700">Most Searched SOPs</div>
          <div className="p-5 space-y-3">
            {topSops.length > 0 ? topSops.map((sop, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-4">{i+1}</span>
                <span className="text-xs text-gray-600 flex-1 truncate">{sop.title}</span>
                <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(sop.count/maxCount)*100}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-700 w-6 text-right">{sop.count}</span>
              </div>
            )) : (
              <p className="text-xs text-gray-400 text-center py-8">No search data yet. Start querying SOPs to see analytics.</p>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-5 py-4 border-b border-gray-100 font-bold text-sm text-gray-700">System Info</div>
          <div className="p-5 space-y-3 text-sm">
            {[
              ["Vector Store", "ChromaDB"],
              ["Embedding Model", "sentence-transformers / OpenAI"],
              ["LLM", "Claude (Anthropic)"],
              ["RAG Strategy", "Cosine similarity, top-5 chunks"],
              ["Chunk Size", "800 tokens, 150 overlap"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-gray-50 pb-2 last:border-0">
                <span className="text-gray-500 text-xs">{k}</span>
                <span className="text-gray-700 text-xs font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
