import React from "react";
import { Link } from "react-router-dom";
import PublicHeader from "../components/PublicHeader";
import {
  Radio,
  Zap,
  ShieldCheck,
  Cpu,
  BarChart3,
  CreditCard,
  Bot,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Server,
  Layers,
  Database,
  Lock,
  Activity,
  Milk,
  Smartphone,
  ChevronRight
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <PublicHeader />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Glow Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-emerald-600/20 via-teal-500/15 to-cyan-500/20 blur-[130px] -z-10 pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-cyan-600/10 blur-[120px] -z-10 pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          
          {/* Top Pill Announcement */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold mb-6 shadow-lg shadow-emerald-950/40 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>RESEARCH COMPETITION WINNER &bull; 5,000 CONCURRENT CAPACITY</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.1] max-w-4xl mx-auto">
            Autonomous <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">4G IoT Telemetry</span> & Multi-Tenant Dairy ERP
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Eliminate operator fraud, manual registers, and delayed payouts. Direct microcontroller-to-cloud telemetry, Redis-cached dynamic FAT/SNF rate matrices, and instant 10-day settlement passbooks for rural dairy societies.
          </p>

          {/* Dual Action Buttons */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 group"
            >
              <span>Launch Dairy Console</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Register New Dairy Center</span>
            </Link>
          </div>

          {/* Live Metric Badges */}
          <div className="mt-14 pt-10 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/90 text-left">
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">0.00%</div>
              <div className="text-xs text-slate-400 font-medium mt-1">JMeter Stress Error Rate</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">5,000 concurrent threads</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/90 text-left">
              <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">&lt; 150ms</div>
              <div className="text-xs text-slate-400 font-medium mt-1">4G M2M Ingestion Latency</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Microcontroller Direct</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/90 text-left">
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">120B</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Trilingual AI Advisor</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">English, Hindi, Marathi</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/90 text-left">
              <div className="text-2xl sm:text-3xl font-black font-mono text-teal-400">100%</div>
              <div className="text-xs text-slate-400 font-medium mt-1">Tenant Data Isolation</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Cryptographic X-Device-Key</div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION: 4G IOT TELEMETRY INNOVATION (THE CORE RESEARCH BREAKTHROUGH) */}
      <section id="iot-gateway" className="py-20 bg-slate-900/50 border-y border-slate-800/80 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/50">
              Zero-Browser Dependency
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
              How the 4G Cellular IoT Gateway Works
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Unlike legacy systems requiring expensive center laptops and manual USB cables, DairyAI Nexus streams milk quality readings directly from digital scales and Ekomilk analyzers over 4G LTE-M.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Step 1 */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative hover:border-cyan-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5 font-bold font-mono">
                01
              </div>
              <h3 className="text-base font-bold text-white mb-2">Hardware Scale & Analyzer</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                As the farmer pours milk, digital load cells capture weight (L) and the Ekomilk ultrasonic chamber measures exact FAT% and SNF% via byte streams.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2 text-[11px] font-mono text-cyan-400">
                <Cpu className="w-3.5 h-3.5" />
                <span>RS-232 / UART Direct</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative hover:border-emerald-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 font-bold font-mono">
                02
              </div>
              <h3 className="text-base font-bold text-white mb-2">Autonomous 4G M2M Cellular TX</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The embedded micro-controller binds the dairy’s signed <code className="text-emerald-400">X-Device-Key</code>, packages the intake payload, and transmits directly over cellular LTE without local Wi-Fi or PC.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                <Radio className="w-3.5 h-3.5" />
                <span>HTTP POST /api/iot/milk-intake</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative hover:border-teal-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-5 font-bold font-mono">
                03
              </div>
              <h3 className="text-base font-bold text-white mb-2">Cloud Rate Matrix & SMS Alert</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Spring Boot verifies tenant isolation, evaluates pricing matrices in Redis cache in sub-milliseconds, logs the intake, and fires an instant SMS receipt to the farmer’s phone.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2 text-[11px] font-mono text-teal-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Instant Ledger + Twilio SMS</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION: ENTERPRISE BENTO GRID FEATURES */}
      <section id="features" className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/50">
            Enterprise Feature Suite
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
            Engineered for Modern Dairy Ecosystems
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Every module is tailored to address specific pain points in rural milk collection societies.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Card 1: Rapid POS */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-7 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
                <Zap className="w-6 h-6 fill-amber-500/20" />
              </div>
              <h3 className="text-lg font-bold text-white">Rapid Hardware POS</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Streamlined intake with retro 16x2 LCD display, keyboard auto-focus, duplicate shift warning popups, and instant Enter-key auto-save.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-amber-400">
              <span>Shift Guard Active</span>
              <span className="text-[10px] bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">No Double Intake</span>
            </div>
          </div>

          {/* Card 2: 10-Day Automated Settlements */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-7 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">10-Day Batch Settlements</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Automated period billing cycles. Simultaneously aggregates all daily milk deliveries and subtracts cattle feed store debits to compute net farmer payouts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-emerald-400">
              <span>Auto Debt Offset</span>
              <span className="text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">Zero Ledger Discrepancy</span>
            </div>
          </div>

          {/* Card 3: Trilingual AI Advisor */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-7 hover:border-teal-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-5">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Trilingual Agronomy AI</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Domain-trained on cattle breed nutrition, mastitis detection, and milk yield maximization. Converses natively in English, Marathi, and Hindi.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-teal-400">
              <span>GPT-OSS-120B Engine</span>
              <span className="text-[10px] bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800">Groq Acceleration</span>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION: ARCHITECTURE & TRUST BENCHMARKS */}
      <section id="architecture" className="py-20 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] pointer-events-none" />

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                  Cloud Infrastructure
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-2">
                  Built on Enterprise Java & AWS Cloud Scale
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                  Engineered as a clean layered monolith with Spring Boot, secured by stateless JWT authentication, and backed by MySQL with Redis caching. Reverse proxied by NGINX on AWS EC2 with horizontal scaling capability.
                </p>

                <div className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Multi-Tenant Isolation:</strong> Data segregated per dairy center with strict repository filters.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Redis In-Memory Pricing:</strong> Sub-millisecond lookup avoiding frequent database table scans.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Automated Testing:</strong> 79+ Unit & Mockito tests guaranteeing zero billing regressions.</span>
                  </div>
                </div>
              </div>

              {/* Architecture Tech Stack Terminal Card */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-slate-500 text-[11px]">
                  <span>DAIRY360-SYS-SPEC</span>
                  <span className="text-emerald-400">STATUS: PRODUCTION READY</span>
                </div>
                <div className="space-y-1.5 text-slate-400">
                  <div><span className="text-slate-600">&gt;</span> Backend:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-white">Spring Boot 3.3.4 (Java 17)</span></div>
                  <div><span className="text-slate-600">&gt;</span> Frontend:&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-white">React 18 + Vite + Tailwind CSS</span></div>
                  <div><span className="text-slate-600">&gt;</span> Database:&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-white">MySQL 8.0 + Hibernate JPA</span></div>
                  <div><span className="text-slate-600">&gt;</span> Cache:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-white">Redis In-Memory (Lettuce Pool)</span></div>
                  <div><span className="text-slate-600">&gt;</span> Proxy/SSL:&nbsp;&nbsp;&nbsp;<span className="text-white">NGINX Reverse Proxy (EC2)</span></div>
                  <div><span className="text-slate-600">&gt;</span> AI Engine:&nbsp;&nbsp;&nbsp;<span className="text-white">Groq Cloud (OpenAI GPT-OSS-120B)</span></div>
                  <div><span className="text-slate-600">&gt;</span> SMS Gateway:&nbsp;<span className="text-white">Twilio REST API Integration</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">DairyAI Nexus™</span>
            <span>&bull;</span>
            <span>Autonomous Cloud Dairy ERP & 4G IoT Gateway</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </span>
            <span>&bull;</span>
            <Link to="/login" className="hover:text-slate-300 transition-colors">Admin Login</Link>
            <Link to="/login" className="hover:text-slate-300 transition-colors">Farmer Portal</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
