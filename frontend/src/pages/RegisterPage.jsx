import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PublicHeader from "../components/PublicHeader";
import { register } from "../services/auth";
import { extractTokenFromAuthPayload, saveAuth } from "../utils/auth";
import { getErrorMessage } from "../utils/errorMessage";

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", role: "FARMER" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await register(form);
      saveAuth(data);
      if (!extractTokenFromAuthPayload(data)) {
        toast.error("No token in registration response. Check API configuration.");
        return;
      }
      toast.success("Account created!");
      navigate("/home");
    } catch (err) {
      const msg = getErrorMessage(err, "Registration failed");
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PublicHeader />
      <main className="max-w-md mx-auto px-4 py-10">
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Register</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="email"
              type="email"
              placeholder="Enter email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              required
              autoComplete="email"
            />
            <input
              name="password"
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
            >
              <option value="FARMER">Farmer</option>
              <option value="ADMIN">Admin</option>
            </select>
            {error ? <p className="text-red-600 text-sm">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 text-white rounded-lg py-2 font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? "Registering..." : "Register"}
            </button>
          </form>
          <p className="text-sm text-slate-600 mt-4 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-700 font-medium hover:underline">
              Login
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

export default RegisterPage;
