import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { Heart, Eye, EyeOff, ArrowLeft, User, Stethoscope } from "lucide-react";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "patient" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await register(form);
      navigate(data.user.role === "doctor" ? "/doctor-portal" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    }
    setLoading(false);
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4" data-testid="register-page">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors" data-testid="back-to-home">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#00C853] flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-['Outfit'] text-gray-900">Join CareLens AI</h1>
              <p className="text-gray-500 text-sm">Create your account</p>
            </div>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => update("role", "patient")}
              className={`flex items-center gap-2 justify-center rounded-xl py-3 border-2 font-semibold transition-all ${
                form.role === "patient" ? "border-[#00C853] bg-emerald-50 text-[#00C853]" : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
              data-testid="role-patient-btn"
            >
              <User className="w-5 h-5" /> Patient
            </button>
            <button
              type="button"
              onClick={() => update("role", "doctor")}
              className={`flex items-center gap-2 justify-center rounded-xl py-3 border-2 font-semibold transition-all ${
                form.role === "doctor" ? "border-[#2962FF] bg-blue-50 text-[#2962FF]" : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
              data-testid="role-doctor-btn"
            >
              <Stethoscope className="w-5 h-5" /> Doctor
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm" data-testid="register-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text" value={form.name} onChange={e => update("name", e.target.value)}
                className="w-full rounded-xl border border-gray-300 focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 py-3 px-4 bg-gray-50 focus:bg-white transition-colors outline-none"
                placeholder={form.role === "doctor" ? "Dr. Full Name" : "Your full name"}
                required data-testid="register-name-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email" value={form.email} onChange={e => update("email", e.target.value)}
                className="w-full rounded-xl border border-gray-300 focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 py-3 px-4 bg-gray-50 focus:bg-white transition-colors outline-none"
                placeholder="you@example.com"
                required data-testid="register-email-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input
                type="tel" value={form.phone} onChange={e => update("phone", e.target.value)}
                className="w-full rounded-xl border border-gray-300 focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 py-3 px-4 bg-gray-50 focus:bg-white transition-colors outline-none"
                placeholder="+91 98765 43210"
                data-testid="register-phone-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)}
                  className="w-full rounded-xl border border-gray-300 focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 py-3 px-4 pr-12 bg-gray-50 focus:bg-white transition-colors outline-none"
                  placeholder="Min 6 characters" minLength={6}
                  required data-testid="register-password-input"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className={`w-full rounded-xl ${form.role === "doctor" ? "bg-[#2962FF] hover:bg-[#0039CB]" : "bg-[#00C853] hover:bg-[#009624]"} text-white font-bold py-3.5 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50`}
              data-testid="register-submit-btn"
            >
              {loading ? "Creating account..." : `Sign up as ${form.role === "doctor" ? "Doctor" : "Patient"}`}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-[#00C853] font-semibold hover:underline" data-testid="goto-login-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
