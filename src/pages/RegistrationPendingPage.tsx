import { useState, type FormEvent } from "react"
import { Link } from "react-router"
import { api } from "../api"

export function RegistrationPendingPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const resend = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)
    try {
      const result = await api<{ message: string }>("/auth/resend-verification", {
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
        <p className="eyebrow">Registration received</p>
        <h1 className="mt-2 text-2xl font-extrabold">Check your email for next steps.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Your SME FinanceHub registration has been received. Please verify your email and create your password. Your business account will be available once the required verification steps are completed.
        </p>
        <form onSubmit={resend} className="mt-7 space-y-4">
          <label className="block">
            <span className="form-label">Resend verification email</span>
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="form-input" />
          </label>
          {message && <p role="status" className="text-sm text-accent">{message}</p>}
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl border border-line py-3 text-sm font-bold disabled:opacity-60">
            {loading ? "Requesting…" : "Send again"}
          </button>
        </form>
        <Link to="/login" className="mt-6 block text-center text-sm font-semibold text-brand-blue">Return to login</Link>
      </section>
    </main>
  )
}
