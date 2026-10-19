import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { useAuth } from "../auth/auth"
import { api } from "../api"

type Invitation = { email: string; role: string; organisation: string }
type ApiUser = {
  id: string
  name: string
  email: string
  role: "owner" | "accountant" | "funder" | "admin"
  businessId: string | null
  businessName: string | null
}

export function AcceptInvitationPage() {
  const [params] = useSearchParams()
  const token = params.get("token")
  const navigate = useNavigate()
  const { acceptSession } = useAuth()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [error, setError] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setError("This invitation link is missing its token.")
      return
    }
    let active = true
    api<Invitation>("/auth/validate-invitation", { method: "POST", body: { token } })
      .then((data) => { if (active) setInvitation(data) })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "This invitation is invalid or expired.")
      })
    return () => { active = false }
  }, [token])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    if (!token) return
    if (password !== confirm) {
      setError("The passwords do not match.")
      return
    }
    setLoading(true)
    try {
      const result = await api<{ token: string; user: ApiUser }>("/auth/accept-invitation", {
        method: "POST",
        body: { token, password },
      })
      const user = acceptSession(result)
      navigate(user.role === "funder" ? "/funding/dashboard" : "/app/accountant", { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The invitation could not be accepted.")
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4">
      <section className="w-full max-w-lg rounded-3xl border border-line bg-white p-8 shadow-sm">
        <p className="eyebrow">Secure invitation</p>
        <h1 className="mt-2 text-2xl font-extrabold">Activate your account</h1>
        {invitation && (
          <p className="mt-3 text-sm leading-6 text-muted">
            You’re invited to join <strong>{invitation.organisation}</strong> as a {invitation.role}. The invitation is for {invitation.email}.
          </p>
        )}
        {error && <p role="alert" className="mt-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
        {invitation && (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="form-label">Create password</span>
              <input required minLength={12} autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="form-input" />
            </label>
            <label className="block">
              <span className="form-label">Confirm password</span>
              <input required minLength={12} autoComplete="new-password" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="form-input" />
            </label>
            <p className="text-xs text-muted">Use at least 12 characters with uppercase, lowercase, number and symbol characters.</p>
            <button disabled={loading} className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-60">
              {loading ? "Activating account…" : "Create password and activate"}
            </button>
          </form>
        )}
        <Link to="/login" className="mt-6 block text-center text-sm font-semibold text-brand-blue">Return to login</Link>
      </section>
    </main>
  )
}
