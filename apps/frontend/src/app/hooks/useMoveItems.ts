"use client";

import { useState, useCallback } from "react";
import { client_ax } from "@/lib/axios";
import {
	useCurrentDir,
	useCurrentDirectoryItems,
	useSelectedItems,
} from "../store/drive-variables";
import { useToast } from "@/components/useToast";

export function useMoveItems() {
	const [isMoving, setIsMoving] = useState(false);
	const currDir = useCurrentDir((s) => s.dir);
	const setItems = useCurrentDirectoryItems((s) => s.setItems);
	const setSelectedItems = useSelectedItems((s) => s.setSelectedItems);
	const { notify } = useToast();

	const moveItems = useCallback(
		async (sourceIds: string[], destinationDirId: string) => {
			if (!destinationDirId || sourceIds.length === 0) return;
			if (
				destinationDirId === currDir &&
				sourceIds.every(
					(id) =>
						id.startsWith(currDir + "/") &&
						id.split("/").length === currDir.split("/").length + 1
				)
			) {
			}

			setIsMoving(true);

			const prevItems = useCurrentDirectoryItems.getState().items;
			const prevSet = new Set(sourceIds);
			const removingFromCurrent = sourceIds.some(
				(id) => id.split("/").slice(0, -1).join("/") === currDir
			);

			if (removingFromCurrent) {
				const next = prevItems
					.filter((itm) => !prevSet.has(itm.id))
					.map((itm, idx) => ({ ...itm, order_no: idx }));
				setItems(next);
			}

			try {
				await client_ax.patch("/api/files/move", {
					items: sourceIds,
					destination: destinationDirId.replace(/\/+/g, "/"),
				});
				notify(
					"Moved Successfully!",
					`Moved ${sourceIds.length} item${sourceIds.length > 1 ? "s" : ""}`
				);
			} catch (e) {
				console.error("Move failed", e);
				if (removingFromCurrent) {
					setItems(prevItems);
				}
				notify("Failed to move!", e instanceof Error ? e.message : String(e));
				throw e;
			} finally {
				setSelectedItems(new Set());
				setIsMoving(false);
			}
		},
		[currDir, setItems, setSelectedItems, notify]
	);

	return { moveItems, isMoving };
}
