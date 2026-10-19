import { createBrowserRouter, Navigate } from "react-router"
import { MarketingPage } from "../pages/MarketingPage"
import { LoginPage } from "../pages/LoginPage"
import { RoleDashboard, RoleRedirect, SectionRouter } from "../pages/RolePages"
import { RequireAuth } from "../auth/auth"
import { RequireRoleAccess } from "../auth/auth"
import { AcceptInvitationPage } from "../pages/AcceptInvitationPage"
import { CreatePasswordPage } from "../pages/CreatePasswordPage"
import { OwnerRegistrationPage } from "../pages/OwnerRegistrationPage"
import { RegistrationPendingPage } from "../pages/RegistrationPendingPage"
import { VerifyEmailPage } from "../pages/VerifyEmailPage"
import { AddAccountantPage, OwnerTeamPage } from "../pages/OnboardingPages"
import { RequestPasswordResetPage, ResetPasswordPage } from "../pages/PasswordResetPages"
import { BusinessVerificationPage } from "../pages/BusinessVerificationPages"

export const router = createBrowserRouter([
  { path: "/", Component: MarketingPage },
  { path: "/login", Component: LoginPage },
  { path: "/register", Component: OwnerRegistrationPage },
  { path: "/verify-email", Component: VerifyEmailPage },
  { path: "/create-password", Component: CreatePasswordPage },
  { path: "/registration-pending", Component: RegistrationPendingPage },
  { path: "/accept-invitation", Component: AcceptInvitationPage },
  { path: "/forgot-password", Component: RequestPasswordResetPage },
  { path: "/reset-password", Component: ResetPasswordPage },
  {
    path: "/app/settings/team",
    element: (
      <RequireAuth>
        <RequireRoleAccess role="owner">
        <OwnerTeamPage />
        </RequireRoleAccess>
      </RequireAuth>
    ),
  },
  {
    path: "/app/settings/team/add-accountant",
    element: (
      <RequireAuth>
        <RequireRoleAccess role="owner">
          <AddAccountantPage />
        </RequireRoleAccess>
      </RequireAuth>
    ),
  },
  {
    path: "/app/settings/business-verification",
    element: (
      <RequireAuth>
        <RequireRoleAccess role="owner">
          <BusinessVerificationPage />
        </RequireRoleAccess>
      </RequireAuth>
    ),
  },
  {
    path: "/app/dashboard",
    element: (
      <RequireAuth>
        <RoleRedirect />
      </RequireAuth>
    ),
  },
  {
    path: "/funding/dashboard",
    element: (
      <RequireAuth>
        <RequireRoleAccess role="funder">
          <RoleDashboard role="funder" />
        </RequireRoleAccess>
      </RequireAuth>
    ),
  },
  ...(["owner", "accountant", "funder", "admin"] as const).map((role) => ({
    path: `/app/${role}`,
    element: (
      <RequireAuth>
        <RoleDashboard role={role} />
      </RequireAuth>
    ),
  })),
  {
    path: "/app/:section",
    element: (
      <RequireAuth>
        <SectionRouter />
      </RequireAuth>
    ),
  },
  { path: "/404", element: <Navigate to="/" replace /> },
  { path: "*", element: <Navigate to="/404" replace /> },
])
