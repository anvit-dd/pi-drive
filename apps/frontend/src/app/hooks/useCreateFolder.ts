import { useToast } from "@/components/useToast";
import { useCurrentDir, useNewFolderName } from "../store/drive-variables";
import {
	useLoadingNewFolder,
	useOpenNewFolderDialog,
} from "../store/ui-variables";
import { useOptimisticChange } from "./useOptimisticChange";

export function useCreateFolder() {
	const currDir = useCurrentDir((state) => state.dir);
	const setIsLoadingNewFolder = useLoadingNewFolder(
		(state) => state.setIsLoading
	);
	const setOpenNewFolder = useOpenNewFolderDialog((state) => state.setOpen);

	const newFolderName = useNewFolderName((state) => state.newItemName);
	const setNewFolderName = useNewFolderName((state) => state.setNewItemName);

	const { handleOptimisticAddNewFolder } = useOptimisticChange();

	const { notify } = useToast();

	const handleCreateFolder = async (folder_name?: string) => {
		try {
			const cleanedName = (folder_name || newFolderName)
				.trim()
				.replace(/^\/+/, "");

			if (!isValidFolderName(cleanedName)) {
				throw new Error("Invalid folder name!");
			}
			const targetPath = `${currDir}/${cleanedName}`.replace(/\/+/g, "/");
			const res = await fetch("/api/directories", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ path: targetPath }),
			});

			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}
			if (!folder_name) {
				handleOptimisticAddNewFolder({ name: cleanedName });
			}
			notify("Folder Created Sucessfully!", `Created ${cleanedName}`);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "An unknown error occurred";
			notify("Failed to create folder!", errorMessage);
		} finally {
			setNewFolderName("");
			setIsLoadingNewFolder(false);
			setOpenNewFolder(false);
		}
	};

	return {
		handleCreateFolder,
	};
}
const isValidFolderName = (path: string) => {
	if (!path) return false;
	if (path.includes("..")) return false;
	return true;
};
