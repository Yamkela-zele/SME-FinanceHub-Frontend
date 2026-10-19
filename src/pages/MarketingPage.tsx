import { Modal } from "../components/ui"
import {
  ArrowRight,
  BarChart3,
  Check,
  FileCheck2,
  Landmark,
  Menu,
  ReceiptText,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"
import { Brand } from "../components/Brand"

const features = [
  [
    BarChart3,
    "A dashboard that makes sense",
    "See income, expenses, cash position and outstanding invoices at a glance.",
  ],
  [
    ReceiptText,
    "Invoices and payments",
    "Create invoices and track balances and overdue payments.",
  ],
  [
    TrendingUp,
    "Cash-flow forecasting",
    "Review a 30-day cash-flow outlook based on your recorded transactions and invoices.",
  ],
  [
    FileCheck2,
    "Funding-ready records",
    "Track your business information and funding-readiness checklist.",
  ],
  [
    Landmark,
    "Transaction review",
    "Review recorded income and expenses and keep your business records organised.",
  ],
  [
    Sparkles,
    "Financial insights",
    "Review cash-flow and invoice information calculated from your business records.",
  ],
] as const

export function MarketingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [legal, setLegal] = useState<"Privacy" | "Terms" | null>(null)
  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Brand />
          <nav
            className="hidden items-center gap-7 text-sm font-semibold text-muted lg:flex"
            aria-label="Public navigation"
          >
            <a href="#features" className="hover:text-brand-blue">
              Features
            </a>
            <a href="#how" className="hover:text-brand-blue">
              How it works
            </a>
            <a href="#funding" className="hover:text-brand-blue">
              Funding readiness
            </a>
            <a href="#pricing" className="hover:text-brand-blue">
              Pricing
            </a>
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-canvas"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Get started
            </Link>
          </div>
          <button
            className="rounded-xl border border-line p-2.5 lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-line bg-white p-5 lg:hidden">
            <div className="grid gap-2">
              {["Features", "How it works", "Funding readiness", "Pricing"].map(
                (item) => (
                  <a
                    key={item}
                    href={`#${item.split(" ")[0].toLowerCase()}`}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-canvas"
                  >
                    {item}
                  </a>
                ),
              )}
              <Link
                to="/login"
                className="mt-2 rounded-xl border border-line px-4 py-3 text-center text-sm font-semibold"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-brand px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </header>
      <main>
        <section className="relative overflow-hidden bg-hero">
          <div className="pointer-events-none absolute -right-32 -top-32 size-[32rem] rounded-full bg-brand-blue/10 blur-3xl" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-28">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue/15 bg-white px-3 py-1.5 text-xs font-bold text-brand-blue shadow-sm">
                <span className="size-1.5 rounded-full bg-accent" /> Built for
                South African small businesses
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.04] tracking-[-0.045em] text-brand sm:text-5xl md:text-6xl">
                Know your numbers.
                <br />
                <span className="text-brand-blue">Grow your business.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
                Manage income, expenses, invoices and cash flow in one place.
                Build organised financial records and prepare your business for
                funding opportunities.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand/15"
                >
                  Create your account <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-6 py-3.5 text-sm font-bold"
                >
                  Explore features
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
                {["Business workspace", "ZAR-ready", "Records saved to your account"].map(
                  (item) => (
                    <span key={item} className="flex items-center gap-2">
                      <Check className="size-4 text-accent" strokeWidth={3} />
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-white/80 bg-white p-3 shadow-2xl shadow-brand/15">
              <div className="rounded-2xl bg-canvas p-5 md:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-blue">
                      Financial overview
                    </p>
                    <p className="mt-1 text-xl font-bold">
                      Your business at a glance
                    </p>
                  </div>
                  <div className="rounded-lg bg-white px-3 py-2 text-xs font-semibold shadow-sm">
                    This month
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {["Income", "Expenses", "Net difference", "Outstanding"].map((label) => (
                    <div
                      key={label}
                      className="rounded-xl bg-white p-4 shadow-sm"
                    >
                      <p className="text-[11px] font-semibold text-muted">
                        {label}
                      </p>
                      <p className="mt-2 text-lg font-extrabold">—</p>
                      <p className="mt-1 text-[10px] font-semibold text-muted">
                        From your records
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-[1.5fr_1fr]">
                  <div className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">Cash movement</p>
                      <span className="text-[10px] text-muted">
                        Last 6 months
                      </span>
                    </div>
                    <div className="mt-7 grid h-32 place-items-center rounded-lg bg-canvas px-4 text-center text-xs text-muted">
                      Your transactions will appear here once recorded.
                    </div>
                  </div>
                  <div className="rounded-xl bg-brand p-5 text-white shadow-sm">
                    <p className="text-xs font-semibold text-white/60">
                      Funding readiness
                    </p>
                    <div className="mt-5 flex items-center gap-4">
                      <div className="grid size-16 place-items-center rounded-full border-[7px] border-white/20 text-lg font-bold">
                        —
                      </div>
                      <p className="text-sm leading-5 text-white/70">
                        Your score is based on your checklist.
                      </p>
                    </div>
                    <div className="mt-5 rounded-lg bg-white/10 p-3 text-xs text-white/70">
                      Complete your checklist to see your readiness.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="max-w-2xl">
            <p className="eyebrow">Everything in one place</p>
            <h2 className="section-title">
              From scattered records to clear financial control.
            </h2>
            <p className="section-copy">
              Practical tools to stay organised, make informed decisions and
              present your business professionally.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(([Icon, title, text]) => (
              <article
                key={title}
                className="group rounded-2xl border border-line bg-white p-6 transition hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-xl"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-blue-soft text-brand-blue">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="how" className="bg-brand py-24 text-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <p className="eyebrow !text-mint">Simple by design</p>
              <h2 className="section-title !text-white">
                Better financial habits in four clear steps.
              </h2>
              <p className="section-copy !text-white/60">
                No accounting jargon. Just a guided path to cleaner records.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2">
              {[
                "Create your business profile",
                "Record your transactions",
                "Review financial insights",
                "Review records and readiness items",
              ].map((item, index) => (
                <div key={item} className="bg-brand p-7">
                  <span className="text-sm font-bold text-mint">
                    0{index + 1}
                  </span>
                  <h3 className="mt-3 text-lg font-bold">{item}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    Follow simple prompts and build your complete financial
                    picture.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="funding" className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="grid items-center gap-12 rounded-3xl bg-green-soft p-8 md:p-14 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Funding readiness</p>
              <h2 className="section-title">
                Be ready when opportunity knocks.
              </h2>
              <p className="section-copy">
                Track the information and records you need to prepare your
                business for funding opportunities.
              </p>
              <p className="mt-5 text-xs leading-5 text-muted">
                FinanceHub helps you prepare; it does not guarantee finance,
                grants or application approval.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <div className="flex justify-between">
                <p className="font-bold">Readiness checklist preview</p>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  "Business registration",
                  "Tax compliance",
                  "Financial statements",
                  "Bank statements",
                ].map((item, i) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-line p-3"
                  >
                    <span
                      className={`grid size-6 place-items-center rounded-full ${
                        "bg-canvas text-muted"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section id="pricing" className="bg-canvas py-24">
          <div className="mx-auto max-w-5xl px-5 text-center">
            <p className="eyebrow">Pricing</p>
            <h2 className="section-title">Plans and billing are not configured.</h2>
            <p className="section-copy mx-auto">
              Create an account to use the available business-record and
              funding-readiness features. No subscription is managed here.
            </p>
          </div>
        </section>
      </main>
      <footer className="bg-sidebar py-10 text-white sm:py-12">
        <div className="mx-auto grid max-w-7xl gap-9 px-5 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
          <div>
            <Brand light />
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
              SME FinanceHub helps South African small businesses organise
              financial records, track cash flow and prepare for funding
              opportunities.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Explore</h2>
            <nav className="mt-3 flex flex-col items-start gap-3 text-sm text-white/65" aria-label="Footer navigation">
              <a href="#features" className="hover:text-white">Features</a>
              <a href="#how" className="hover:text-white">How it works</a>
              <a href="#funding" className="hover:text-white">Funding readiness</a>
              <a href="#pricing" className="hover:text-white">Plans and billing</a>
              <Link to="/login" className="hover:text-white">Log in</Link>
              <Link to="/register" className="hover:text-white">Create an account</Link>
            </nav>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Important information</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">
              Finance and cash-flow figures are based on records entered into
              the system and are estimates, not financial, tax or legal advice.
              Business verification is reviewed manually; automated CIPC
              verification is not currently available.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/65">
              <button onClick={() => setLegal("Privacy")} className="hover:text-white">Privacy notice</button>
              <button onClick={() => setLegal("Terms")} className="hover:text-white">Terms of use</button>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-9 max-w-7xl border-t border-white/10 px-5 pt-5 text-xs leading-5 text-white/45 lg:px-8">
          © {new Date().getFullYear()} SME FinanceHub. All rights reserved.
          Privacy and terms content should be reviewed before production.
        </div>
      </footer>
      {legal && (
        <Modal title={legal === "Privacy" ? "Privacy notice" : "Terms of use"} onClose={() => setLegal(null)}>
          <p className="text-sm leading-6 text-muted">
            {legal === "Privacy"
              ? "Information you submit is sent to and stored by the FinanceHub backend for your account. Keep your login credentials private."
              : "Figures are calculated from records in your account, and cash-flow values are estimates. They are not financial, tax or legal advice. Legal content requires review before production."}
          </p>
          <button onClick={() => setLegal(null)} className="mt-6 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white">
            Close
          </button>
        </Modal>
      )}
    </div>
  )
}
