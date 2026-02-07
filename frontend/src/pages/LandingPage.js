import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/App";
import { Heart, MapPin, MessageCircle, Shield, Phone, Users, Stethoscope, Globe, ChevronRight, Activity, Ambulance, Star } from "lucide-react";

const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिंदी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese", native: "অসমীয়া" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्" },
  { code: "sd", name: "Sindhi", native: "سنڌي" },
];

const FEATURES = [
  { icon: MapPin, title: "Find Nearby Hospitals", desc: "GPS-powered hospital finder shows all hospitals near you, just like Rapido & Ola", color: "bg-emerald-50 text-emerald-600", border: "border-emerald-200" },
  { icon: MessageCircle, title: "AI Health Assistant", desc: "Interactive AI doctor that speaks your language and explains health in simple terms", color: "bg-blue-50 text-blue-600", border: "border-blue-200" },
  { icon: Activity, title: "BP Monitoring", desc: "Track your blood pressure daily and get instant analysis of your readings", color: "bg-red-50 text-red-600", border: "border-red-200" },
  { icon: Stethoscope, title: "Doctor Portal", desc: "Verified doctors can create profiles and connect with patients in their area", color: "bg-purple-50 text-purple-600", border: "border-purple-200" },
  { icon: Ambulance, title: "Emergency Ambulance", desc: "One-tap ambulance service with live location sharing for emergencies", color: "bg-amber-50 text-amber-600", border: "border-amber-200" },
  { icon: Shield, title: "Explainable AI", desc: "Every recommendation comes with clear reasoning you can understand and trust", color: "bg-teal-50 text-teal-600", border: "border-teal-200" },
];

