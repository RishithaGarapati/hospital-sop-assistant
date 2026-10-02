import { useEffect, useState } from "react";
import { getUsers, createUser, deleteUser } from "../utils/api";
import { UserPlus, Trash2, Loader2 } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"staff", department:"" });
  const [saving, setSaving] = useState(false);

  const load = () => getUsers().then(r => setUsers(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try { await createUser(form); setShowForm(false); load(); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    await deleteUser(id); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
          <UserPlus className="w-3.5 h-3.5" /> Add User
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-bold text-sm text-gray-700 mb-4">Add New User</h3>
          <div className="grid grid-cols-3 gap-3">
            {(["name","email","password","department"] as const).map(f => (
              <div key={f}>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1 capitalize">{f}</label>
                <input type={f === "password" ? "password" : "text"} value={form[f as keyof typeof form]}
                  onChange={e => setForm(p => ({...p, [f]: e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 bg-gray-50" />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(p => ({...p, role: e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400 bg-gray-50">
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreate} disabled={saving}
              className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Create User
            </button>
            <button onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-500 text-xs px-4 py-2 rounded-lg hover:border-gray-300">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            {["Name","Email","Role","Department","Status","Actions"].map(h => (
              <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">
                      {u.name.split(" ").map((n:string) => n[0]).join("").slice(0,2)}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-gray-500">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${u.role === "admin" ? "bg-yellow-100 text-yellow-700" : "bg-teal-100 text-teal-700"}`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-gray-500">{u.department || "—"}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold ${u.is_active ? "text-green-600" : "text-gray-400"}`}>
                    ● {u.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <button onClick={() => handleDelete(u.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
