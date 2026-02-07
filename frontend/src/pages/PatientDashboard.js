import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Heart, MapPin, MessageCircle, Activity, Stethoscope, LogOut, Ambulance, Phone, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

const PatientDashboard = () => {
  const { user, token, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("Detecting...");

  const headers = { Authorization: `Bearer ${token}` };

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/dashboard/stats`, { headers });
      setStats(res.data);
    } catch (e) { console.error(e); }
  }, [token]);

  const fetchNearby = useCallback(async (lat, lng) => {
    try {
      const res = await axios.get(`${API}/hospitals/nearby?lat=${lat}&lng=${lng}&radius=50`, { headers });
      setNearbyHospitals(res.data.slice(0, 5));
    } catch (e) { console.error(e); }
  }, [token]);

  useEffect(() => {
    fetchStats();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation({ lat: latitude, lng: longitude });
          setLocationName(`${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`);
          fetchNearby(latitude, longitude);
        },
        () => {
          // Default to Kovilpatti
          setLocation({ lat: 9.1742, lng: 77.8697 });
          setLocationName("Kovilpatti, Tamil Nadu");
          fetchNearby(9.1742, 77.8697);
        }
      );
    }
  }, [fetchStats, fetchNearby]);

  const getBPColor = (status) => {
    const colors = { low: "text-blue-600 bg-blue-50", normal: "text-emerald-600 bg-emerald-50", elevated: "text-amber-600 bg-amber-50", high: "text-red-600 bg-red-50" };
    return colors[status] || "text-gray-600 bg-gray-50";
  };

  const getBPIcon = (status) => {
    if (status === "high") return <TrendingUp className="w-4 h-4" />;
    if (status === "low") return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]" data-testid="patient-dashboard">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#00C853] flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="text-lg font-bold font-['Outfit'] text-gray-900">CareLens <span className="text-[#00C853]">AI</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/emergency" className="flex items-center gap-1.5 rounded-full bg-[#FFAB00] hover:bg-[#FF6D00] text-black font-bold px-4 py-2 text-sm emergency-pulse transition-colors" data-testid="emergency-btn">
              <Phone className="w-4 h-4" /> SOS
            </Link>
            <button onClick={logout} className="flex items-center gap-1.5 rounded-full border border-gray-200 hover:bg-gray-50 px-4 py-2 text-sm text-gray-600 transition-colors" data-testid="logout-btn">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold font-['Outfit'] text-gray-900" data-testid="greeting">
            Hello, {user?.name || "Patient"} <span className="text-[#00C853]">!</span>
          </h1>
          <div className="flex items-center gap-2 mt-1 text-gray-500">
            <MapPin className="w-4 h-4 text-[#00C853]" />
            <span className="text-sm" data-testid="user-location">{locationName}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { to: "/hospitals", icon: MapPin, label: "Find Hospital", color: "bg-emerald-500", hoverColor: "hover:bg-emerald-600" },
            { to: "/chat", icon: MessageCircle, label: "AI Doctor", color: "bg-[#2962FF]", hoverColor: "hover:bg-blue-700" },
            { to: "/bp-monitor", icon: Activity, label: "BP Monitor", color: "bg-red-500", hoverColor: "hover:bg-red-600" },
            { to: "/emergency", icon: Ambulance, label: "Ambulance", color: "bg-[#FFAB00]", hoverColor: "hover:bg-amber-600" },
          ].map((action, i) => (
            <Link
              key={i}
              to={action.to}
              className={`${action.color} ${action.hoverColor} text-white rounded-2xl p-5 flex flex-col items-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
              data-testid={`quick-action-${i}`}
            >
              <action.icon className="w-8 h-8" />
              <span className="font-semibold text-sm">{action.label}</span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold font-['Outfit'] text-gray-900">Your Health Summary</h2>
            
            {/* Latest BP */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm" data-testid="latest-bp-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">Latest Blood Pressure</span>
                <Activity className="w-4 h-4 text-red-500" />
              </div>
              {stats?.latest_bp ? (
                <div>
                  <div className="text-3xl font-bold font-['Outfit'] text-gray-900">
                    {stats.latest_bp.systolic}/{stats.latest_bp.diastolic}
                  </div>
                  <div className={`inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${getBPColor(stats.latest_bp.status)}`}>
                    {getBPIcon(stats.latest_bp.status)}
                    {stats.latest_bp.status?.toUpperCase()}
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">No readings yet. <Link to="/bp-monitor" className="text-[#00C853] font-semibold">Add one</Link></div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm" data-testid="stats-card">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold font-['Outfit'] text-[#00C853]">{stats?.bp_readings || 0}</p>
                  <p className="text-xs text-gray-500">BP Readings</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-['Outfit'] text-[#2962FF]">{stats?.ai_consultations || 0}</p>
                  <p className="text-xs text-gray-500">AI Chats</p>
                </div>
              </div>
            </div>
          </div>

          {/* Nearby Hospitals */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold font-['Outfit'] text-gray-900">Hospitals Near You</h2>
              <Link to="/hospitals" className="text-[#00C853] font-semibold text-sm flex items-center gap-1 hover:underline" data-testid="view-all-hospitals">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {nearbyHospitals.length > 0 ? nearbyHospitals.map((h, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer" data-testid={`hospital-card-${i}`}>
                  <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-7 h-7 text-[#00C853]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{h.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{h.city}, {h.state}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {h.emergency && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">Emergency</span>}
                      {h.ambulance && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">Ambulance</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-[#00C853]">{h.distance_km} km</p>
                    <p className="text-xs text-gray-400">{h.type}</p>
                  </div>
                </div>
              )) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>Allow location access to see nearby hospitals</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 flex justify-around py-3 pb-6 md:hidden" data-testid="mobile-bottom-nav">
        {[
          { to: "/dashboard", icon: Heart, label: "Home" },
          { to: "/hospitals", icon: MapPin, label: "Hospitals" },
          { to: "/chat", icon: MessageCircle, label: "AI Chat" },
          { to: "/bp-monitor", icon: Activity, label: "BP" },
        ].map((item, i) => (
          <Link key={i} to={item.to} className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#00C853] transition-colors" data-testid={`bottom-nav-${i}`}>
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PatientDashboard;
