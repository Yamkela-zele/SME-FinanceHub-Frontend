import { ArrowLeft, Check, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router"
import { roleHome, useAuth } from "../auth/auth"
import { Brand } from "../components/Brand"

export function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user, login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  if (user) return <Navigate to={roleHome[user.role]} replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setLoading(true)
    try {
      const signedIn = await login(email, password)
      navigate(roleHome[signedIn.role])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden overflow-hidden bg-brand p-12 text-white lg:flex lg:flex-col">
        <Brand light />
        <div className="my-auto max-w-xl">
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-mint">
            Built for South African businesses
          </span>
          <h1 className="mt-7 text-5xl font-extrabold leading-[1.08] tracking-tight">
            Financial clarity starts with one simple step.
          </h1>
          <p className="mt-5 text-lg leading-8 text-white/60">
            Organise your records, understand your cash flow and prepare for
            funding with confidence.
          </p>
          <div className="mt-10 grid gap-4">
            {[
              "See your complete financial picture",
              "Stay ahead of cash-flow gaps",
              "Build funding-ready records",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-semibold">
                <span className="grid size-6 place-items-center rounded-full bg-mint text-brand">
                  <Check className="size-3.5" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/35">
          Your account and business records are stored securely.
        </p>
      </div>
      <div className="flex min-h-screen flex-col p-6 sm:p-10 lg:p-14">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden"><Brand compact /></div>
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-muted">
            <ArrowLeft className="size-4" /> Back to home
          </Link>
        </div>
        <div className="mx-auto my-auto w-full max-w-md py-12">
          <p className="eyebrow">Welcome back</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Log in to FinanceHub.</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Enter the email address and password for your active account.
          </p>
          <Link to="/forgot-password" className="mt-3 inline-block text-sm font-semibold text-brand-blue">
            Forgot your password?
          </Link>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block">
              <span className="form-label">Email address</span>
              <span className="input-wrap">
                <Mail className="size-4 text-muted" />
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent outline-none"
                  placeholder="you@business.co.za"
                />
              </span>
            </label>
            <label className="block">
              <span className="form-label">Password</span>
              <span className="input-wrap">
                <LockKeyhole className="size-4 text-muted" />
                <input
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-transparent outline-none"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </label>
            {error && (
              <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">
                {error}
              </p>
            )}
            <button
              disabled={loading}
              className="flex w-full justify-center rounded-xl bg-brand py-3.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {loading ? "Opening your workspace…" : "Log in securely"}
            </button>
          </form>
          <p className="mt-7 text-center text-sm text-muted">
            New to FinanceHub?{" "}
            <Link to="/register" className="font-bold text-brand-blue">Create a business account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
