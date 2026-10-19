import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import { api } from "../api"
import { Brand } from "../components/Brand"

const provinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
]

const businessTypes = [
  ["SOLE_PROPRIETOR", "Sole proprietor"],
  ["PRIVATE_COMPANY", "Private company"],
  ["PARTNERSHIP", "Partnership"],
  ["COOPERATIVE", "Cooperative"],
  ["NON_PROFIT", "Non-profit organisation"],
  ["OTHER", "Other"],
]

export function OwnerRegistrationPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [registrationStatus, setRegistrationStatus] = useState<"REGISTERED" | "UNREGISTERED">("REGISTERED")

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setLoading(true)
    const form = new FormData(event.currentTarget)
    const value = (name: string) => String(form.get(name) ?? "").trim()
    try {
      await api("/auth/register-owner", {
        method: "POST",
        body: {
          firstName: value("firstName"),
          lastName: value("lastName"),
          phone: value("phone"),
          email: value("email"),
          legalName: value("legalName") || undefined,
          tradingName: value("tradingName") || undefined,
          businessType: value("businessType"),
          industry: value("industry"),
          registrationStatus,
          registrationNumber: value("registrationNumber") || undefined,
          applicantRelationship: registrationStatus === "UNREGISTERED"
            ? "UNREGISTERED_OWNER"
            : value("applicantRelationship"),
          authorityDescription: value("authorityDescription"),
          address: value("address"),
          province: value("province"),
          municipality: value("municipality"),
          description: value("description"),
          website: value("website") || undefined,
          termsAccepted: form.get("termsAccepted") === "on",
          privacyAcknowledged: form.get("privacyAcknowledged") === "on",
        },
      })
      navigate("/registration-pending", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration could not be submitted")
      setLoading(false)
    }
  }

  const fieldClass = "form-input"
  const labelClass = "form-label"

  return (
    <main className="min-h-screen bg-canvas px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <Brand />
          <Link to="/login" className="text-sm font-semibold text-brand-blue">Already registered? Log in</Link>
        </div>
        <section className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-10">
          <p className="eyebrow">Business owner registration</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Create your business account.</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Register as a Business Owner. You’ll verify your email and create a password after submitting.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-8">
            <fieldset className="grid gap-5 sm:grid-cols-2">
              <legend className="mb-4 text-base font-bold">Personal information</legend>
              <label className="block">
                <span className={labelClass}>First name</span>
                <input name="firstName" autoComplete="given-name" required maxLength={80} className={fieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Last name</span>
                <input name="lastName" autoComplete="family-name" required maxLength={80} className={fieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Email address</span>
                <input name="email" type="email" autoComplete="email" required maxLength={254} className={fieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Contact number</span>
                <input name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={30} className={fieldClass} />
              </label>
            </fieldset>

            <fieldset className="grid gap-5 sm:grid-cols-2">
              <legend className="mb-4 text-base font-bold">Business information</legend>
              <label className="block">
                <span className={labelClass}>Legal business name</span>
                <input name="legalName" autoComplete="organization" maxLength={160} className={fieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Trading name</span>
                <input name="tradingName" maxLength={160} className={fieldClass} />
                <span className="mt-1 block text-xs text-muted">Enter at least a legal or trading name.</span>
              </label>
              <label className="block">
                <span className={labelClass}>Business type</span>
                <select name="businessType" required className={fieldClass}>
                  {businessTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Industry</span>
                <input name="industry" required minLength={2} maxLength={100} className={fieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Business registration status</span>
                <select
                  value={registrationStatus}
                  onChange={(event) => setRegistrationStatus(event.target.value as "REGISTERED" | "UNREGISTERED")}
                  className={fieldClass}
                >
                  <option value="REGISTERED">Registered</option>
                  <option value="UNREGISTERED">Not registered / not applicable</option>
                </select>
              </label>
              {registrationStatus === "REGISTERED" && (
                <label className="block">
                  <span className={labelClass}>CIPC registration number (if applicable)</span>
                  <input name="registrationNumber" maxLength={80} className={fieldClass} />
                </label>
              )}
              {registrationStatus === "REGISTERED" && (
                <label className="block">
                  <span className={labelClass}>Your relationship to the business</span>
                  <select name="applicantRelationship" required className={fieldClass}>
                    <option value="DIRECTOR">Director</option>
                    <option value="OWNER_PROPRIETOR">Owner or proprietor</option>
                    <option value="AUTHORIZED_REPRESENTATIVE">Authorised representative</option>
                    <option value="OTHER_AUTHORIZED_ROLE">Other authorised role</option>
                  </select>
                </label>
              )}
              <label className="block sm:col-span-2">
                <span className={labelClass}>How are you authorised to represent this business?</span>
                <textarea
                  name="authorityDescription"
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={3}
                  className={fieldClass}
                  placeholder="Describe your role. This statement is not proof of authority; supporting evidence may be requested."
                />
              </label>
              <label className="block">
                <span className={labelClass}>Business address</span>
                <input name="address" autoComplete="street-address" required minLength={4} maxLength={300} className={fieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Province</span>
                <select name="province" required defaultValue="" className={fieldClass}>
                  <option value="" disabled>Select a province</option>
                  {provinces.map((province) => <option key={province}>{province}</option>)}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Municipality</span>
                <input name="municipality" required minLength={2} maxLength={100} className={fieldClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Business website (optional)</span>
                <input name="website" type="url" maxLength={300} placeholder="https://" className={fieldClass} />
              </label>
              <label className="block sm:col-span-2">
                <span className={labelClass}>Business description</span>
                <textarea name="description" required minLength={10} maxLength={2000} rows={4} className={fieldClass} />
              </label>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="mb-4 text-base font-bold">Acknowledgements</legend>
              <label className="flex items-start gap-3 text-sm leading-6 text-muted">
                <input name="termsAccepted" type="checkbox" required className="mt-1 accent-brand-blue" />
                <span>I accept the Terms of Service.</span>
              </label>
              <label className="flex items-start gap-3 text-sm leading-6 text-muted">
                <input name="privacyAcknowledged" type="checkbox" required className="mt-1 accent-brand-blue" />
                <span>I acknowledge the Privacy Policy and consent to the processing of my registration information.</span>
              </label>
            </fieldset>

            {error && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
            <button
              disabled={loading}
              className="w-full rounded-xl bg-brand px-5 py-3.5 text-sm font-bold text-white disabled:opacity-60 sm:w-auto"
            >
              {loading ? "Submitting registration…" : "Submit registration"}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
