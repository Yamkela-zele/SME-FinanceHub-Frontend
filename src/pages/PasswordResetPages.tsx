import { useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router"
import { api } from "../api"

export function RequestPasswordResetPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")
    try {
      const result = await api<{ message: string }>("/auth/request-password-reset", {
        method: "POST",
        body: { email },
      })
      setMessage(result.message)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The request could not be processed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4">
      <section className="w-full max-w-lg rounded-3xl border border-line bg-white p-8 shadow-sm">
        <p className="eyebrow">Account recovery</p>
        <h1 className="mt-2 text-2xl font-extrabold">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-muted">If an eligible account matches the address, we’ll send a secure reset link.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="form-label">Email address</span>
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="form-input" />
          </label>
          {message && <p role="status" className="text-sm text-accent">{message}</p>}
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-60">
            {loading ? "Sending request…" : "Request reset link"}
          </button>
        </form>
        <Link to="/login" className="mt-6 block text-center text-sm font-semibold text-brand-blue">Return to login</Link>
      </section>
    </main>
  )
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get("token")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage("")
    setError("")
    if (!token) {
      setError("The password reset token is missing.")
      return
    }
    if (password !== confirm) {
      setError("The passwords do not match.")
      return
    }
    setLoading(true)
    try {
      await api("/auth/reset-password", { method: "POST", body: { token, password } })
      setMessage("Password reset. Sign in with your new password.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The password could not be reset.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4">
      <section className="w-full max-w-lg rounded-3xl border border-line bg-white p-8 shadow-sm">
        <p className="eyebrow">Account recovery</p>
        <h1 className="mt-2 text-2xl font-extrabold">Choose a new password</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="form-label">New password</span>
            <input required minLength={12} autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="form-input" />
          </label>
          <label className="block">
            <span className="form-label">Confirm password</span>
            <input required minLength={12} autoComplete="new-password" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="form-input" />
          </label>
          <p className="text-xs text-muted">Use at least 12 characters with uppercase, lowercase, number and symbol characters.</p>
          {message && <p role="status" className="text-sm text-accent">{message}</p>}
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-60">
            {loading ? "Saving…" : "Reset password"}
          </button>
        </form>
        <Link to="/login" className="mt-6 block text-center text-sm font-semibold text-brand-blue">Return to login</Link>
      </section>
    </main>
  )
}
