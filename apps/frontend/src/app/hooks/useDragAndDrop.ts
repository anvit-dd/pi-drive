import { useCallback, useState } from "react";
import type { FilesWithStatus } from "@/lib/types";

interface UseDragAndDropProps {
	setFilesArray: (
		updater: (prev: FilesWithStatus[]) => FilesWithStatus[]
	) => void;
	setOpenUploadDialog: (open: boolean) => void;
}

export function useDragAndDrop({
	setFilesArray,
	setOpenUploadDialog,
}: UseDragAndDropProps) {
	const [isDragOver, setIsDragOver] = useState(false);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.dataTransfer.types.includes("Files")) {
			setIsDragOver(true);
		}
	}, []);

	const handleDragEnter = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.dataTransfer.types.includes("Files")) {
			setIsDragOver(true);
		}
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const isLeavingDropZone =
			e.clientX < rect.left ||
			e.clientX > rect.right ||
			e.clientY < rect.top ||
			e.clientY > rect.bottom;

		if (isLeavingDropZone) {
			setIsDragOver(false);
		}
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragOver(false);

			const files = Array.from(e.dataTransfer.files);
			if (files.length === 0) return;

			const validFiles = files.filter(
				(file) => file.size > 0 || file.type !== ""
			);

			if (validFiles.length === 0) {
				console.warn("No valid files to upload");
				return;
			}

			const filesWithStatus: FilesWithStatus[] = validFiles.map((file) => ({
				file,
				progress: 0,
				status: "pending" as const,
			}));

			setFilesArray((prev) => [...prev, ...filesWithStatus]);
			setOpenUploadDialog(true);
		},
		[setFilesArray, setOpenUploadDialog]
	);

	// Global drag prevention
	const setupGlobalDragPrevention = useCallback(() => {
		const preventDefaults = (e: Event) => {
			e.preventDefault();
			e.stopPropagation();
		};

		const handleGlobalDragOver = (e: Event) => preventDefaults(e);
		const handleGlobalDrop = (e: Event) => preventDefaults(e);

		document.addEventListener("dragover", handleGlobalDragOver);
		document.addEventListener("drop", handleGlobalDrop);

		return () => {
			document.removeEventListener("dragover", handleGlobalDragOver);
			document.removeEventListener("drop", handleGlobalDrop);
		};
	}, []);

	return {
		isDragOver,
		handleDragOver,
		handleDragEnter,
		handleDragLeave,
		handleDrop,
		setupGlobalDragPrevention,
	};
}
