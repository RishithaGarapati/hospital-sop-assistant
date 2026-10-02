import { useEffect, useState } from "react";
import { getSops, deleteSop } from "../utils/api";
import { Search, Trash2, Download, Eye, Plus } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import UploadModal from "../components/sop/UploadModal";

const CATS = ["all","admission","discharge","infection","emergency","clinical","safety","admin"];
const CAT_COLORS: Record<string,string> = {
  admission:"bg-blue-100 text-blue-700", discharge:"bg-green-100 text-green-700",
  infection:"bg-red-100 text-red-700", emergency:"bg-orange-100 text-orange-700",
  clinical:"bg-purple-100 text-purple-700", safety:"bg-pink-100 text-pink-700",
  admin:"bg-cyan-100 text-cyan-700",
};

export default function RepositoryPage() {
  const [sops, setSops] = useState<any[]>([]);
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const user = useAuthStore(s => s.user);

  const load = () => {
    const params: any = {};
    if (cat !== "all") params.category = cat;
    if (search) params.search = search;
    getSops(params).then(r => setSops(r.data.items || []));
  };

  useEffect(() => { load(); }, [cat, search]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this SOP and all its vector data?")) return;
    await deleteSop(id);
    load();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SOPs..."
            className="text-sm outline-none bg-transparent flex-1 text-gray-700" />
        </div>
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${cat === c ? "bg-slate-800 text-teal-400 border-slate-800" : "bg-white text-gray-500 border-gray-200 hover:border-teal-400"}`}>
            {c}
          </button>
        ))}
        {user?.role === "admin" && (
          <button onClick={() => setShowUpload(true)}
            className="ml-auto flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add SOP
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-4">
        {sops.map(sop => (
          <div key={sop.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-teal-300 hover:shadow-sm transition-all group relative">
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-teal-500 hover:border-teal-300 bg-white">
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-300 bg-white">
                <Download className="w-3.5 h-3.5" />
              </button>
              {user?.role === "admin" && (
                <button onClick={() => handleDelete(sop.id)}
                  className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 bg-white">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md mb-2 ${CAT_COLORS[sop.category] || "bg-gray-100 text-gray-600"}`}>
              {sop.category}
            </span>
            <h3 className="text-sm font-bold text-gray-800 mb-1 pr-16">{sop.title}</h3>
            <div className="text-xs text-gray-400 flex gap-3">
              <span>{sop.department}</span>
              <span>{sop.version}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">{sop.author}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sop.status === "active" ? "bg-green-50 text-green-600" : sop.status === "processing" ? "bg-yellow-50 text-yellow-600" : "bg-gray-100 text-gray-500"}`}>
                {sop.status}
              </span>
            </div>
          </div>
        ))}
        {sops.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <FileIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No SOPs found. Upload your first SOP to get started.</p>
          </div>
        )}
      </div>
      {showUpload && <UploadModal onClose={() => { setShowUpload(false); load(); }} />}
    </div>
  );
}

function FileIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}
