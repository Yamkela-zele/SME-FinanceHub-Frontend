import { useEffect, useState, type FormEvent } from "react"
import { AppShell } from "../components/AppShell"
import { api, apiFile, apiUpload } from "../api"
import { useApi } from "../useApi"

type Evidence = {
  id: string
  category: string
  originalName: string
  mimeType: string
  sizeBytes: number
  uploadedAt: string
  uploadedBy: string
  isCurrentSubmission: boolean
}

type VerificationCase = {
  id: string
  providerReference: string
  registrationNumber: string | null
  submittedBusinessName: string
  businessType: string
  registrationStatus: string
  applicantRelationship: string
  authorityDescription: string
  businessVerificationStatus: string
  representativeVerificationStatus: string
  overallStatus: string
  reviewReason: string | null
  createdAt: string
  reviewedAt: string | null
  reviewedBy: { name: string } | null
  applicant: { id: string; name: string; email: string }
  business: { name: string; registrationStatus: string; verificationStatus: string }
  evidence: Evidence[]
  events: { id: string; action: string; reason: string | null; actor: string; createdAt: string }[]
}

type CurrentBusiness = {
  business: {
    name: string
    businessType: string | null
    registrationStatus: string | null
    registrationNumber: string | null
    ownerRelationship: string | null
    ownerAuthorityDescription: string | null
  }
  verification: VerificationCase | null
  overallStatus: string
}

const statusLabels: Record<string, string> = {
  NOT_SUBMITTED: "Not submitted",
  PENDING_VERIFICATION: "Pending verification",
  VERIFICATION_IN_PROGRESS: "Manual review in progress",
  AUTOMATICALLY_VERIFIED: "Automatically verified",
  MANUALLY_VERIFIED: "Manually verified",
  VERIFIED_WITH_LIMITATIONS: "Verified with limitations",
  PENDING_MANUAL_REVIEW: "Pending manual review",
  ADDITIONAL_INFORMATION_REQUIRED: "Additional information required",
  UNABLE_TO_VERIFY: "Unable to verify automatically",
  VERIFICATION_FAILED: "Verification failed",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
}

const statusMessage = (status: string) => {
  if (status === "AUTOMATICALLY_VERIFIED" || status === "MANUALLY_VERIFIED") {
    return "Your business registration and required representative checks have been verified."
  }
  if (status === "VERIFIED_WITH_LIMITATIONS") {
    return "The alternative route for this unregistered business has been reviewed. CIPC-specific verification is not applicable."
  }
  if (status === "ADDITIONAL_INFORMATION_REQUIRED") return "More information is required. Review the administrator's reason and provide the requested evidence."
  if (status === "REJECTED") return "Your verification request was not approved. Review the reason and submit corrected information if appropriate."
  if (status === "UNABLE_TO_VERIFY" || status === "VERIFICATION_FAILED") {
    return "Automated verification is unavailable in this deployment. You may request manual review with supporting evidence."
  }
  if (status === "PENDING_MANUAL_REVIEW" || status === "VERIFICATION_IN_PROGRESS") {
    return "This request is being reviewed manually. A claimed role or matching business name is not accepted as proof on its own."
  }
  return "Verify your business to access features that require a verified business profile."
}

const pretty = (value: string) =>
  statusLabels[value] ?? value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
const dateLabel = (value: string) => new Date(value).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })

