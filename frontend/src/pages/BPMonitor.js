import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { ArrowLeft, Activity, Heart, TrendingUp, TrendingDown, Minus, Plus, Calendar, Clock } from "lucide-react";

const BPMonitor = () => {
  const { token } = useAuth();
  const [records, setRecords] = useState([]);
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchRecords = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/bp/records`, { headers });
      setRecords(res.data);
    } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const addRecord = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${API}/bp/record`, {
        systolic: parseInt(systolic),
        diastolic: parseInt(diastolic),
        pulse: pulse ? parseInt(pulse) : null,
        notes: notes || null
      }, { headers });
      setSystolic("");
      setDiastolic("");
      setPulse("");
      setNotes("");
      setShowForm(false);
      fetchRecords();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      low: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Low" },
      normal: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Normal" },
      elevated: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Elevated" },
      high: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "High" },
    };
    return colors[status] || colors.normal;
  };

  const getStatusIcon = (status) => {
    if (status === "high") return <TrendingUp className="w-4 h-4" />;
    if (status === "low") return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  // Simple BP chart using bars
  const maxSystolic = Math.max(...records.map(r => r.systolic), 180);

  return (
    <div className="min-h-screen bg-[#F9FAFB]" data-testid="bp-monitor-page">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-gray-400 hover:text-gray-700 transition-colors" data-testid="bp-back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold font-['Outfit'] text-gray-900">BP Monitor</h1>
              <p className="text-xs text-gray-500">Track your blood pressure</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-[#00C853] hover:bg-[#009624] text-white font-bold px-4 py-2 text-sm flex items-center gap-1.5 transition-colors active:scale-95"
            data-testid="add-bp-btn"
          >
            <Plus className="w-4 h-4" /> Add Reading
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Add BP Form */}
        {showForm && (
          <form onSubmit={addRecord} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm" data-testid="bp-form">
            <h3 className="font-bold font-['Outfit'] text-gray-900 mb-4">New BP Reading</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Systolic (top)</label>
                <input
                  type="number" value={systolic} onChange={e => setSystolic(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-400/20 py-3 px-4 text-center text-2xl font-bold bg-gray-50 focus:bg-white outline-none"
                  placeholder="120" min="60" max="250" required data-testid="systolic-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Diastolic (bottom)</label>
                <input
                  type="number" value={diastolic} onChange={e => setDiastolic(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 py-3 px-4 text-center text-2xl font-bold bg-gray-50 focus:bg-white outline-none"
                  placeholder="80" min="30" max="150" required data-testid="diastolic-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Pulse (optional)</label>
                <input
                  type="number" value={pulse} onChange={e => setPulse(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 py-3 px-4 bg-gray-50 focus:bg-white outline-none"
                  placeholder="72" data-testid="pulse-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                <input
                  type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 py-3 px-4 bg-gray-50 focus:bg-white outline-none"
                  placeholder="After meal..." data-testid="bp-notes-input"
                />
              </div>
            </div>
            <button
              type="submit" disabled={saving}
              className="w-full rounded-xl bg-[#00C853] hover:bg-[#009624] text-white font-bold py-3 transition-colors active:scale-[0.98] disabled:opacity-50"
              data-testid="save-bp-btn"
            >
              {saving ? "Saving..." : "Save Reading"}
            </button>
          </form>
        )}

        {/* BP Reference */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm" data-testid="bp-reference">
          <h3 className="font-bold font-['Outfit'] text-gray-900 mb-3">BP Reference Guide</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Normal", range: "< 120/80", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
              { label: "Elevated", range: "120-129/80", color: "bg-amber-50 border-amber-200 text-amber-700" },
              { label: "High (S1)", range: "130-139/80-89", color: "bg-orange-50 border-orange-200 text-orange-700" },
              { label: "High (S2)", range: "140+/90+", color: "bg-red-50 border-red-200 text-red-700" },
            ].map((ref, i) => (
              <div key={i} className={`${ref.color} border rounded-xl p-3 text-center`}>
                <p className="font-semibold text-xs">{ref.label}</p>
                <p className="text-[11px] mt-0.5 opacity-80">{ref.range}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Chart */}
        {records.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm" data-testid="bp-chart">
            <h3 className="font-bold font-['Outfit'] text-gray-900 mb-4">Recent Trend</h3>
            <div className="flex items-end gap-1.5 h-32">
              {records.slice(0, 14).reverse().map((r, i) => {
                const height = (r.systolic / maxSystolic) * 100;
                const colors = { low: "bg-blue-400", normal: "bg-emerald-400", elevated: "bg-amber-400", high: "bg-red-400" };
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${r.systolic}/${r.diastolic}`}>
                    <span className="text-[9px] text-gray-400">{r.systolic}</span>
                    <div className={`w-full rounded-t-md ${colors[r.status] || "bg-gray-300"}`} style={{ height: `${height}%` }} />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400">
              <span>Oldest</span>
              <span>Latest</span>
            </div>
          </div>
        )}

        {/* Records List */}
        <div>
          <h3 className="font-bold font-['Outfit'] text-gray-900 mb-3">History ({records.length})</h3>
          {records.length > 0 ? (
            <div className="space-y-3">
              {records.map((r, i) => {
                const status = getStatusColor(r.status);
                return (
                  <div key={r.id || i} className={`bg-white rounded-2xl border ${status.border} p-4 hover:shadow-md transition-shadow`} data-testid={`bp-record-${i}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${status.bg} flex items-center justify-center`}>
                          <Activity className={`w-6 h-6 ${status.text}`} />
                        </div>
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold font-['Outfit'] text-gray-900">{r.systolic}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-xl font-bold font-['Outfit'] text-gray-700">{r.diastolic}</span>
                            <span className="text-sm text-gray-400 ml-1">mmHg</span>
                          </div>
                          {r.pulse && <p className="text-xs text-gray-500">Pulse: {r.pulse} bpm</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                          {getStatusIcon(r.status)} {status.label}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(r.recorded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {r.notes && <p className="text-xs text-gray-500 mt-2 pl-16">{r.notes}</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No readings yet</p>
              <p className="text-sm text-gray-400 mt-1">Add your first BP reading to start tracking</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 rounded-full bg-[#00C853] text-white font-semibold px-6 py-2 text-sm hover:bg-[#009624] transition-colors"
                data-testid="empty-add-bp-btn"
              >
                Add First Reading
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BPMonitor;
