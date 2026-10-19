import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { useAuth } from "../auth/auth"
import { api } from "../api"

type ApiUser = {
  id: string
  name: string
  email: string
  role: "owner" | "accountant" | "funder" | "admin"
  businessId: string | null
  businessName: string | null
}

export function CreatePasswordPage() {
  const [params] = useSearchParams()
  const token = params.get("token")
  const navigate = useNavigate()
  const { acceptSession } = useAuth()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    if (!token) {
      setError("The password setup link is missing its token.")
      return
    }
    if (password !== confirm) {
      setError("The passwords do not match.")
      return
    }
    setLoading(true)
    try {
      const result = await api<{ active: boolean; token?: string; user?: ApiUser }>("/auth/create-password", {
        method: "POST",
        body: { token, password },
      })
      if (result.active && result.token && result.user) {
        acceptSession({ token: result.token, user: result.user })
        navigate("/app/dashboard", { replace: true })
      } else {
        navigate("/registration-pending", { replace: true })
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Password could not be created.")
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4">
      <section className="w-full max-w-lg rounded-3xl border border-line bg-white p-8 shadow-sm">
        <p className="eyebrow">Secure account setup</p>
        <h1 className="mt-2 text-2xl font-extrabold">Create your password</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Use at least 12 characters, including an uppercase letter, lowercase letter, number and symbol.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="form-label">Password</span>
            <input
              required
              minLength={12}
              autoComplete="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="form-input"
            />
          </label>
          <label className="block">
            <span className="form-label">Confirm password</span>
            <input
              required
              minLength={12}
              autoComplete="new-password"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="form-input"
            />
          </label>
          {error && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
          <button disabled={loading || !token} className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-60">
            {loading ? "Saving password…" : "Create password"}
          </button>
        </form>
        <Link to="/login" className="mt-6 block text-center text-sm font-semibold text-brand-blue">Return to login</Link>
      </section>
    </main>
  )
}