async function downloadEvidence(verificationId: string, evidence: Evidence) {
  const blob = await apiFile(`/business-verifications/${verificationId}/evidence/${evidence.id}`)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `verification-evidence-${evidence.id}`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function BusinessVerificationPage() {
  const { data, error, reload } = useApi<{ data: CurrentBusiness }>("/business-verifications/current-business")
  const [form, setForm] = useState({
    registrationStatus: "REGISTERED",
    registrationNumber: "",
    submittedBusinessName: "",
    businessType: "PRIVATE_COMPANY",
    applicantRelationship: "DIRECTOR",
    authorityDescription: "",
    consentAccepted: false,
  })
  const [category, setCategory] = useState("REGISTRATION")
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState("")
  const [message, setMessage] = useState("")
  const current = data?.data
  const verification = current?.verification ?? null
  const status = current?.overallStatus ?? "NOT_SUBMITTED"
  const canSubmit = !verification || [
    "ADDITIONAL_INFORMATION_REQUIRED",
    "UNABLE_TO_VERIFY",
    "VERIFICATION_FAILED",
    "REJECTED",
    "EXPIRED",
  ].includes(status)

  useEffect(() => {
    if (!current) return
    setForm((previous) => ({
      ...previous,
      registrationStatus: current.business.registrationStatus ?? "REGISTERED",
      registrationNumber: current.business.registrationNumber ?? "",
      submittedBusinessName: current.business.name,
      businessType: current.business.businessType ?? "OTHER",
      applicantRelationship: current.business.ownerRelationship ?? "DIRECTOR",
      authorityDescription: current.business.ownerAuthorityDescription ?? "",
    }))
  }, [current])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setActionError("")
    setMessage("")
    setBusy(true)
    try {
      await api("/business-verifications", {
        method: "POST",
        body: {
          ...form,
          registrationNumber: form.registrationStatus === "REGISTERED" ? form.registrationNumber : undefined,
          applicantRelationship: form.registrationStatus === "UNREGISTERED" ? "UNREGISTERED_OWNER" : form.applicantRelationship,
        },
      })
      setMessage("Verification request submitted for manual review.")
      await reload()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Verification request could not be submitted.")
    } finally {
      setBusy(false)
    }
  }

  const upload = async (event: FormEvent) => {
    event.preventDefault()
    if (!verification || !file) return
    setActionError("")
    setBusy(true)
    try {
      const formData = new FormData()
      formData.set("category", category)
      formData.set("file", file)
      await apiUpload(`/business-verifications/${verification.id}/evidence`, formData)
      setFile(null)
      setMessage("Evidence uploaded securely and queued for review.")
      await reload()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Evidence could not be uploaded.")
    } finally {
      setBusy(false)
    }
  }

  const retry = async () => {
    if (!verification) return
    setActionError("")
    setBusy(true)
    try {
      await api(`/business-verifications/${verification.id}/retry`, { method: "POST" })
      setMessage("The request was returned to the manual review queue.")
      await reload()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Review could not be restarted.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-5">
        <section className="rounded-2xl border border-line bg-white p-6">
          <p className="eyebrow">Business profile assurance</p>
          <h2 className="mt-2 text-xl font-bold">{current?.business.name ?? "Business verification"}</h2>
          <div className="mt-4 rounded-xl border border-line bg-canvas p-4">
            <p className="font-semibold">Status: {pretty(status)}</p>
            <p className="mt-1 text-sm leading-6 text-muted">{statusMessage(status)}</p>
            {verification?.reviewReason && <p className="mt-3 text-sm"><span className="font-semibold">Review note:</span> {verification.reviewReason}</p>}
            {verification && <p className="mt-2 text-xs text-muted">Reference {verification.providerReference} · Submitted {dateLabel(verification.createdAt)}</p>}
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">
            We use your business registration information and any supporting evidence to assess whether the business exists and whether you are authorised to represent it. These are separate checks. Email verification only confirms access to your email address. Documents are encrypted in private storage and are accessible only to you and authorised administrators.
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            No authorised CIPC provider is configured here. Registered businesses are therefore sent to manual review; an entered name or registration number alone never establishes verification. Unregistered businesses use a separate alternative-evidence route and are labelled as verified with limitations.
          </p>
        </section>

        {error && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
        {actionError && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{actionError}</p>}
        {message && <p role="status" className="rounded-xl bg-green-soft p-3 text-sm text-accent">{message}</p>}

        {canSubmit && (
          <section className="rounded-2xl border border-line bg-white p-6">
            <h2 className="font-bold">{verification ? "Correct and resubmit details" : "Submit business details for review"}</h2>
            <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="form-label">Registration route</span>
                <select value={form.registrationStatus} onChange={(event) => setForm({ ...form, registrationStatus: event.target.value })} className="form-input">
                  <option value="REGISTERED">Registered business</option>
                  <option value="UNREGISTERED">Unregistered / CIPC not applicable</option>
                </select>
              </label>
              {form.registrationStatus === "REGISTERED" && (
                <label className="block">
                  <span className="form-label">Registration number</span>
                  <input required maxLength={80} value={form.registrationNumber} onChange={(event) => setForm({ ...form, registrationNumber: event.target.value })} className="form-input" />
                </label>
              )}
              <label className="block">
                <span className="form-label">Business legal name</span>
                <input required minLength={2} maxLength={160} value={form.submittedBusinessName} onChange={(event) => setForm({ ...form, submittedBusinessName: event.target.value })} className="form-input" />
              </label>
              <label className="block">
                <span className="form-label">Business type</span>
                <input required minLength={2} maxLength={100} value={form.businessType} onChange={(event) => setForm({ ...form, businessType: event.target.value })} className="form-input" />
              </label>
              {form.registrationStatus === "REGISTERED" && (
                <label className="block">
                  <span className="form-label">Your relationship to the business</span>
                  <select value={form.applicantRelationship} onChange={(event) => setForm({ ...form, applicantRelationship: event.target.value })} className="form-input">
                    <option value="DIRECTOR">Director</option>
                    <option value="OWNER_PROPRIETOR">Owner or proprietor</option>
                    <option value="AUTHORIZED_REPRESENTATIVE">Authorised representative</option>
                    <option value="OTHER_AUTHORIZED_ROLE">Other authorised role</option>
                  </select>
                </label>
              )}
              <label className="block sm:col-span-2">
                <span className="form-label">How are you authorised to represent this business?</span>
                <textarea required minLength={10} maxLength={1000} rows={3} value={form.authorityDescription} onChange={(event) => setForm({ ...form, authorityDescription: event.target.value })} className="form-input" />
              </label>
              <label className="flex items-start gap-3 text-sm leading-5 sm:col-span-2">
                <input required type="checkbox" checked={form.consentAccepted} onChange={(event) => setForm({ ...form, consentAccepted: event.target.checked })} className="mt-1" />
                <span>I consent to this information and supporting evidence being used for business and representative-authority verification, and acknowledge the privacy notice above.</span>
              </label>
              <button disabled={busy} className="rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2 sm:justify-self-start">
                {busy ? "Submitting…" : verification ? "Correct details and resubmit" : "Start verification"}
              </button>
            </form>
          </section>
        )}

        {verification && !["MANUALLY_VERIFIED", "AUTOMATICALLY_VERIFIED", "VERIFIED_WITH_LIMITATIONS"].includes(status) && (
          <section className="rounded-2xl border border-line bg-white p-6">
            <h2 className="font-bold">Supporting evidence</h2>
            <p className="mt-1 text-sm text-muted">PDF, PNG and JPEG files up to 10 MB are encrypted before being saved outside the public web directory.</p>
            <form onSubmit={upload} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]">
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="form-input">
                <option value="REGISTRATION">Business registration evidence</option>
                <option value="AUTHORITY">Representative authority evidence</option>
                <option value="BUSINESS_ALTERNATIVE">Alternative evidence for an unregistered business</option>
              </select>
              <input type="file" required accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="form-input" />
              <button disabled={busy || !file} className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-60">Upload evidence</button>
            </form>
            {verification.evidence.length > 0 && (
              <ul className="mt-4 divide-y divide-line">
                {verification.evidence.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span>{pretty(item.category)} · {item.originalName} · {(item.sizeBytes / 1024 / 1024).toFixed(1)} MB{item.isCurrentSubmission ? "" : " · Superseded by a later submission"}</span>
                    <button onClick={() => void downloadEvidence(verification.id, item).catch((cause) => setActionError(cause instanceof Error ? cause.message : "Evidence could not be downloaded."))} className="font-bold text-brand-blue">Download</button>
                  </li>
                ))}
              </ul>
            )}
            {["UNABLE_TO_VERIFY", "VERIFICATION_FAILED", "EXPIRED"].includes(status) && (
              <button onClick={() => void retry()} disabled={busy} className="mt-4 rounded-xl border border-line px-4 py-2 text-sm font-bold disabled:opacity-60">Request manual review</button>
            )}
          </section>
        )}

        {verification && (
          <section className="rounded-2xl border border-line bg-white p-6">
            <h2 className="font-bold">Verification history</h2>
            <div className="mt-3 space-y-3">
              {verification.events.map((event) => (
                <div key={event.id} className="border-l-2 border-line pl-3 text-sm">
                  <p className="font-semibold">{pretty(event.action)} <span className="font-normal text-muted">· {event.actor}</span></p>
                  <p className="text-xs text-muted">{dateLabel(event.createdAt)}{event.reason ? ` · ${event.reason}` : ""}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}

export function AdminBusinessVerificationPage() {
  const [statusFilter, setStatusFilter] = useState("")
  const path = `/admin/business-verifications${statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : ""}`
  const { data, error, reload } = useApi<{ data: VerificationCase[]; total: number }>(path)
  const [selected, setSelected] = useState<VerificationCase | null>(null)
  const [reviewReason, setReviewReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState("")
  const cases = data?.data ?? []

  useEffect(() => {
    if (!selected) return
    api<{ data: VerificationCase }>(`/business-verifications/${selected.id}`)
      .then((response) => setSelected(response.data))
      .catch((cause) => setActionError(cause instanceof Error ? cause.message : "Verification details could not be loaded."))
  }, [selected?.id])

  const runAction = async (action: string) => {
    if (!selected) return
    setActionError("")
    setBusy(true)
    try {
      const response = await api<{ data: VerificationCase }>(`/admin/business-verifications/${selected.id}/${action}`, {
        method: "POST",
        body: { reason: reviewReason },
      })
      setSelected(response.data)
      setReviewReason("")
      await reload()
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Verification decision could not be recorded.")
    } finally {
      setBusy(false)
    }
  }

  const filterOptions = [
    ["", "All statuses"],
    ["PENDING_MANUAL_REVIEW", "Pending manual review"],
    ["VERIFICATION_IN_PROGRESS", "In progress"],
    ["ADDITIONAL_INFORMATION_REQUIRED", "Additional information required"],
    ["AUTOMATICALLY_VERIFIED", "Automatically verified"],
    ["MANUALLY_VERIFIED", "Manually verified"],
    ["VERIFIED_WITH_LIMITATIONS", "Verified with limitations"],
    ["UNABLE_TO_VERIFY", "Unable to verify"],
    ["VERIFICATION_FAILED", "Failed"],
    ["REJECTED", "Rejected"],
    ["EXPIRED", "Expired"],
  ]

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-5">
          <div><h2 className="font-bold">Business verification queue</h2><p className="mt-1 text-sm text-muted">{data?.total ?? 0} verification cases · no automated CIPC provider is configured</p></div>
          <select value={statusFilter} onChange={(event) => { setSelected(null); setStatusFilter(event.target.value) }} className="form-input w-auto">
            {filterOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </section>
        {error && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
        {actionError && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{actionError}</p>}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <section className="rounded-2xl border border-line bg-white p-4">
            {cases.length === 0 && <p className="py-6 text-sm text-muted">No verification cases match this filter.</p>}
            <ul className="divide-y divide-line">
              {cases.map((item) => (
                <li key={item.id}>
                  <button onClick={() => setSelected(item)} className={`w-full rounded-lg p-3 text-left ${selected?.id === item.id ? "bg-canvas" : "hover:bg-canvas"}`}>
                    <span className="block font-semibold">{item.submittedBusinessName}</span>
                    <span className="mt-1 block text-xs text-muted">{item.applicant.name} · {item.registrationNumber ?? "No CIPC registration number"} · {dateLabel(item.createdAt)}</span>
                    <span className="mt-2 inline-flex rounded-full bg-blue-soft px-2.5 py-1 text-[11px] font-bold text-brand-blue">{pretty(item.overallStatus)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {selected ? (
            <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Reference {selected.providerReference}</p>
                <h2 className="mt-1 text-xl font-bold">{selected.submittedBusinessName}</h2>
                <p className="mt-1 text-sm text-muted">Applicant: {selected.applicant.name} · {selected.applicant.email}</p>
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted">Registration no.</dt><dd className="font-semibold">{selected.registrationNumber ?? "Not applicable"}</dd></div>
                <div><dt className="text-muted">Business check</dt><dd className="font-semibold">{pretty(selected.businessVerificationStatus)}</dd></div>
                <div><dt className="text-muted">Representative check</dt><dd className="font-semibold">{pretty(selected.representativeVerificationStatus)}</dd></div>
                <div><dt className="text-muted">Assigned reviewer</dt><dd className="font-semibold">{selected.reviewedBy?.name ?? "Unassigned"}</dd></div>
                <div className="sm:col-span-2"><dt className="text-muted">Applicant's claimed relationship and statement</dt><dd className="mt-1">{pretty(selected.applicantRelationship)} · {selected.authorityDescription}</dd></div>
                <div className="sm:col-span-2"><dt className="text-muted">Status / decision reason</dt><dd className="mt-1">{pretty(selected.overallStatus)}{selected.reviewReason ? ` · ${selected.reviewReason}` : ""}</dd></div>
              </dl>
              <div>
                <h3 className="font-semibold">Protected supporting evidence</h3>
                {selected.evidence.length === 0 && <p className="mt-2 text-sm text-muted">No evidence uploaded.</p>}
                <ul className="mt-2 space-y-2">
                  {selected.evidence.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span>{pretty(item.category)} · {item.originalName} · uploaded by {item.uploadedBy}{item.isCurrentSubmission ? "" : " · superseded evidence"}</span>
                      <button onClick={() => void downloadEvidence(selected.id, item).catch((cause) => setActionError(cause instanceof Error ? cause.message : "Evidence could not be downloaded."))} className="font-bold text-brand-blue">Download</button>
                    </li>
                  ))}
                </ul>
              </div>
              {selected.events.length > 0 && (
                <div>
                  <h3 className="font-semibold">Audit history</h3>
                  <ul className="mt-2 space-y-2 text-xs text-muted">
                    {selected.events.map((event) => <li key={event.id}>{dateLabel(event.createdAt)} · {event.actor} · {pretty(event.action)}{event.reason ? ` · ${event.reason}` : ""}</li>)}
                  </ul>
                </div>
              )}
              {["PENDING_MANUAL_REVIEW", "VERIFICATION_IN_PROGRESS", "ADDITIONAL_INFORMATION_REQUIRED"].includes(selected.overallStatus) && (
                <div className="space-y-3 border-t border-line pt-4">
                  <label className="block">
                    <span className="form-label">Decision / review note (required)</span>
                    <textarea value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} minLength={5} maxLength={2000} rows={3} className="form-input" />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selected.overallStatus === "PENDING_MANUAL_REVIEW" && <button disabled={busy || reviewReason.trim().length < 5} onClick={() => void runAction("start-review")} className="rounded-lg border border-line px-3 py-2 text-xs font-bold disabled:opacity-50">Start review</button>}
                    {["PENDING_MANUAL_REVIEW", "VERIFICATION_IN_PROGRESS"].includes(selected.overallStatus) && (
                      <>
                        <button disabled={busy || reviewReason.trim().length < 5} onClick={() => void runAction("request-information")} className="rounded-lg border border-line px-3 py-2 text-xs font-bold disabled:opacity-50">Request information</button>
                        <button disabled={busy || reviewReason.trim().length < 5} onClick={() => void runAction("approve")} className="rounded-lg bg-green-soft px-3 py-2 text-xs font-bold text-accent disabled:opacity-50">Verify after evidence review</button>
                        <button disabled={busy || reviewReason.trim().length < 5} onClick={() => void runAction("reject")} className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-bold text-danger disabled:opacity-50">Reject</button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </section>
          ) : (
            <section className="grid min-h-56 place-items-center rounded-2xl border border-line bg-white p-5 text-sm text-muted">Select a verification case to review.</section>
          )}
        </div>
      </div>
    </AppShell>
  )
}
