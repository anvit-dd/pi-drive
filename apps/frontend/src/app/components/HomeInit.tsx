"use client";
import { useEffect, useCallback, useRef } from "react";
import { useCurrentUser, useTotalStorage } from "@/app/store/drive-variables";
import { useCurrentDir } from "@/app/store/drive-variables";
import { usePathname, useRouter } from "next/navigation";
import getDirectoryPath from "@/lib/getDirPath";
import type { User } from "@/lib/types";

interface HomeInitializerProps {
	currUser: User;
	initialStorage?: number;
	children: React.ReactNode;
}

export default function HomeInit({
	currUser,
	initialStorage,
	children,
}: HomeInitializerProps) {
	const currentUser = useCurrentUser((state) => state.user);
	const initializeUser = useCurrentUser((state) => state.setUser);
	const currentStorage = useTotalStorage((state) => state.currStorage);
	const initializeStorage = useTotalStorage((state) => state.setCurrentStorage);

	// Directory <-> URL sync
	const currDir = useCurrentDir((state) => state.dir);
	const setDir = useCurrentDir((state) => state.setDir);
	const pathname = usePathname();
	const router = useRouter();

	const normalizePath = useCallback((p: string) => p.replace(/\/$/, ""), []);

	const pathToDir = useCallback((path: string) => {
		const afterHome = path.replace(/^\/home\/?/, "");
		if (!afterHome) return "Home";
		const decoded = afterHome
			.split("/")
			.filter(Boolean)
			.map((seg) => {
				try {
					return decodeURIComponent(seg);
				} catch {
					return seg;
				}
			})
			.join("/");
		return decoded ? `Home/${decoded}` : "Home";
	}, []);

	const didHydrateFromUrlRef = useRef(false);
	const isInitialMountRef = useRef(true);

	// First effect: Sync URL -> Dir (only on pathname changes)
	useEffect(() => {
		if (!pathname) return;
		const dirFromPath = pathToDir(pathname);

		// On initial mount, hydrate from URL
		if (isInitialMountRef.current) {
			isInitialMountRef.current = false;
			if (dirFromPath !== currDir) {
				setDir(dirFromPath);
			}
			didHydrateFromUrlRef.current = true;
			return;
		}

		// On subsequent pathname changes (browser back/forward)
		if (dirFromPath !== currDir) {
			setDir(dirFromPath);
		}
	}, [pathname, pathToDir, setDir, currDir]);

	// Second effect: Sync Dir -> URL (only on programmatic directory changes)
	useEffect(() => {
		if (!pathname) return;
		if (!didHydrateFromUrlRef.current) return;
		if (isInitialMountRef.current) return;

		const dirFromPath = pathToDir(pathname);
		if (dirFromPath === currDir) return;

		const target = getDirectoryPath(currDir);
		if (normalizePath(target) !== normalizePath(pathname)) {
			router.push(target);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currDir]);

	useEffect(() => {
		if (currUser && !currentUser) {
			initializeUser(currUser);
		}
		if (initialStorage !== undefined && currentStorage === 0) {
			initializeStorage(initialStorage);
		}
	}, [
		currUser,
		initialStorage,
		currentUser,
		currentStorage,
		initializeUser,
		initializeStorage,
	]);

	return <>{children}</>;
}
