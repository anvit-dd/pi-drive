import { useState } from "react";
import { useSelectedItems } from "../store/drive-variables";
import { useCurrentDir } from "../store/drive-variables";
import { ContentItem } from "@/lib/types";
import { useStorage } from "./useTotalStorageHook";
import { client_ax } from "@/lib/axios";
import { useOptimisticChange } from "./useOptimisticChange";
import { useToast } from "@/components/useToast";

export function useDeleteItems() {
	const [isLoadingDelete, setIsLoadingDelete] = useState(false);

	const refreshDirectory = useCurrentDir((state) => state.refreshDirectory);
	const selectedItems = useSelectedItems((state) => state.selectedItems);
	const setSelectedItems = useSelectedItems((state) => state.setSelectedItems);

	const { handleOptimisticDeleteItems } = useOptimisticChange();

	const { handleGetUpdatedStorage } = useStorage();

	const { notify } = useToast();

	const handleDeleteItems = async () => {
		try {
			setIsLoadingDelete(true);
			const selected_paths = Array.from(selectedItems).map(
				(item: ContentItem) => {
					return `${item.id}`;
				}
			);

			await client_ax.delete("/api/files", {
				data: {
					items: selected_paths,
				},
			});

			handleOptimisticDeleteItems(selected_paths);
			handleGetUpdatedStorage();
			notify(
				"Deleted Sucessfuly!",
				selected_paths.length == 1
					? `Deleted ${Array.from(selectedItems)[0].name}`
					: `Deleted ${selected_paths.length} items`
			);
		} catch (err) {
			notify(
				"Failed to delete!",
				err instanceof Error ? err.message : String(err)
			);
			refreshDirectory();
		} finally {
			setSelectedItems(new Set());
			setIsLoadingDelete(false);
		}
	};

	return {
		handleDeleteItems,
		isLoadingDelete,
	};
}
