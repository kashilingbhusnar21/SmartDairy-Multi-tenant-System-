import { Link } from "react-router-dom";
import PublicHeader from "../components/PublicHeader";

function LandingPage() {
  return (
    <>
      <PublicHeader />
      <main className="max-w-6xl mx-auto px-4 py-12">
      <section className="bg-gradient-to-r from-emerald-700 to-emerald-500 rounded-2xl p-10 text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Smart Dairy</h1>
        <p className="text-emerald-50 text-lg max-w-2xl mb-8">
          A modern dairy management system for tracking milk collections, feed purchases, payments, and farmer accounts.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/login"
            className="inline-flex px-6 py-3 rounded-lg bg-white text-emerald-700 font-semibold hover:bg-emerald-50 text-center"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="inline-flex px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-800 border-2 border-white text-center"
          >
            New Dairy? Register Your Dairy
          </Link>
        </div>
      </section>
    </main>
    </>
  );
}

export default LandingPage;
