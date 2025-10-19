"use client";

import { useEffect, useCallback, useMemo } from "react";
import {
	useLoadingDirectory,
	useSelectedItems,
} from "../store/drive-variables";
import { client_ax } from "@/lib/axios";
import type { ContentItem } from "@/lib/types";

let globalLastFetchSig: string | null = null;

export function useFetchSharedDirectoryItems(
	linkId: string,
	password?: string,
	currentPath?: string,
	onItemsChange?: (items: ContentItem[]) => void,
	onLoadingChange?: (loading: boolean) => void
) {
	const setSelectedItems = useSelectedItems((state) => state.setSelectedItems);
	const setIsLoading = useLoadingDirectory((state) => state.setIsLoading);

	const setDirContents = useMemo(
		() => onItemsChange || (() => {}),
		[onItemsChange]
	);
	const setLoading = useMemo(
		() => onLoadingChange || setIsLoading,
		[onLoadingChange, setIsLoading]
	);

	useEffect(() => {
		const sig = `${linkId}|${password || ""}|${currentPath || ""}`;

		if (globalLastFetchSig === sig) {
			return;
		}

		globalLastFetchSig = sig;
		setDirContents([]);
		setSelectedItems(new Set([]));
		let isCancelled = false;

		const fetchData = async () => {
			setLoading(true);

			try {
				const params = new URLSearchParams();
				params.set("linkId", linkId);
				if (password) {
					params.set("password", password);
				}
				if (currentPath) {
					params.set("currentPath", currentPath);
				}

				const response = await client_ax.get(
					`/api/share/contents?${params.toString()}`
				);

				if (isCancelled) {
					return;
				}

				const data = response.data;
				setDirContents(data.contents);
			} catch (error) {
				if (isCancelled) return;
				console.error("Failed to fetch shared directory contents:", error);
				setDirContents([]);
			} finally {
				if (!isCancelled) {
					setLoading(false);
				}
			}
		};

		fetchData();

		return () => {
			isCancelled = true;
		};
	}, [
		linkId,
		password,
		currentPath,
		setDirContents,
		setSelectedItems,
		setIsLoading,
		setLoading,
	]);

	const manualRefresh = useCallback(() => {
		globalLastFetchSig = null;

		setDirContents([]);
		setSelectedItems(new Set([]));

		let isCancelled = false;

		const fetchData = async () => {
			setLoading(true);

			try {
				const params = new URLSearchParams();
				params.set("linkId", linkId);
				if (password) {
					params.set("password", password);
				}
				if (currentPath) {
					params.set("currentPath", currentPath);
				}

				const response = await client_ax.get(
					`/api/share/contents?${params.toString()}`
				);

				if (isCancelled) {
					return;
				}

				const data = response.data;
				setDirContents(data.contents);
				console.log("Manual refresh completed for shared folder:", linkId);
			} catch (error) {
				if (isCancelled) return;
				console.error("Failed to fetch shared directory contents:", error);
				setDirContents([]);
			} finally {
				if (!isCancelled) {
					setLoading(false);
				}
			}
		};

		fetchData();

		return () => {
			isCancelled = true;
		};
	}, [
		linkId,
		password,
		currentPath,
		setDirContents,
		setSelectedItems,
		setLoading,
	]);

	return {
		manualRefresh,
	};
}
