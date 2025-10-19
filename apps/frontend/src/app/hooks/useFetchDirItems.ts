"use client";

import { useEffect, useCallback, useRef } from "react";
import {
	useCurrentDir,
	useCurrentDirectoryItems,
	useLoadingDirectory,
	useSelectedItems,
} from "../store/drive-variables";
import { client_ax } from "@/lib/axios";
import { usePathname } from "next/navigation";

export function useFetchDirectoryItems() {
	const currDir = useCurrentDir((state) => state.dir);
	const refreshKey = useCurrentDir((state) => state.refreshKey);
	const pathname = usePathname();

	const setDirContents = useCurrentDirectoryItems((state) => state.setItems);
	const setSelectedItems = useSelectedItems((state) => state.setSelectedItems);
	const setIsLoading = useLoadingDirectory((state) => state.setIsLoading);

	const lastFetchSigRef = useRef<string | null>(null);

	useEffect(() => {
		if (pathname?.startsWith("/s/")) {
			return;
		}

		const sig = `${currDir}|${refreshKey}`;

		if (lastFetchSigRef.current === sig) {
			return;
		}

		lastFetchSigRef.current = sig;
		setDirContents([]);
		setSelectedItems(new Set([]));
		let isCancelled = false;

		const fetchData = async () => {
			setIsLoading(true);

			try {
				const response = await client_ax.get(
					`/api/directories?path=${encodeURIComponent(currDir)}`
				);

				if (isCancelled) {
					return;
				}

				const data = response.data;
				setDirContents(data.contents);
			} catch (error) {
				if (isCancelled) return;
				console.error("Failed to fetch directory contents:", error);
				setDirContents([]);
			} finally {
				if (!isCancelled) {
					setIsLoading(false);
				}
			}
		};

		fetchData();

		return () => {
			isCancelled = true;
		};
	}, [
		currDir,
		refreshKey,
		setDirContents,
		setSelectedItems,
		setIsLoading,
		pathname,
	]);

	const manualRefresh = useCallback(() => {
		lastFetchSigRef.current = null;

		setDirContents([]);
		setSelectedItems(new Set([]));

		let isCancelled = false;

		const fetchData = async () => {
			setIsLoading(true);

			try {
				const response = await client_ax.get(
					`/api/directories?path=${encodeURIComponent(currDir)}`
				);

				if (isCancelled) {
					return;
				}

				const data = response.data;
				setDirContents(data.contents);
				console.log("Manual refresh completed for:", currDir);
			} catch (error) {
				if (isCancelled) return;
				console.error("Failed to fetch directory contents:", error);
				setDirContents([]);
			} finally {
				if (!isCancelled) {
					setIsLoading(false);
				}
			}
		};

		fetchData();

		return () => {
			isCancelled = true;
		};
	}, [currDir, setDirContents, setSelectedItems, setIsLoading]);

	return {
		manualRefresh,
	};
}
