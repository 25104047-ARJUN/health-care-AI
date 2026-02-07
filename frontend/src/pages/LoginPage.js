import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { Heart, Eye, EyeOff, ArrowLeft } from "lucide-react";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      navigate(data.user.role === "doctor" ? "/doctor-portal" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4" data-testid="login-page">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors" data-testid="back-to-home">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-[#00C853] flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-['Outfit'] text-gray-900">Welcome back</h1>
              <p className="text-gray-500 text-sm">Sign in to CareLens AI</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm" data-testid="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 py-3 px-4 bg-gray-50 focus:bg-white transition-colors outline-none"
                placeholder="you@example.com"
                required
                data-testid="login-email-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 py-3 px-4 pr-12 bg-gray-50 focus:bg-white transition-colors outline-none"
                  placeholder="Your password"
                  required
                  data-testid="login-password-input"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#00C853] hover:bg-[#009624] text-white font-bold py-3.5 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
              data-testid="login-submit-btn"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6 text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#00C853] font-semibold hover:underline" data-testid="goto-register-link">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
