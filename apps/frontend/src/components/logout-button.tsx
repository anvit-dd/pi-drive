"use client";

import { Button } from "@radix-ui/themes";

export function LogoutButton() {
  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        document.cookie =
          "client-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        localStorage.clear();
        sessionStorage.clear();

        window.location.href = "/login";
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/login";
    }
  };

  return (
    <Button className="!font-sans" variant="surface" onClick={logout}>
      Logout
    </Button>
  );
}
