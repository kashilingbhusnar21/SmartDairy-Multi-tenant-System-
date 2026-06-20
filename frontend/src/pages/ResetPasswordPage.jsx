import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import PublicHeader from "../components/PublicHeader";
import { resetPassword, verifyResetToken } from "../services/auth";
import { getErrorMessage } from "../utils/errorMessage";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(() => searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tokenStatus, setTokenStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const checkToken = async () => {
    if (!token.trim()) {
      toast.error("Enter reset token");
      return;
    }
    setChecking(true);
    try {
      const res = await verifyResetToken(token.trim());
      setTokenStatus(res);
      if (res.valid) {
        toast.success("Token is valid.");
      } else {
        toast.error("Invalid or expired token.");
      }
    } catch (err) {
      setTokenStatus({ valid: false });
      toast.error(getErrorMessage(err, "Verification failed"));
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token.trim(), password);
      toast.success("Password updated. You can sign in now.");
      navigate("/login");
    } catch (err) {
      toast.error(getErrorMessage(err, "Reset failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PublicHeader />
      <main className="max-w-md mx-auto px-4 py-10">
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Reset password</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reset token</label>
              <input
                type="text"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setTokenStatus(null);
                }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-sm"
                required
                autoComplete="one-time-code"
              />
              <button
                type="button"
                onClick={checkToken}
                disabled={checking}
                className="mt-2 text-sm text-emerald-700 font-medium hover:underline disabled:opacity-50"
              >
                {checking ? "Checking…" : "Verify token"}
              </button>
              {tokenStatus?.valid ? (
                <p className="text-xs text-emerald-700 mt-1">Valid for {tokenStatus.email}</p>
              ) : null}
              {tokenStatus && !tokenStatus.valid ? (
                <p className="text-xs text-red-600 mt-1">Token invalid or expired.</p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 text-white rounded-lg py-2 font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? "Updating…" : "Update password"}
            </button>
          </form>
          <p className="text-sm text-slate-600 mt-4 text-center">
            <Link to="/login" className="text-emerald-700 font-medium hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}

export default ResetPasswordPage;
