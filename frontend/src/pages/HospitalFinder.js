import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Heart, MapPin, Search, Phone, Ambulance, Star, ArrowLeft, Navigation, Filter, X } from "lucide-react";

const HospitalFinder = () => {
  const { token } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("Detecting location...");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showAmbulanceOnly, setShowAmbulanceOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchNearby = useCallback(async (lat, lng) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/hospitals/nearby?lat=${lat}&lng=${lng}&radius=200`, { headers });
      setHospitals(res.data);
      setFiltered(res.data);
    } catch (e) {
      const res = await axios.get(`${API}/hospitals`, { headers });
      setHospitals(res.data);
      setFiltered(res.data);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation({ lat: latitude, lng: longitude });
          setLocationName(`Your Location (${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E)`);
          fetchNearby(latitude, longitude);
        },
        () => {
          setLocation({ lat: 9.1742, lng: 77.8697 });
          setLocationName("Kovilpatti, Tamil Nadu (Default)");
          fetchNearby(9.1742, 77.8697);
        }
      );
    }
  }, [fetchNearby]);

  useEffect(() => {
    let result = hospitals;
    if (search) {
      result = result.filter(h =>
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.city.toLowerCase().includes(search.toLowerCase()) ||
        h.specialties?.some(s => s.toLowerCase().includes(search.toLowerCase()))
      );
    }
    if (filterType !== "all") {
      result = result.filter(h => h.type === filterType);
    }
    if (showAmbulanceOnly) {
      result = result.filter(h => h.ambulance);
    }
    setFiltered(result);
  }, [search, filterType, showAmbulanceOnly, hospitals]);

  return (
    <div className="min-h-screen bg-[#F9FAFB]" data-testid="hospital-finder-page">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            <Link to="/dashboard" className="text-gray-400 hover:text-gray-700 transition-colors" data-testid="back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-bold font-['Outfit'] text-gray-900">Find Hospitals</h1>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Navigation className="w-3 h-3 text-[#00C853]" />
                <span data-testid="location-display">{locationName}</span>
              </div>
            </div>
            <Link to="/emergency" className="rounded-full bg-[#FFAB00] hover:bg-[#FF6D00] text-black font-bold px-4 py-2 text-sm emergency-pulse transition-colors flex items-center gap-1.5" data-testid="sos-btn">
              <Phone className="w-4 h-4" /> SOS
            </Link>
          </div>

          {/* Search & Filters */}
          <div className="pb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search hospitals, cities, or specialties..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 outline-none transition-colors"
                data-testid="hospital-search-input"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {["all", "Government", "Private"].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    filterType === type ? "bg-[#00C853] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[#00C853]"
                  }`}
                  data-testid={`filter-${type}`}
                >
                  {type === "all" ? "All Hospitals" : type}
                </button>
              ))}
              <button
                onClick={() => setShowAmbulanceOnly(!showAmbulanceOnly)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  showAmbulanceOnly ? "bg-[#FFAB00] text-black" : "bg-white border border-gray-200 text-gray-600 hover:border-[#FFAB00]"
                }`}
                data-testid="filter-ambulance"
              >
                <Ambulance className="w-4 h-4" /> Ambulance
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500" data-testid="hospital-count">
            {filtered.length} hospitals found {search && `for "${search}"`}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((h, i) => (
              <div
                key={h.id || i}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                data-testid={`hospital-result-${i}`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-emerald-50 flex items-center justify-center">
                      <img src={h.image || "https://images.unsplash.com/photo-1697120508416-89675565948d?w=100"} alt={h.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-gray-900 font-['Outfit']">{h.name}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {h.city}, {h.state}
                          </p>
                        </div>
                        {h.distance_km !== undefined && (
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-bold text-[#00C853]">{h.distance_km} km</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">away</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${h.type === "Government" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                          {h.type}
                        </span>
                        {h.emergency && <span className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-medium">24/7 Emergency</span>}
                        {h.ambulance && <span className="text-xs bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><Ambulance className="w-3 h-3" /> Ambulance</span>}
                        {h.beds && <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">{h.beds} beds</span>}
                      </div>

                      {/* Specialties */}
                      {h.specialties && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {h.specialties.slice(0, 4).map((s, j) => (
                            <span key={j} className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50">
                    <a href={`tel:${h.phone}`} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#00C853] hover:bg-[#009624] text-white font-semibold py-2.5 transition-colors" data-testid={`call-hospital-${i}`}>
                      <Phone className="w-4 h-4" /> Call Now
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-[#2962FF] text-[#2962FF] hover:bg-[#2962FF] hover:text-white font-semibold py-2.5 transition-colors"
                      data-testid={`directions-hospital-${i}`}
                    >
                      <Navigation className="w-4 h-4" /> Directions
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No hospitals found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search or filter</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default HospitalFinder;
