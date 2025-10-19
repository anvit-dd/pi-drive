import {
	useClipboard,
	useCurrentDir,
	useSelectedItems,
} from "../store/drive-variables";
import { client_ax } from "@/lib/axios";
import type { ContentItem } from "@/lib/types";
import { useToast } from "@/components/useToast";
import { useStorage } from "./useTotalStorageHook";

function parentOf(item: ContentItem) {
	const item_id = item.id;
	const i = item_id.lastIndexOf("/");
	return i === -1 ? "" : item_id.slice(0, i);
}

export function useCopyPasteCut() {
	const currDir = useCurrentDir((state) => state.dir);
	const refreshDirectory = useCurrentDir((state) => state.refreshDirectory);
	const selectedItems = useSelectedItems((state) => state.selectedItems);
	const selectedItemsArr = Array.from(selectedItems);
	const clipboard = useClipboard((state) => state.clipboard);
	const setClipboard = useClipboard((state) => state.setClipboard);
	const clearClipboard = useClipboard((state) => state.clearClipboard);
	const { notify } = useToast();
	const { handleGetUpdatedStorage } = useStorage();

	// useEffect(() => console.log(clipboard), [clipboard]);

	const handleCopyItems = async () => {
		if (selectedItemsArr.length > 0) {
			setClipboard("copy", selectedItemsArr, currDir);
			notify(
				"Copied to clipboard!",
				`${selectedItemsArr.length} item${
					selectedItemsArr.length > 1 ? "s" : ""
				} copied`
			);
		}
	};

	const handlePasteItems = async () => {
		if (!clipboard.items || clipboard.items.length === 0) {
			notify("Nothing to paste!", "Clipboard is empty");
			return;
		}

		if (!clipboard.mode) {
			notify("Nothing to paste!", "Clipboard is empty");
			return;
		}

		try {
			const itemIds = clipboard.items.map((item) => item.id);
			const destination = currDir.replace(/\/+/g, "/");
			if (clipboard.mode === "cut") {
				await client_ax.patch("/api/files/move", {
					items: itemIds,
					destination,
				});

				notify(
					"Pasted Successfully!",
					`Moved ${itemIds.length} item${itemIds.length > 1 ? "s" : ""}`
				);
				clearClipboard();
			} else if (clipboard.mode === "copy") {
				await client_ax.patch("/api/files/copy", {
					items: itemIds,
					destination,
				});

				notify(
					"Pasted Successfully!",
					`Copied ${itemIds.length} item${itemIds.length > 1 ? "s" : ""}`
				);
				handleGetUpdatedStorage();
			}

			refreshDirectory();
		} catch (err) {
			console.error("Paste failed:", err);
			notify("Paste Failed!", err instanceof Error ? err.message : String(err));
		}
	};

	const handleCutItems = () => {
		if (selectedItemsArr.length === 0) return;
		const parents = new Set(selectedItemsArr.map(parentOf));
		const sourceDir = parents.size === 1 ? Array.from(parents)[0] : null;
		setClipboard("cut", selectedItemsArr, sourceDir);
		notify(
			"Cut to clipboard!",
			`${selectedItemsArr.length} item${
				selectedItemsArr.length > 1 ? "s" : ""
			} cut`
		);
		console.log("Cut items");
	};

	return {
		handleCopyItems,
		handleCutItems,
		handlePasteItems,
	};
}
