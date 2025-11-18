"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { useOpenSideBarMenu } from "@/app/store/ui-variables";
import { useCurrentUser } from "@/app/store/drive-variables";
import SettingsPage from "./settings-page";
import type { User } from "@/lib/types";

export default function Page() {
  const IsOpenSideBarMenu = useOpenSideBarMenu((state) => state.open);
  const setOpenSideBarMenu = useOpenSideBarMenu((state) => state.setOpen);
  const router = useRouter();
  const setCurrentUser = useCurrentUser((state) => state.setUser);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/users/me", { cache: "no-store" });
        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch user data");
        }

        const data = await response.json();
        const fetchedUser: User | undefined = data?.user;
        if (fetchedUser) {
          setUser(fetchedUser);
          setCurrentUser({
            ...fetchedUser,
            password: "",
            createdAt: new Date(fetchedUser.createdAt),
            updatedAt: new Date(fetchedUser.updatedAt),
          });
        } else {
          setError("Failed to parse user data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <div className='flex h-screen font-mono'>
        <Sidebar
          isOpen={IsOpenSideBarMenu}
          onClose={() => setOpenSideBarMenu(false)}
        />
        {IsOpenSideBarMenu && (
          <div
            className='fixed inset-0 bg-black/30 md:hidden z-40'
            onClick={() => setOpenSideBarMenu(false)}
            aria-hidden='true'
          />
        )}
        <div className='flex-1 md:ml-0'>
          <div className='flex-1 h-screen flex flex-col'>
            <TopNav />
            <div className='flex-1 overflow-auto p-4 md:p-6'>
              <SettingsPage user={user} loading={loading} error={error} />
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
