import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Heart, ArrowLeft, Save, Stethoscope, MapPin, Phone, Globe, Clock, IndianRupee, Check, Edit2, Loader2 } from "lucide-react";

const SPECIALIZATIONS = [
  "General Medicine", "Cardiology", "Orthopedics", "Pediatrics", "Gynecology",
  "Dermatology", "ENT", "Ophthalmology", "Neurology", "Psychiatry",
  "Oncology", "Pulmonology", "Gastroenterology", "Urology", "Nephrology"
];

const ALL_LANGUAGES = [
  "English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil",
  "Gujarati", "Kannada", "Malayalam", "Punjabi", "Odia", "Assamese", "Urdu"
];

const DoctorPortal = () => {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    specialization: "General Medicine",
    qualification: "",
    experience_years: 1,
    hospital_name: "",
    address: "",
    city: "",
    state: "Tamil Nadu",
    lat: null,
    lng: null,
    phone: "",
    available: true,
    consultation_fee: 200,
    languages: ["English", "Tamil"]
  });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API}/doctors/profile`, { headers });
        setProfile(res.data);
        setForm(res.data);
      } catch (e) {
        setEditing(true);
      }
    };
    fetchProfile();
    
    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setForm(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
      });
    }
  }, [token]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleLanguage = (lang) => {
    setForm(prev => ({
      ...prev,
      languages: prev.languages?.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...(prev.languages || []), lang]
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post(`${API}/doctors/profile`, form, { headers });
      const res = await axios.get(`${API}/doctors/profile`, { headers });
      setProfile(res.data);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]" data-testid="doctor-portal">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-400 hover:text-gray-700 transition-colors" data-testid="doctor-back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold font-['Outfit'] text-gray-900">Doctor Portal</h1>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="rounded-full border border-gray-200 hover:bg-gray-50 px-4 py-2 text-sm text-gray-600 transition-colors" data-testid="doctor-logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {saved && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 flex items-center gap-2" data-testid="save-success">
            <Check className="w-5 h-5" /> Profile saved successfully!
          </div>
        )}

        {/* Profile View */}
        {profile && !editing ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden" data-testid="doctor-profile-view">
            <div className="bg-gradient-to-r from-[#2962FF] to-[#00C853] p-8 text-white">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold font-['Outfit']">
                  {profile.doctor_name?.charAt(0) || "D"}
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-['Outfit']">{profile.doctor_name}</h2>
                  <p className="opacity-90">{profile.specialization}</p>
                  <p className="text-sm opacity-75">{profile.qualification}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <Stethoscope className="w-5 h-5 text-[#2962FF]" />
                  <div>
                    <p className="text-xs text-gray-500">Experience</p>
                    <p className="font-semibold">{profile.experience_years} years</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <MapPin className="w-5 h-5 text-[#00C853]" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-semibold">{profile.city}, {profile.state}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <Phone className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-semibold">{profile.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <IndianRupee className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-xs text-gray-500">Consultation Fee</p>
                    <p className="font-semibold">Rs. {profile.consultation_fee}</p>
                  </div>
                </div>
              </div>
              {profile.hospital_name && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50">
                  <Heart className="w-5 h-5 text-[#2962FF]" />
                  <div>
                    <p className="text-xs text-gray-500">Hospital</p>
                    <p className="font-semibold">{profile.hospital_name}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <Globe className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-xs text-gray-500">Languages</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.languages?.map(l => (
                      <span key={l} className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full">{l}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="w-full rounded-xl bg-[#2962FF] hover:bg-[#0039CB] text-white font-bold py-3 mt-4 flex items-center justify-center gap-2 transition-colors"
                data-testid="edit-profile-btn"
              >
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
            </div>
          </div>
        ) : (
          /* Profile Form */
          <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8" data-testid="doctor-profile-form">
            <h2 className="text-xl font-bold font-['Outfit'] text-gray-900 mb-6">
              {profile ? "Edit Your Profile" : "Create Your Doctor Profile"}
            </h2>
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Specialization</label>
                  <select
                    value={form.specialization} onChange={e => update("specialization", e.target.value)}
                    className="w-full rounded-xl border border-gray-300 focus:border-[#2962FF] focus:ring-2 focus:ring-[#2962FF]/20 py-3 px-4 bg-gray-50 focus:bg-white outline-none"
                    data-testid="specialization-select"
                  >
                    {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Qualification</label>
                  <input
                    type="text" value={form.qualification} onChange={e => update("qualification", e.target.value)}
                    className="w-full rounded-xl border border-gray-300 focus:border-[#2962FF] focus:ring-2 focus:ring-[#2962FF]/20 py-3 px-4 bg-gray-50 focus:bg-white outline-none"
                    placeholder="MBBS, MD" required data-testid="qualification-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Experience (years)</label>
                  <input
                    type="number" value={form.experience_years} onChange={e => update("experience_years", parseInt(e.target.value))}
                    className="w-full rounded-xl border border-gray-300 focus:border-[#2962FF] focus:ring-2 focus:ring-[#2962FF]/20 py-3 px-4 bg-gray-50 focus:bg-white outline-none"
                    min="0" required data-testid="experience-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Consultation Fee (Rs.)</label>
                  <input
                    type="number" value={form.consultation_fee} onChange={e => update("consultation_fee", parseInt(e.target.value))}
                    className="w-full rounded-xl border border-gray-300 focus:border-[#2962FF] focus:ring-2 focus:ring-[#2962FF]/20 py-3 px-4 bg-gray-50 focus:bg-white outline-none"
                    min="0" data-testid="fee-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input
                    type="tel" value={form.phone} onChange={e => update("phone", e.target.value)}
                    className="w-full rounded-xl border border-gray-300 focus:border-[#2962FF] focus:ring-2 focus:ring-[#2962FF]/20 py-3 px-4 bg-gray-50 focus:bg-white outline-none"
                    placeholder="+91 98765 43210" required data-testid="doctor-phone-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hospital Name</label>
                <input
                  type="text" value={form.hospital_name} onChange={e => update("hospital_name", e.target.value)}
                  className="w-full rounded-xl border border-gray-300 focus:border-[#2962FF] focus:ring-2 focus:ring-[#2962FF]/20 py-3 px-4 bg-gray-50 focus:bg-white outline-none"
                  placeholder="Hospital / Clinic name" data-testid="hospital-name-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                  <input
                    type="text" value={form.city} onChange={e => update("city", e.target.value)}
                    className="w-full rounded-xl border border-gray-300 focus:border-[#2962FF] focus:ring-2 focus:ring-[#2962FF]/20 py-3 px-4 bg-gray-50 focus:bg-white outline-none"
                    placeholder="Kovilpatti" required data-testid="city-input"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                  <input
                    type="text" value={form.state} onChange={e => update("state", e.target.value)}
                    className="w-full rounded-xl border border-gray-300 focus:border-[#2962FF] focus:ring-2 focus:ring-[#2962FF]/20 py-3 px-4 bg-gray-50 focus:bg-white outline-none"
                    placeholder="Tamil Nadu" required data-testid="state-input"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                  <input
                    type="text" value={form.address} onChange={e => update("address", e.target.value)}
                    className="w-full rounded-xl border border-gray-300 focus:border-[#2962FF] focus:ring-2 focus:ring-[#2962FF]/20 py-3 px-4 bg-gray-50 focus:bg-white outline-none"
                    placeholder="Street address" required data-testid="address-input"
                  />
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Languages You Speak</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_LANGUAGES.map(lang => (
                    <button
                      key={lang} type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        form.languages?.includes(lang)
                          ? "bg-[#2962FF] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      data-testid={`lang-toggle-${lang}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => update("available", !form.available)}
                  className={`w-12 h-6 rounded-full transition-colors ${form.available ? "bg-[#00C853]" : "bg-gray-300"}`}
                  data-testid="available-toggle"
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.available ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
                <span className="text-sm font-medium text-gray-700">Available for consultations</span>
              </div>

              <button
                type="submit" disabled={saving}
                className="w-full rounded-xl bg-[#2962FF] hover:bg-[#0039CB] text-white font-bold py-3.5 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="save-profile-btn"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default DoctorPortal;
