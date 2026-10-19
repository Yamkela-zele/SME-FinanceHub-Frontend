import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router"
import { api } from "../api"

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get("token")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) {
      setError("The verification link is missing its token.")
      return
    }
    let active = true
    api<{ passwordSetupToken: string }>("/auth/verify-email", {
      method: "POST",
      body: { token },
    }).then(({ passwordSetupToken }) => {
      if (active) window.location.replace(`/create-password?token=${encodeURIComponent(passwordSetupToken)}`)
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "This verification link is invalid or expired.")
    })
    return () => { active = false }
  }, [token])

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4">
      <section className="w-full max-w-lg rounded-3xl border border-line bg-white p-8 text-center shadow-sm">
        <p className="eyebrow">Email verification</p>
        <h1 className="mt-2 text-2xl font-extrabold">Verifying your email</h1>
        {error
          ? <p role="alert" className="mt-4 text-sm text-danger">{error}</p>
          : <p className="mt-4 text-sm text-muted">Please wait while we validate your secure link.</p>}
        {error && <Link to="/registration-pending" className="mt-6 inline-block font-semibold text-brand-blue">Request another verification email</Link>}
      </section>
    </main>
  )
}
