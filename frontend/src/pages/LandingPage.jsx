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
          A modern full-stack starter for dairy operations management with Java Spring Boot,
          MySQL, JWT authentication, React, and Tailwind CSS.
        </p>
        <Link
          to="/login"
          className="inline-flex px-6 py-3 rounded-lg bg-white text-emerald-700 font-semibold hover:bg-emerald-50"
        >
          Login to Continue
        </Link>
      </section>
    </main>
    </>
  );
}

export default LandingPage;
