import { useEffect, useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router"
import { AppShell } from "../components/AppShell"
import { api } from "../api"
import { useAuth } from "../auth/auth"
import { useApi } from "../useApi"

type AccountantApplication = {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  phone: string
  jobTitle: string | null
  responsibilities: string
  reason: string | null
  status: string
  submittedAt: string
  reviewNotes: string | null
  business: { id: string; name: string }
  owner: { name: string; email: string }
  reviews: { action: string; notes: string | null; reviewer: string; at: string }[]
}

const statusTone: Record<string, string> = {
  PENDING_ADMIN_APPROVAL: "bg-warning-soft text-warning",
  UNDER_REVIEW: "bg-blue-soft text-brand-blue",
  CHANGES_REQUIRED: "bg-warning-soft text-warning",
  APPROVED: "bg-green-soft text-accent",
  REJECTED: "bg-danger-soft text-danger",
  WITHDRAWN: "bg-slate-100 text-muted",
}

const formatStatus = (status: string) => status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
const dateLabel = (date: string) => new Date(date).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })

export function OwnerTeamPage() {
  const { user } = useAuth()
  const { data, error, loading, reload } = useApi<{ data: AccountantApplication[] }>(
    user?.businessId ? `/businesses/${user.businessId}/accountants` : null,
  )
  const applications = data?.data ?? []
  const [actionError, setActionError] = useState("")

  const withdraw = async (id: string) => {
    setActionError("")
    try {
      await api(`/accountant-applications/${id}/withdraw`, { method: "POST" })
      await reload()
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Application could not be withdrawn.")
    }
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Invite an accountant to request access to this business. They cannot access financial records until approval and activation.</p>
        </div>
        <Link to="/app/settings/team/add-accountant" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white">
          Add Accountant / Finance Officer
        </Link>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
      {actionError && <p role="alert" className="mb-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">{actionError}</p>}
      <section className="overflow-x-auto rounded-2xl border border-line bg-white p-5">
        <h2 className="mb-4 font-bold">Accountant applications</h2>
        {loading && !data && <p className="py-6 text-sm text-muted">Loading applications…</p>}
        {!loading && applications.length === 0 && <p className="py-6 text-sm text-muted">No accountant applications have been submitted for this business.</p>}
        {applications.length > 0 && (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead><tr className="border-b border-line text-xs uppercase text-muted">
              {["Applicant", "Contact", "Submitted", "Status", "Actions"].map((item) => <th key={item} className="px-3 py-3">{item}</th>)}
            </tr></thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id} className="border-b border-line/70">
                  <td className="px-3 py-4">
                    <span className="font-semibold">{application.name}</span>
                    <span className="block text-xs text-muted">{application.jobTitle || "Accountant / Finance Officer"}</span>
                  </td>
                  <td className="px-3 py-4">{application.email}<span className="block text-xs text-muted">{application.phone}</span></td>
                  <td className="px-3 py-4">{dateLabel(application.submittedAt)}</td>
                  <td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusTone[application.status] ?? statusTone.WITHDRAWN}`}>{formatStatus(application.status)}</span></td>
                  <td className="px-3 py-4">
                    <div className="flex gap-2">
                      {application.status === "CHANGES_REQUIRED" && (
                        <Link to={`/app/settings/team/add-accountant?edit=${application.id}`} className="text-xs font-bold text-brand-blue">Correct details</Link>
                      )}
                      {["PENDING_ADMIN_APPROVAL", "UNDER_REVIEW", "CHANGES_REQUIRED"].includes(application.status) && (
                        <button onClick={() => void withdraw(application.id)} className="text-xs font-bold text-danger">Withdraw</button>
                      )}
                    </div>
                    {application.reviewNotes && <p className="mt-2 max-w-sm text-xs text-muted">Reviewer note: {application.reviewNotes}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AppShell>
  )
}

export function AddAccountantPage() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const editId = params.get("edit")
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    responsibilities: "",
    reason: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!editId) return
    let active = true
    api<{ data: AccountantApplication }>(`/accountant-applications/${editId}`)
      .then(({ data }) => {
        if (active) setForm({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          jobTitle: data.jobTitle ?? "",
          responsibilities: data.responsibilities,
          reason: data.reason ?? "",
        })
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Application could not be loaded.")
      })
    return () => { active = false }
  }, [editId])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    if (!user?.businessId) {
      setError("No business workspace is linked to this account.")
      return
    }
    setLoading(true)
    try {
      const path = editId
        ? `/accountant-applications/${editId}`
        : `/businesses/${user.businessId}/accountants`
      await api(path, {
        method: editId ? "PATCH" : "POST",
        body: {
          ...form,
          jobTitle: form.jobTitle || undefined,
          reason: form.reason || undefined,
        },
      })
      window.location.assign("/app/settings/team")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The application could not be submitted.")
      setLoading(false)
    }
  }

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }))
  const fields: [keyof typeof form, string, string?][] = [
    ["firstName", "First name"],
    ["lastName", "Last name"],
    ["email", "Email address", "email"],
    ["phone", "Contact number", "tel"],
    ["jobTitle", "Job title (optional)"],
  ]

  return (
    <AppShell>
      <div className="mb-5"><Link to="/app/settings/team" className="text-sm font-semibold text-brand-blue">← Team management</Link></div>
      <section className="max-w-3xl rounded-2xl border border-line bg-white p-6 sm:p-8">
        <p className="eyebrow">Team access</p>
        <h1 className="mt-2 text-2xl font-extrabold">{editId ? "Correct accountant application" : "Add Accountant / Finance Officer"}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">The application is associated with {user?.organisation ?? "your business"} and must be reviewed by a platform administrator before access is granted.</p>
        <form onSubmit={submit} className="mt-7 grid gap-5 sm:grid-cols-2">
          {fields.map(([key, label, type]) => (
            <label key={key} className="block">
              <span className="form-label">{label}</span>
              <input required={key !== "jobTitle"} type={type ?? "text"} value={form[key]} onChange={(event) => update(key, event.target.value)} className="form-input" />
            </label>
          ))}
          <label className="block sm:col-span-2">
            <span className="form-label">Business role or responsibilities</span>
            <textarea required minLength={3} maxLength={1000} rows={3} value={form.responsibilities} onChange={(event) => update("responsibilities", event.target.value)} className="form-input" />
          </label>
          <label className="block sm:col-span-2">
            <span className="form-label">Reason for granting access (optional)</span>
            <textarea maxLength={1000} rows={3} value={form.reason} onChange={(event) => update("reason", event.target.value)} className="form-input" />
          </label>
          {error && <p role="alert" className="sm:col-span-2 rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
          <button disabled={loading} className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2 sm:justify-self-start">
            {loading ? "Submitting…" : editId ? "Resubmit application" : "Submit for administrator review"}
          </button>
        </form>
      </section>
    </AppShell>
  )
}

type AdminSummary = { pending: number; review: number; changes: number; approved: number; rejected: number; awaiting: number }

export function AdminAccountantApplicationsPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("")
  const path = `/admin/accountant-applications?page=1&pageSize=50${filter ? `&status=${encodeURIComponent(filter)}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`
  const { data, error, reload } = useApi<{ data: AccountantApplication[]; total: number }>(path)
  const summary = useApi<AdminSummary>("/admin/accountant-applications/summary")
  const [selected, setSelected] = useState("")
  const [reason, setReason] = useState("")
  const [actionError, setActionError] = useState("")

  const act = async (id: string, action: string, body?: unknown) => {
    setActionError("")
    try {
      await api(`/admin/accountant-applications/${id}/${action}`, { method: "POST", body })
      setSelected("")
      setReason("")
      await Promise.all([reload(), summary.reload()])
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "The application could not be updated.")
    }
  }

  return (
    <AppShell>
      <p className="mb-5 text-sm text-muted">Review and verify Accountant / Finance Officer applications before business access is granted.</p>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ["Pending applications", summary.data?.pending],
          ["Under review", summary.data?.review],
          ["Changes requested", summary.data?.changes],
          ["Approved", summary.data?.approved],
          ["Rejected", summary.data?.rejected],
          ["Invitations awaiting activation", summary.data?.awaiting],
        ].map(([label, count]) => (
          <div key={String(label)} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-xs font-semibold text-muted">{label}</p>
            <p className="mt-2 text-2xl font-extrabold">{count ?? "—"}</p>
          </div>
        ))}
      </div>
      <section className="rounded-2xl border border-line bg-white p-5">
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_240px]">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, business or owner" className="form-input" />
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="form-input">
            <option value="">All statuses</option>
            {["PENDING_ADMIN_APPROVAL", "UNDER_REVIEW", "CHANGES_REQUIRED", "APPROVED", "REJECTED", "WITHDRAWN"].map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
          </select>
        </div>
        {error && <p role="alert" className="mb-3 text-sm text-danger">{error}</p>}
        {actionError && <p role="alert" className="mb-3 text-sm text-danger">{actionError}</p>}
        {!data?.data.length && <p className="py-8 text-sm text-muted">No accountant applications match this filter.</p>}
        {data?.data.map((application) => (
          <article key={application.id} className="border-t border-line py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-bold">{application.name}</h2>
                <p className="mt-1 text-sm text-muted">{application.email} · {application.phone}</p>
                <p className="mt-1 text-sm">{application.business.name} · Submitted by {application.owner.name} ({application.owner.email})</p>
                <p className="mt-1 text-xs text-muted">Submitted {dateLabel(application.submittedAt)}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusTone[application.status] ?? statusTone.WITHDRAWN}`}>{formatStatus(application.status)}</span>
            </div>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-semibold text-brand-blue">Application and review history</summary>
              <div className="mt-3 grid gap-2 text-muted sm:grid-cols-2">
                <p>Responsibilities: {application.responsibilities}</p>
                <p>Job title: {application.jobTitle || "—"}</p>
                <p>Reason: {application.reason || "—"}</p>
                <div>Review history: {application.reviews.length ? application.reviews.map((review, index) => (
                  <p key={`${review.at}-${index}`}>{formatStatus(review.action)} — {review.reviewer} — {dateLabel(review.at)}{review.notes ? `: ${review.notes}` : ""}</p>
                )) : "No previous review actions."}</div>
              </div>
            </details>
            {["PENDING_ADMIN_APPROVAL", "UNDER_REVIEW", "CHANGES_REQUIRED"].includes(application.status) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button onClick={() => void act(application.id, "review")} className="rounded-lg border border-line px-3 py-2 text-xs font-bold">Return to review</button>
                <button onClick={() => void act(application.id, "approve")} className="rounded-lg bg-green-soft px-3 py-2 text-xs font-bold text-accent">Approve and invite</button>
                <button onClick={() => setSelected(selected === application.id ? "" : application.id)} className="rounded-lg border border-line px-3 py-2 text-xs font-bold">Request changes / reject</button>
                {selected === application.id && (
                  <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row">
                    <textarea value={reason} onChange={(event) => setReason(event.target.value)} required minLength={5} maxLength={2000} rows={2} placeholder="Enter required corrections or rejection reason" className="form-input flex-1" />
                    <div className="flex gap-2">
                      <button disabled={reason.trim().length < 5} onClick={() => void act(application.id, "request-changes", { reason })} className="rounded-lg bg-warning-soft px-3 py-2 text-xs font-bold text-warning disabled:opacity-50">Request changes</button>
                      <button disabled={reason.trim().length < 5} onClick={() => void act(application.id, "reject", { reason })} className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-bold text-danger disabled:opacity-50">Reject</button>
                    </div>
                  </div>
                )}
                {application.status === "APPROVED" && (
                  <button
                    onClick={() => void act(application.id, "resend-invitation")}
                    className="mt-3 rounded-lg border border-line px-3 py-2 text-xs font-bold"
                  >
                    Resend activation invitation
                  </button>
                )}
              </div>
            )}
          </article>
        ))}
        <p className="pt-3 text-xs text-muted">{data?.total ?? 0} application(s)</p>
      </section>
    </AppShell>
  )
}

type Partner = {
  id: string
  name: string
  type: string
  email: string
  contactName: string
  phone: string | null
  status: string
  activeShares: number
}

export function FundingPartnerManagementPage() {
  const { data, error, reload } = useApi<{ data: Partner[] }>("/admin/funding-partners")
  const [actionError, setActionError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActionError("")
    setLoading(true)
    const formElement = event.currentTarget
    const formData = new FormData(formElement)
    const value = (key: string) => String(formData.get(key) ?? "").trim()
    try {
      await api("/admin/funding-partners", {
        method: "POST",
        body: {
          organisationName: value("organisationName"),
          organisationType: value("organisationType"),
          firstName: value("firstName"),
          lastName: value("lastName"),
          email: value("email"),
          phone: value("phone"),
          website: value("website") || undefined,
          address: value("address"),
          province: value("province"),
          municipality: value("municipality") || undefined,
          programmes: value("programmes") || undefined,
          description: value("description") || undefined,
          verificationNotes: value("verificationNotes") || undefined,
        },
      })
      formElement.reset()
      await reload()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "The invitation could not be created.")
    } finally {
      setLoading(false)
    }
  }

  const resend = async (id: string) => {
    setActionError("")
    try {
      await api(`/admin/funding-partners/${id}/resend-invitation`, { method: "POST" })
      await reload()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Invitation could not be resent.")
    }
  }

  const suspend = async (id: string) => {
    setActionError("")
    try {
      await api(`/admin/funding-partners/${id}/suspend`, { method: "POST" })
      await reload()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Funding partner could not be suspended.")
    }
  }

  return (
    <AppShell>
      <p className="mb-5 text-sm text-muted">Create Funding Partner accounts and send secure activation invitations. Partners see no business data unless an owner explicitly shares access.</p>
      <section className="mb-6 rounded-2xl border border-line bg-white p-6">
        <h1 className="text-lg font-bold">Invite a Funding Partner</h1>
        <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            ["organisationName", "Organisation name", "text"],
            ["organisationType", "Organisation type", "text"],
            ["firstName", "Contact first name", "text"],
            ["lastName", "Contact last name", "text"],
            ["email", "Official organisation email", "email"],
            ["phone", "Contact number", "tel"],
            ["website", "Organisation website (optional)", "url"],
            ["address", "Organisation address", "text"],
            ["province", "Province", "text"],
            ["municipality", "Municipality (optional)", "text"],
          ].map(([name, label, type]) => (
            <label key={name} className="block">
              <span className="form-label">{label}</span>
              <input name={name} type={type} required={!label.includes("optional")} className="form-input" />
            </label>
          ))}
          {[
            ["programmes", "Funding programmes or areas of interest"],
            ["description", "Organisation description"],
            ["verificationNotes", "Verification notes"],
          ].map(([name, label]) => (
            <label key={name} className="block sm:col-span-2">
              <span className="form-label">{label} (optional)</span>
              <textarea name={name} maxLength={2000} rows={2} className="form-input" />
            </label>
          ))}
          {actionError && <p role="alert" className="sm:col-span-2 text-sm text-danger">{actionError}</p>}
          <button disabled={loading} className="rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2 sm:justify-self-start">
            {loading ? "Creating invitation…" : "Create Funding Partner invitation"}
          </button>
        </form>
      </section>
      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="mb-4 font-bold">Funding Partner accounts</h2>
        {error && <p role="alert" className="mb-3 text-sm text-danger">{error}</p>}
        {!data?.data.length && <p className="py-5 text-sm text-muted">No Funding Partners have been created.</p>}
        {data?.data.map((partner) => (
          <div key={partner.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-4">
            <div>
              <p className="font-semibold">{partner.name} <span className="text-xs font-normal text-muted">· {partner.type}</span></p>
              <p className="mt-1 text-sm text-muted">{partner.contactName} · {partner.email} · {partner.phone ?? "No phone"}</p>
              <p className="mt-1 text-xs text-muted">Status: {formatStatus(partner.status)} · {partner.activeShares} active business shares</p>
            </div>
            <div className="flex gap-2">
              {partner.status === "PENDING_ACTIVATION" && <button onClick={() => void resend(partner.id)} className="rounded-lg border border-line px-3 py-2 text-xs font-bold">Resend invitation</button>}
              {partner.status === "ACTIVE" && <button onClick={() => void suspend(partner.id)} className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-bold text-danger">Suspend</button>}
            </div>
          </div>
        ))}
      </section>
    </AppShell>
  )
}

type FundingShare = { id: string; partner: string; email: string; expiresAt: string | null; revoked: boolean; createdAt: string }
type FundingPartnerOption = { id: string; organisationName: string; organisationType: string }

export function FundingSharingPage() {
  const partners = useApi<{ data: FundingPartnerOption[] }>("/funding/partners")
  const shares = useApi<{ data: FundingShare[] }>("/funding/shares")
  const verification = useApi<{ data: { business: { verificationStatus: string } } }>("/business-verifications/current-business")
  const businessVerified = verification.data?.data.business.verificationStatus === "VERIFIED"
  const [partnerId, setPartnerId] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const grant = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api("/funding/shares", {
        method: "POST",
        body: { fundingPartnerId: partnerId, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined },
      })
      setExpiresAt("")
      await shares.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Access could not be shared.")
    } finally {
      setLoading(false)
    }
  }

  const revoke = async (id: string) => {
    setError("")
    try {
      await api(`/funding/shares/${id}`, { method: "DELETE" })
      await shares.reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Access could not be revoked.")
    }
  }

  useEffect(() => {
    if (!partnerId && partners.data?.data.length) setPartnerId(partners.data.data[0].id)
  }, [partnerId, partners.data])

  return (
    <AppShell>
      <p className="mb-5 text-sm leading-6 text-muted">Only share information with a Funding Partner you trust. Access is recorded, can be time-limited, and can be revoked here.</p>
      <section className="mb-6 rounded-2xl border border-line bg-white p-6">
        <h1 className="font-bold">Share with a Funding Partner</h1>
        {!businessVerified && <p className="mt-2 text-sm text-muted">Business verification is required before information can be shared.</p>}
        <form onSubmit={grant} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="form-label">Funding Partner</span>
            <select required value={partnerId} onChange={(event) => setPartnerId(event.target.value)} className="form-input">
              {(partners.data?.data ?? []).map((partner) => <option key={partner.id} value={partner.id}>{partner.organisationName} · {partner.organisationType}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="form-label">Access expiry (optional)</span>
            <input
              type="date"
              min={new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              className="form-input"
            />
          </label>
          {error && <p role="alert" className="sm:col-span-2 text-sm text-danger">{error}</p>}
          <button disabled={!businessVerified || loading || !partnerId} className="rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2 sm:justify-self-start">
            {loading ? "Saving permission…" : "Grant access"}
          </button>
          {!partners.data?.data.length && <p className="text-sm text-muted">There are no active Funding Partners to share with.</p>}
        </form>
      </section>
      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="mb-3 font-bold">Sharing history</h2>
        {shares.error && <p role="alert" className="text-sm text-danger">{shares.error}</p>}
        {!shares.data?.data.length && <p className="py-4 text-sm text-muted">No sharing permissions have been granted.</p>}
        {shares.data?.data.map((share) => (
          <div key={share.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-4">
            <div>
              <p className="font-semibold">{share.partner}</p>
              <p className="mt-1 text-xs text-muted">{share.email} · Granted {dateLabel(share.createdAt)} · {share.expiresAt ? `Expires ${dateLabel(share.expiresAt)}` : "No expiry"}</p>
              {share.revoked && <p className="mt-1 text-xs font-semibold text-danger">Revoked</p>}
            </div>
            {!share.revoked && <button onClick={() => void revoke(share.id)} className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-danger">Revoke access</button>}
          </div>
        ))}
      </section>
    </AppShell>
  )
}
