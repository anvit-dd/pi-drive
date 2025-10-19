import { clearTokenFromCookie, type User } from "./auth";

export async function getCurrentUser(): Promise<User | null> {
  return null;
}

export async function signOut() {
  clearTokenFromCookie();
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
  }
}

export async function signInWithCredentials(
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  const data = await response.json();
  return data;
}

export { type User };
