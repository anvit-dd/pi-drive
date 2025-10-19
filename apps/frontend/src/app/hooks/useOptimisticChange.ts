import type { ContentItem } from "@/lib/types";
import {
	useCurrentDir,
	useCurrentDirectoryItems,
} from "../store/drive-variables";

export function useOptimisticChange() {
	const setItems = useCurrentDirectoryItems((state) => state.setItems);
	const currDir = useCurrentDir((state) => state.dir);

	const handleOptimisticAddNewFile = (item: Partial<ContentItem>) => {
		const fallbackName = "New File";
		const rawInput = (item.name || "").trim() || fallbackName;

		const dotPos = rawInput.lastIndexOf(".");
		const hasExt = dotPos > 0 && dotPos < rawInput.length - 1;
		const inferredExt = hasExt ? rawInput.slice(dotPos) : ".file";
		const extension = (item.extension || inferredExt).startsWith(".")
			? item.extension || inferredExt
			: "." + (item.extension || inferredExt);

		const baseName = hasExt ? rawInput.slice(0, dotPos) : rawInput;

		const currentItems = useCurrentDirectoryItems.getState().items;
		const existingFiles = new Set(
			currentItems.filter((itm) => !itm.is_dir).map((itm) => itm.name)
		);

		let idx = 0;
		let candidateBase = baseName;
		let finalName = candidateBase + extension;

		while (existingFiles.has(finalName)) {
			idx++;
			candidateBase = `${baseName}-${idx}`;
			finalName = candidateBase + extension;
		}

		const now = Math.floor(Date.now() / 1000);
		const newItem: ContentItem = {
			id: `${currDir}/${finalName}`,
			name: finalName,
			extension,
			size: item.size ?? 0,
			is_dir: false,
			created_at: now,
			accessed_at: now,
			order_no: currentItems.length,
		};

		setItems([...currentItems, newItem]);
	};

	const handleOptimisticAddNewFolder = (item: Partial<ContentItem>) => {
		const fallbackName = "New Folder";
		const input = item.name?.trim() || fallbackName;

		const parts = input.split("/").filter(Boolean);
		const [first, ...rest] = parts;
		const baseFolderName = first || fallbackName;
		const subFoldersCount = rest.length;

		const currentItems = useCurrentDirectoryItems.getState().items;
		let folderName = baseFolderName;
		let i = 0;

		while (currentItems.some((itm) => itm.is_dir && itm.name === folderName)) {
			i++;
			folderName = `${baseFolderName}-${i}`;
		}

		const now = Math.floor(Date.now() / 1000);
		const newFolder: ContentItem = {
			id: `${currDir}/${folderName}`,
			name: folderName,
			extension: "N/A",
			size: 0,
			no_items: subFoldersCount,
			is_dir: true,
			created_at: now,
			accessed_at: now,
			order_no: currentItems.length,
		};

		setItems([newFolder, ...currentItems]);
	};

	const handleOptimisticDeleteItems = (item_ids: string[]) => {
		if (!item_ids || item_ids.length === 0) return;
		const ids = new Set(item_ids);
		const currentItems = useCurrentDirectoryItems.getState().items;
		const remaining = currentItems.filter((itm) => !ids.has(itm.id));
		const reordered = remaining.map((itm, idx) => ({ ...itm, order_no: idx }));
		setItems(reordered);
	};

	return {
		handleOptimisticAddNewFile,
		handleOptimisticAddNewFolder,
		handleOptimisticDeleteItems,
	};
}
