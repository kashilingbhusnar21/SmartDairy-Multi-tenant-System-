import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PublicHeader from "../components/PublicHeader";
import { forgotPassword } from "../services/auth";
import { getErrorMessage } from "../utils/errorMessage";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await forgotPassword(email.trim());
      setDone(true);
      setResetToken(data.resetToken || "");
      toast.success(data.message || "Check your email for next steps.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Request failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PublicHeader />
      <main className="max-w-md mx-auto px-4 py-10">
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Forgot password</h2>
          <p className="text-sm text-slate-600 mb-4">
            Enter the email you registered with. If an account exists, a reset token is issued (shown below in
            development when the API is configured to return it).
          </p>
          {!done ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                required
                autoComplete="email"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 text-white rounded-lg py-2 font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send reset token"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-700">
                If this email is registered, you can continue to reset your password.
              </p>
              {resetToken ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                  <p className="font-medium text-amber-900 mb-1">Your reset token (dev only)</p>
                  <code className="break-all text-amber-950">{resetToken}</code>
                  <Link
                    to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                    className="mt-3 block text-emerald-700 font-medium hover:underline"
                  >
                    Continue to reset password →
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No token was returned (production mode). Use the link sent to your email.
                </p>
              )}
              <Link to="/login" className="text-sm text-emerald-700 hover:underline">
                ← Back to login
              </Link>
            </div>
          )}
          {!done ? (
            <p className="text-sm text-slate-600 mt-4 text-center">
              <Link to="/login" className="text-emerald-700 font-medium hover:underline">
                Back to login
              </Link>
            </p>
          ) : null}
        </div>
      </main>
    </>
  );
}

export default ForgotPasswordPage;
