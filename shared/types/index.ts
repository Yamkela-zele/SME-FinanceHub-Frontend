export type Role = "owner" | "accountant" | "funder" | "admin"

export type PublicUser = {
  id: string
  name: string
  email: string
  role: Role
}

export type LoginResponse = { token: string; user: PublicUser }
