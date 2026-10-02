import { useEffect, useState } from "react";
import { getSops, generateSummary } from "../utils/api";
import { Sparkles, Loader2 } from "lucide-react";

export default function SummaryPage() {
  const [sops, setSops] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [type, setType] = useState("quick");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getSops().then(r => { setSops(r.data.items || []); }); }, []);

  const generate = async () => {
    if (!selected) return;
    setLoading(true); setResult(null);
    try {
      const res = await generateSummary(selected.id, type);
      setResult(res.data);
    } finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* SOP List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-sm font-bold text-gray-700">Select SOP</div>
        <div className="overflow-y-auto max-h-[70vh]">
          {sops.map(sop => (
            <button key={sop.id} onClick={() => { setSelected(sop); setResult(null); }}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${selected?.id === sop.id ? "bg-teal-50 border-l-2 border-l-teal-500" : "hover:bg-gray-50"}`}>
              <p className={`text-xs font-bold mb-0.5 ${selected?.id === sop.id ? "text-teal-600" : "text-gray-700"}`}>{sop.title}</p>
              <p className="text-xs text-gray-400">{sop.version} · {sop.category}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Summary Panel */}
      <div className="col-span-3 bg-white border border-gray-200 rounded-xl flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-800 text-sm">{selected?.title || "Select an SOP"}</h2>
            {selected && <p className="text-xs text-gray-400 mt-0.5">{selected.version} · {selected.author}</p>}
          </div>
          <button onClick={generate} disabled={!selected || loading}
            className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Summary
          </button>
        </div>

        {/* Type Tabs */}
        <div className="px-5 py-3 border-b border-gray-100 flex gap-2">
          {["quick","detailed","bullet"].map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${type === t ? "bg-slate-800 text-white" : "border border-gray-200 text-gray-500 hover:border-teal-400"}`}>
              {t === "bullet" ? "Bullet Points" : t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          {!selected && (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <Sparkles className="w-12 h-12 mb-3" />
              <p className="text-sm">Select an SOP and click Generate Summary</p>
            </div>
          )}
          {selected && !result && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <Sparkles className="w-12 h-12 mb-3 text-teal-300" />
              <p className="text-sm text-gray-400">Click "Generate Summary" to get an AI-powered summary of <strong className="text-gray-600">{selected.title}</strong></p>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-3" />
              <p className="text-sm text-gray-400">Generating {type} summary with AI...</p>
            </div>
          )}
          {result && (
            <div>
              {result.bullet_points ? (
                <ul className="space-y-2">
                  {result.bullet_points.map((b: string, i: number) => (
                    <li key={i} className="flex gap-2 items-start text-sm text-gray-700">
                      <span className="text-teal-500 mt-1">✓</span>{b}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed">{result.content}</p>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                AI-generated from hospital SOP database · {selected.version}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
