import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Phone, MapPin, ArrowLeft, Heart, AlertTriangle, Ambulance, Navigation, Clock } from "lucide-react";

const EmergencyPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [requesting, setRequesting] = useState(false);
  const [ambulanceReq, setAmbulanceReq] = useState(null);
  const [form, setForm] = useState({ patient_name: user?.name || "", phone: "", emergency_type: "general", notes: "" });

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const requestAmbulance = async () => {
    if (!token) { navigate("/login"); return; }
    setRequesting(true);
    
    const getPos = () => new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve({ lat: 9.1742, lng: 77.8697 })
        );
      } else {
        resolve({ lat: 9.1742, lng: 77.8697 });
      }
    });

    const pos = await getPos();
    try {
      const res = await axios.post(`${API}/ambulance/request`, {
        ...form,
        lat: pos.lat,
        lng: pos.lng,
        patient_name: form.patient_name || user?.name || "Patient"
      }, { headers });
      setAmbulanceReq(res.data);
    } catch (e) {
      console.error(e);
    }
    setRequesting(false);
  };

  return (
    <div className="min-h-screen bg-[#FFF8E1]" data-testid="emergency-page">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 flex items-center gap-3 h-14">
          <Link to={user ? "/dashboard" : "/"} className="text-gray-400 hover:text-gray-700 transition-colors" data-testid="emergency-back-btn">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FFAB00] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-black" />
            </div>
            <h1 className="text-lg font-bold font-['Outfit'] text-gray-900">Emergency Services</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Emergency Numbers */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6" data-testid="emergency-numbers">
          <h2 className="text-lg font-bold font-['Outfit'] text-gray-900 mb-4">Emergency Numbers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { name: "Ambulance", number: "108", color: "bg-red-500" },
              { name: "Emergency", number: "112", color: "bg-amber-500" },
              { name: "Health Helpline", number: "104", color: "bg-blue-500" },
            ].map((item, i) => (
              <a
                key={i}
                href={`tel:${item.number}`}
                className={`${item.color} text-white rounded-2xl p-4 flex items-center gap-3 hover:opacity-90 transition-opacity active:scale-95`}
                data-testid={`emergency-call-${i}`}
              >
                <Phone className="w-6 h-6" />
                <div>
                  <p className="font-bold text-lg">{item.number}</p>
                  <p className="text-sm opacity-90">{item.name}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Ambulance Request */}
        {ambulanceReq ? (
          <div className="bg-white rounded-3xl shadow-sm border-2 border-[#00C853] p-6" data-testid="ambulance-confirmed">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Ambulance className="w-8 h-8 text-[#00C853]" />
              </div>
              <h2 className="text-2xl font-bold font-['Outfit'] text-gray-900 mb-2">Ambulance Dispatched!</h2>
              <p className="text-gray-500 mb-6">Help is on the way</p>
              
              <div className="bg-emerald-50 rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-center gap-2 text-[#00C853]">
                  <Clock className="w-5 h-5" />
                  <span className="text-2xl font-bold font-['Outfit']">ETA: {ambulanceReq.eta_minutes} minutes</span>
                </div>
              </div>

              <div className="text-left space-y-2 text-sm">
                <p><span className="font-medium text-gray-500">Status:</span> <span className="text-[#00C853] font-bold uppercase">{ambulanceReq.status}</span></p>
                <p><span className="font-medium text-gray-500">Request ID:</span> {ambulanceReq.id?.slice(0, 8)}</p>
                <p><span className="font-medium text-gray-500">Type:</span> {ambulanceReq.emergency_type}</p>
              </div>

              <button
                onClick={() => setAmbulanceReq(null)}
                className="mt-6 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-3 px-6 transition-colors"
                data-testid="request-another-btn"
              >
                Request Another
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6" data-testid="ambulance-request-form">
            <h2 className="text-xl font-bold font-['Outfit'] text-gray-900 mb-2">Request Ambulance</h2>
            <p className="text-sm text-gray-500 mb-6">We'll share your GPS location with the nearest ambulance</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Patient Name</label>
                <input
                  type="text"
                  value={form.patient_name}
                  onChange={e => setForm(prev => ({ ...prev, patient_name: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 focus:border-[#FFAB00] focus:ring-2 focus:ring-[#FFAB00]/20 py-3 px-4 bg-gray-50 focus:bg-white outline-none"
                  placeholder="Patient name"
                  data-testid="ambulance-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 focus:border-[#FFAB00] focus:ring-2 focus:ring-[#FFAB00]/20 py-3 px-4 bg-gray-50 focus:bg-white outline-none"
                  placeholder="+91 98765 43210"
                  data-testid="ambulance-phone-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Emergency Type</label>
                <select
                  value={form.emergency_type}
                  onChange={e => setForm(prev => ({ ...prev, emergency_type: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 focus:border-[#FFAB00] focus:ring-2 focus:ring-[#FFAB00]/20 py-3 px-4 bg-gray-50 focus:bg-white outline-none"
                  data-testid="emergency-type-select"
                >
                  <option value="general">General Emergency</option>
                  <option value="cardiac">Cardiac / Heart</option>
                  <option value="accident">Accident / Trauma</option>
                  <option value="breathing">Breathing Difficulty</option>
                  <option value="pregnancy">Pregnancy Related</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 focus:border-[#FFAB00] focus:ring-2 focus:ring-[#FFAB00]/20 py-3 px-4 bg-gray-50 focus:bg-white outline-none resize-none"
                  rows={3}
                  placeholder="Any additional information..."
                  data-testid="ambulance-notes-input"
                />
              </div>

              <button
                onClick={requestAmbulance}
                disabled={requesting}
                className="w-full emergency-gradient text-black font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                data-testid="request-ambulance-btn"
              >
                {requesting ? (
                  <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Ambulance className="w-6 h-6" />
                    Request Ambulance Now
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-400">
                Your current GPS location will be shared with the ambulance service
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EmergencyPage;