const LandingPage = () => {
  const { user } = useAuth();
  const [hoveredFeature, setHoveredFeature] = useState(null);

  return (
    <div className="min-h-screen bg-[#F9FAFB]" data-testid="landing-page">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 w-full backdrop-blur-lg bg-white/80 border-b border-gray-100" data-testid="landing-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#00C853] flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-xl font-bold font-['Outfit'] text-gray-900">CareLens <span className="text-[#00C853]">AI</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/emergency" className="hidden sm:flex items-center gap-2 rounded-full bg-[#FFAB00] hover:bg-[#FF6D00] text-black font-bold px-5 py-2.5 shadow-lg emergency-pulse transition-colors" data-testid="emergency-nav-btn">
              <Phone className="w-4 h-4" />
              Emergency
            </Link>
            {user ? (
              <Link to="/dashboard" className="rounded-full bg-[#00C853] hover:bg-[#009624] text-white font-semibold px-6 py-2.5 transition-colors" data-testid="dashboard-nav-btn">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded-full border-2 border-[#00C853] text-[#00C853] hover:bg-[#00C853] hover:text-white px-6 py-2 font-semibold transition-colors" data-testid="signin-nav-btn">
                  Sign In
                </Link>
                <Link to="/register" className="rounded-full bg-[#00C853] hover:bg-[#009624] text-white font-semibold px-6 py-2.5 transition-colors" data-testid="register-nav-btn">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient pt-16 pb-24 md:pt-24 md:pb-32" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-emerald-200 px-4 py-1.5 text-sm font-medium text-emerald-700 mb-6">
                <Heart className="w-4 h-4" fill="#00C853" />
                AI for Social Good — Healthcare Track
              </div>
              <h1 className="text-4xl md:text-6xl font-bold font-['Outfit'] text-gray-900 tracking-tight leading-tight mb-6">
                Healthcare that <br/>
                <span className="gradient-text">explains itself</span> in <br/>
                your mother tongue
              </h1>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8 max-w-lg">
                CareLens AI brings expert health guidance to rural India through voice-first, multilingual AI assistance. Find hospitals near you instantly.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="rounded-full bg-[#00C853] hover:bg-[#009624] text-white font-bold px-8 py-4 shadow-lg hover:shadow-xl transition-all active:scale-95 text-lg" data-testid="hero-get-started-btn">
                  Get Started Free
                  <ChevronRight className="inline w-5 h-5 ml-1" />
                </Link>
                <Link to="/hospitals" className="rounded-full border-2 border-gray-300 text-gray-700 hover:border-[#2962FF] hover:text-[#2962FF] font-semibold px-8 py-4 transition-colors text-lg" data-testid="hero-find-hospitals-btn">
                  <MapPin className="inline w-5 h-5 mr-2" />
                  Find Hospitals
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-10">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-white ${['bg-emerald-400','bg-blue-400','bg-amber-400','bg-purple-400'][i-1]} flex items-center justify-center text-white text-xs font-bold`}>
                      {['AK','RS','PM','VL'][i-1]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-amber-400" fill="#FBBF24" />)}
                  </div>
                  <p className="text-sm text-gray-500">Trusted by 10,000+ patients</p>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -top-8 -right-8 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl" />
              <div className="absolute -bottom-8 -left-8 w-60 h-60 bg-blue-200/40 rounded-full blur-3xl" />
              <img
                src="https://images.unsplash.com/photo-1723005315946-4ba11c55de39?w=600&q=80"
                alt="Healthcare in India"
                className="relative rounded-3xl shadow-2xl w-full object-cover h-[480px]"
                data-testid="hero-image"
              />
              {/* Floating cards */}
              <div className="absolute -left-6 top-20 glass-card rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00C853] flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">4 Hospitals</p>
                    <p className="text-xs text-gray-500">Near Kovilpatti</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-4 bottom-24 glass-card rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2962FF] flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">AI Doctor</p>
                    <p className="text-xs text-gray-500">15 Languages</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 bg-white" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold font-['Outfit'] text-gray-900 mb-4">
              Why <span className="text-[#00C853]">CareLens AI</span>?
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Bridging the healthcare gap with AI, cultural sensitivity, and real-time location services
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl border ${f.border} p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
                data-testid={`feature-card-${i}`}
              >
                <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center mb-5`}>
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold font-['Outfit'] text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
                {hoveredFeature === i && (
                  <div className="mt-4 text-[#00C853] font-semibold text-sm flex items-center gap-1">
                    Learn more <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-[#F9FAFB] to-white" data-testid="languages-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 mb-4">
              <Globe className="w-4 h-4" />
              Multilingual Support
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-['Outfit'] text-gray-900 mb-4">
              15 Indian Languages Supported
            </h2>
            <p className="text-lg text-gray-500">Healthcare in your mother tongue</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {LANGUAGES.map((lang, i) => (
              <div
                key={lang.code}
                className="rounded-full bg-white border border-gray-200 hover:border-[#00C853] hover:shadow-md px-5 py-2.5 transition-all hover:-translate-y-0.5 cursor-pointer"
                data-testid={`language-${lang.code}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-gray-400 text-sm">{lang.native}</span>{" "}
                <span className="font-semibold text-gray-700">{lang.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 md:py-24 bg-white" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold font-['Outfit'] text-gray-900 text-center mb-14">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Share Your Location", desc: "Allow GPS access and we instantly find hospitals, doctors, and ambulances near you", color: "text-[#00C853]", bg: "bg-emerald-50" },
              { step: "02", title: "Talk to AI Doctor", desc: "Describe symptoms in your language. Our AI gives clear, pictorial health guidance", color: "text-[#2962FF]", bg: "bg-blue-50" },
              { step: "03", title: "Get Connected", desc: "Book appointments, call ambulance, or monitor your BP — all from one app", color: "text-[#FFAB00]", bg: "bg-amber-50" },
            ].map((s, i) => (
              <div key={i} className="text-center" data-testid={`step-${i}`}>
                <div className={`w-20 h-20 ${s.bg} rounded-3xl flex items-center justify-center mx-auto mb-6`}>
                  <span className={`text-3xl font-bold font-['Outfit'] ${s.color}`}>{s.step}</span>
                </div>
                <h3 className="text-xl font-bold font-['Outfit'] text-gray-900 mb-3">{s.title}</h3>
                <p className="text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#00C853] to-[#2962FF] rounded-3xl p-10 md:p-16 text-center text-white">
            <Users className="w-12 h-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl md:text-4xl font-bold font-['Outfit'] mb-4">
              Ready to improve rural healthcare?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-lg mx-auto">
              Join thousands of patients and doctors making healthcare accessible across India
            </p>
            <Link to="/register" className="inline-block rounded-full bg-white text-[#00C853] font-bold px-10 py-4 shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg" data-testid="cta-join-btn">
              Join CareLens AI Today
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#00C853]" fill="#00C853" />
            <span className="text-white font-bold font-['Outfit']">CareLens AI</span>
          </div>
          <p className="text-sm">AI for Social Good — Healthcare Track</p>
          <a href="https://app.emergent.sh" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-white transition-colors">
            Made with Emergent
          </a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
