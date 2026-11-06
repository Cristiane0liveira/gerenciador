import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const cookieName = "atlas_session";
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET deve ter pelo menos 32 caracteres.");
  return new TextEncoder().encode(value);
}

export type SessionUser = { id: string; name: string; email: string; role: "ADMIN" | "MEMBER" };

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.id || !payload.email || !payload.role || !payload.name) return null;
    return {
      id: String(payload.id), email: String(payload.email), name: String(payload.name),
      role: payload.role as "ADMIN" | "MEMBER"
    };
  } catch { return null; }
}

export async function destroySession() {
  const store = await cookies();
  store.delete(cookieName);
}
