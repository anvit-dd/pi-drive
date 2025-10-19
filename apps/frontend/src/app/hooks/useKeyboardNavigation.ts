import { useCallback, useEffect } from "react";
import type { ContentItem } from "@/lib/types";
import { useCopyPasteCut } from "./useCopyPasteCut";

interface UseKeyboardNavigationProps {
	selectedItems: Set<ContentItem>;
	dirContents: ContentItem[] | null;
	viewType: string;
	setSelectedItems: (items: Set<ContentItem>) => void;
	handleOpenItem: (item: ContentItem) => void;
	selectAll: () => void;
	setOpenNewFolder: (open: boolean) => void;
	setOpenNewFile: (open: boolean) => void;
	setOpenRenameDialog: (open: boolean) => void;
	setOpenShareDialog?: (open: boolean) => void;
	openNewFile: boolean;
	openNewFolder: boolean;
	isDisabled?: boolean;
	disableModificationShortcuts?: boolean;
}

export function useKeyboardNavigation({
	selectedItems,
	dirContents,
	viewType,
	setSelectedItems,
	handleOpenItem,
	selectAll,
	setOpenNewFolder,
	setOpenNewFile,
	setOpenRenameDialog,
	setOpenShareDialog,
	openNewFile,
	openNewFolder,
	isDisabled = false,
	disableModificationShortcuts = false,
}: UseKeyboardNavigationProps) {
	const { handleCopyItems, handleCutItems, handlePasteItems } =
		useCopyPasteCut();

	const getGridColumns = useCallback(() => {
		if (viewType === "list") return 1;
		const container = document.querySelector('[data-grid-container="true"]');
		if (!container) return 1;
		const nodes = Array.from(
			container.querySelectorAll('[data-item="true"]')
		) as HTMLElement[];
		if (!nodes.length) return 1;
		const firstTop = nodes[0].offsetTop;
		let cols = 0;
		for (const n of nodes) {
			if (n.offsetTop === firstTop) cols += 1;
			else break;
		}
		return Math.max(cols, 1);
	}, [viewType]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (isDisabled) return;

			if (event.key === "Escape" && selectedItems.size > 0) {
				setSelectedItems(new Set());
			}

			if (event.ctrlKey && event.key.toLowerCase() === "a") {
				event.preventDefault();
				selectAll();
			}

			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				const searchInput =
					document.getElementById("search-input") ||
					document.getElementById("search-input-mobile");
				if (searchInput) {
					searchInput.focus();
				}
			}

			if (
				!openNewFile &&
				event.shiftKey &&
				event.ctrlKey &&
				event.key.toLowerCase() === "n" &&
				!disableModificationShortcuts
			) {
				event.preventDefault();
				setOpenNewFolder(true);
			}

			if (
				!openNewFolder &&
				event.shiftKey &&
				event.key.toLowerCase() === "n" &&
				!event.ctrlKey &&
				!disableModificationShortcuts
			) {
				event.preventDefault();
				setOpenNewFile(true);
			}

			if (
				event.shiftKey &&
				event.key.toLowerCase() === "u" &&
				!event.ctrlKey &&
				!event.metaKey &&
				!disableModificationShortcuts
			) {
				event.preventDefault();
				const input = document.getElementById("upload-file");
				if (input) input.click();
			}

			if (
				(event.ctrlKey || event.metaKey) &&
				event.shiftKey &&
				event.key.toLowerCase() === "u" &&
				!disableModificationShortcuts
			) {
				event.preventDefault();
				const input = document.getElementById("upload-folder");
				if (input) input.click();
			}

			if (
				event.shiftKey &&
				event.key.toLowerCase() === "r" &&
				selectedItems.size === 1 &&
				!disableModificationShortcuts
			) {
				event.preventDefault();
				setOpenRenameDialog(true);
			}

			if (
				(event.ctrlKey || event.metaKey) &&
				event.key.toLowerCase() === "s" &&
				selectedItems.size > 0 &&
				!disableModificationShortcuts &&
				setOpenShareDialog
			) {
				event.preventDefault();
				setOpenShareDialog(true);
			}

			if (selectedItems.size === 1 && event.key === "Enter") {
				event.preventDefault();
				handleOpenItem(Array.from(selectedItems)[0]);
			}

			if (
				selectedItems.size > 0 &&
				event.ctrlKey &&
				event.key === "c" &&
				!disableModificationShortcuts
			) {
				event.preventDefault();
				handleCopyItems();
			}

			if (event.ctrlKey && event.key === "v" && !disableModificationShortcuts) {
				event.preventDefault();
				handlePasteItems();
			}
			if (event.ctrlKey && event.key === "x" && !disableModificationShortcuts) {
				event.preventDefault();
				handleCutItems();
			}

			if (
				["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
			) {
				event.preventDefault();
				const items = dirContents || [];
				if (!items.length) return;

				const selectedArray = Array.from(selectedItems);
				const selectedIdxs = selectedArray
					.map((sel) => items.findIndex((i) => i.id === sel.id))
					.filter((i) => i >= 0);

				const towardsStart =
					event.key === "ArrowUp" || event.key === "ArrowLeft";
				let baseIdx: number;
				if (selectedIdxs.length) {
					baseIdx = towardsStart
						? Math.min(...selectedIdxs)
						: Math.max(...selectedIdxs);
				} else {
					baseIdx = towardsStart ? items.length - 1 : 0;
				}

				let nextIdx = baseIdx;
				if (viewType === "list") {
					if (event.key === "ArrowUp") nextIdx = baseIdx - 1;
					if (event.key === "ArrowDown") nextIdx = baseIdx + 1;
				} else {
					const cols = getGridColumns();
					const atLeftEdge = baseIdx % cols === 0;
					const atRightEdge = (baseIdx + 1) % cols === 0;
					if (event.key === "ArrowLeft") {
						if (!atLeftEdge) nextIdx = baseIdx - 1;
					} else if (event.key === "ArrowRight") {
						if (!atRightEdge && baseIdx + 1 < items.length)
							nextIdx = baseIdx + 1;
					} else if (event.key === "ArrowUp") {
						nextIdx = baseIdx - cols;
					} else if (event.key === "ArrowDown") {
						nextIdx = baseIdx + cols;
					}
				}

				if (nextIdx < 0 || nextIdx >= items.length) return;
				const target = items[nextIdx];
				setSelectedItems(new Set([target]));

				// Scroll and focus the target element
				requestAnimationFrame(() => {
					const el = document.querySelector(
						`[data-item-id="${target.id}"]`
					) as HTMLElement | null;
					el?.scrollIntoView({ block: "nearest" });
					el?.focus();
				});
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		isDisabled,
		selectedItems,
		dirContents,
		viewType,
		setSelectedItems,
		handleOpenItem,
		selectAll,
		setOpenNewFolder,
		setOpenNewFile,
		setOpenRenameDialog,
		setOpenShareDialog,
		openNewFile,
		openNewFolder,
		getGridColumns,
		disableModificationShortcuts,
		handleCopyItems,
		handleCutItems,
		handlePasteItems,
	]);
}
