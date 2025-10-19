import { useState } from "react";
import { client_ax } from "@/lib/axios";
import {
	useCurrentDir,
	useRenamedFileName,
	useSelectedItems,
} from "../store/drive-variables";
import { useOpenRenameDialog } from "../store/ui-variables";
import type { ContentItem } from "@/lib/types";
import { useToast } from "@/components/useToast";

export function useRenameFile() {
	const [isRenaming, setIsRenaming] = useState(false);

	const newName = useRenamedFileName((state) => state.newItemName);
	const setNewName = useRenamedFileName((state) => state.setNewItemName);

	const selectedItems = useSelectedItems((state) => state.selectedItems);
	const setSelectedItems = useSelectedItems((state) => state.setSelectedItems);

	const refreshDirectory = useCurrentDir((state) => state.refreshDirectory);
	const setOpenRenameDialog = useOpenRenameDialog((state) => state.setOpen);

	const { notify } = useToast();

	const validateName = (name: string) => {
		const trimmed = name.trim();
		if (!trimmed) return false;
		if (/[\\/]/.test(trimmed)) return false;
		if (trimmed === "." || trimmed === "..") return false;
		return true;
	};

	const handleRename = async () => {
		if (selectedItems.size === 0) return;
		const item: ContentItem = Array.from(selectedItems)[0];

		const trimmed = newName.trim();
		if (!validateName(trimmed) || trimmed === item.name) {
			return;
		}

		try {
			setIsRenaming(true);
			await client_ax.patch("/api/files/rename", {
				file_path: item.id,
				new_name: trimmed,
			});

			refreshDirectory();
			setOpenRenameDialog(false);
			setSelectedItems(new Set());
			notify("Renamed Successfully!", `Renamed "${item.name}" to "${trimmed}"`);
		} catch (err) {
			console.error(
				"Failed to rename item:",
				err instanceof Error ? err.message : String(err)
			);
			notify(
				"Failed to rename!",
				err instanceof Error ? err.message : String(err)
			);
		} finally {
			setNewName("");
			setIsRenaming(false);
		}
	};

	return { handleRename, isRenaming };
}
