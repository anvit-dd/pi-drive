"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCurrentDir } from "@/app/store/drive-variables";
import { useSharedItems } from "@/app/store/drive-variables";

export default function TitleManager() {
	const pathname = usePathname();
	const dir = useCurrentDir((state) => state.dir);
	const sharedCurrentDir = useSharedItems((state) => state.sharedCurrentDir);

	useEffect(() => {
		const isLogin = pathname?.startsWith("/login");
		const isShared = pathname?.startsWith("/s/");
		if (isLogin) {
			document.title = "Login | PiDrive";
		} else if (isShared) {
			const titleDir =
				sharedCurrentDir && sharedCurrentDir.trim()
					? sharedCurrentDir.split("/")[sharedCurrentDir.split("/").length - 1]
					: "Shared";
			document.title = `${titleDir} - Share | PiDrive`;
		} else {
			const titleDir =
				dir && dir.trim()
					? dir.split("/")[dir.split("/").length - 1]
					: "PiDrive";
			document.title = `${titleDir} | PiDrive`;
		}
	}, [dir, pathname, sharedCurrentDir]);

	return null;
}
