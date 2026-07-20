import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import PublicHeader from "../components/PublicHeader";
import { login } from "../services/auth";
import { extractTokenFromAuthPayload, saveAuth } from "../utils/auth";
import { getErrorMessage } from "../utils/errorMessage";
import authBg from "../assets/auth-bg.jpg.png";

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      validateEmail(value);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("");
    } else if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };


  const isFormValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(form.email);
    const isPasswordValid = form.password.length > 0;
    return isEmailValid && isPasswordValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await login(form);
      saveAuth(data);
      if (!extractTokenFromAuthPayload(data)) {
        toast.error("No token in login response. Check API configuration.");
        return;
      }
      toast.success("Welcome back!");
      navigate("/home");
    } catch (err) {
      const msg = getErrorMessage(err, "Login failed");
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PublicHeader />
      <main
        className="min-h-screen flex items-center justify-center px-4 py-10 relative"
        style={{
          backgroundImage: `url(${authBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-md animate-fade-in">
          <div className="bg-white/85 backdrop-blur-xl shadow-2xl rounded-[20px] p-10 border border-white/30 transition-all duration-300 hover:shadow-3xl">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Login</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  name="email"
                  type="email"
                  placeholder=" Enter email"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full border rounded-xl px-4 py-3 transition-all duration-300 focus:outline-none focus:ring-2 ${emailError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"}`}
                  required
                  autoComplete="email"
                />
                {emailError && <p className="text-red-600 text-sm mt-1">{emailError}</p>}
              </div>
              <div>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder=" Enter password "
                    value={form.password}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 pr-12 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              {error ? <p className="text-red-600 text-sm">{error}</p> : null}
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-emerald-700 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={submitting || !isFormValid()}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl py-3 font-semibold hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                {submitting ? "Signing in..." : "Login"}
              </button>
            </form>
            <p className="text-sm text-slate-600 mt-4 text-center">
              New Dairy Owner?{" "}
              <Link to="/register" className="text-emerald-700 font-medium hover:underline">
                Register your dairy
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

export default LoginPage;
