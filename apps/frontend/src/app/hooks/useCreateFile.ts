import { useCurrentDir, useNewFileName } from "../store/drive-variables";
import { useLoadingNewFile, useOpenNewFileDialog } from "../store/ui-variables";
import { client_ax } from "@/lib/axios";
import { useOptimisticChange } from "./useOptimisticChange";
import { useToast } from "@/components/useToast";

export function useCreateFile() {
	const currDir = useCurrentDir((state) => state.dir);
	const refreshDirectory = useCurrentDir((state) => state.refreshDirectory);
	const setIsLoadingNewFile = useLoadingNewFile((state) => state.setIsLoading);
	const setOpenNewFile = useOpenNewFileDialog((state) => state.setOpen);

	const newFileName = useNewFileName((state) => state.newItemName);
	const setNewFileName = useNewFileName((state) => state.setNewItemName);
	const { handleOptimisticAddNewFile } = useOptimisticChange();

	const { notify } = useToast();

	const handleCreateFile = async () => {
		try {
			const regex = /^\.?[a-zA-Z0-9 ._-]+(\.[a-zA-Z0-9]+)+$/;
			const trimmedName = newFileName.trim();

			if (!regex.test(trimmedName)) {
				console.error("Invalid filename:", trimmedName);
				return;
			}

			const targetPath = `${currDir}/${trimmedName}`.replace(/\/+/g, "/");

			await client_ax.post("/api/files", { path: targetPath });
			handleOptimisticAddNewFile({ name: trimmedName });
			notify("Created File Sucessfully!", `Created ${trimmedName}`);
		} catch (err) {
			console.error(
				"Failed to create a file:",
				err instanceof Error ? err.message : String(err)
			);
			notify(
				"Failed to create a file!",
				err instanceof Error ? err.message : String(err)
			);
			refreshDirectory();
		} finally {
			setNewFileName("");
			setIsLoadingNewFile(false);
			setOpenNewFile(false);
		}
	};

	return {
		handleCreateFile,
	};
}
