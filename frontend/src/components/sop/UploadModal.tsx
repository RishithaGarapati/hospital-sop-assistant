import { useState, useRef } from "react";
import { uploadSop } from "../../utils/api";
import { X, Upload, FileCheck, Loader2 } from "lucide-react";

const CATS = ["admission","discharge","infection","emergency","clinical","safety","admin"];

export default function UploadModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title:"", category:"admission", department:"", version:"v1.0", author:"" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file || !form.title) { setError("Please select a file and enter a title."); return; }
    setSaving(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      await uploadSop(fd);
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Upload failed. Please try again.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Upload SOP Document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{error}</div>}
          {/* Drop zone */}
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 hover:border-teal-400 rounded-xl p-6 text-center cursor-pointer transition-colors">
            {file ? (
              <div className="flex items-center justify-center gap-2 text-teal-600">
                <FileCheck className="w-6 h-6" />
                <span className="text-sm font-semibold">{file.name}</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Click to select file</p>
                <p className="text-xs text-gray-300 mt-1">PDF, DOCX, TXT supported</p>
              </>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden"
              onChange={e => e.target.files && setFile(e.target.files[0])} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">SOP Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="e.g. Patient Admission SOP"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 bg-gray-50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 bg-gray-50 capitalize">
                {CATS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Department</label>
              <input value={form.department} onChange={e => setForm(p => ({...p, department: e.target.value}))} placeholder="e.g. ICU"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 bg-gray-50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Version</label>
              <input value={form.version} onChange={e => setForm(p => ({...p, version: e.target.value}))} placeholder="v1.0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 bg-gray-50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Author</label>
              <input value={form.author} onChange={e => setForm(p => ({...p, author: e.target.value}))} placeholder="Dr. Name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 bg-gray-50" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="border border-gray-200 text-gray-500 text-sm px-4 py-2 rounded-lg hover:border-gray-300">Cancel</button>
          <button onClick={handleUpload} disabled={saving}
            className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload & Process
          </button>
        </div>
      </div>
    </div>
  );
}
