import type {
	ContentItem,
	User,
	FilesWithStatus,
	ClipboardState,
} from "@/lib/types";
import { create } from "zustand";

type CurrentDirectory = {
	dir: string;
	refreshKey: number;
	setDir: (dir: string) => void;
	refreshDir: (key: number) => void;
};

type CurrentUser = {
	user: User | null;
	setUser: (user: User) => void;
};

type CurrentSelectedItem = {
	selectedItems: Set<ContentItem>;
	setSelectedItems: (selectedItem: Set<ContentItem>) => void;
};

type LoadingState = {
	isLoading: boolean;
	setIsLoading: (isLoading: boolean) => void;
};

type NewItemName = {
	newItemName: string;
	setNewItemName: (newItemName: string) => void;
};

type TotalStorage = {
	currStorage: number;
	setCurrentStorage: (currStorage: number) => void;
};

type SearchTerm = {
	searchTerm: string | null;
	setSearchTerm: (searchTerm: string | null) => void;
};

type UploadFilesArray = {
	filesArray: Array<FilesWithStatus>;
	setFilesArray: (
		filesArray:
			| Array<FilesWithStatus>
			| ((prev: Array<FilesWithStatus>) => Array<FilesWithStatus>)
	) => void;
};

type SortType = {
	sortBy: "name" | "date" | "size" | "type";
	setSortBy: (sortBy: "name" | "date" | "size" | "type") => void;
};

type SharedItemsState = {
	sharedCurrentDir: string;
	setSharedCurrentDir: (dir: string) => void;
	sharedDirItems: ContentItem[];
	setSharedDirItems: (items: ContentItem[]) => void;
	sharedIsLoading: boolean;
	setSharedIsLoading: (loading: boolean) => void;
};

export const useCurrentDir = create<
	CurrentDirectory & { refreshDirectory: () => void }
>((set, get) => ({
	dir: "Home",
	refreshKey: 1,
	setDir: (dir: string) => {
		const current = get();
		if (current.dir !== dir) {
			set({ dir });
		}
	},
	refreshDir: (refreshKey: number) => set({ refreshKey: refreshKey - 1 }),
	refreshDirectory: () => set({ refreshKey: get().refreshKey + 1 }),
}));

export const useTotalStorage = create<TotalStorage>((set) => ({
	currStorage: 0,
	setCurrentStorage: (currStorage: number) =>
		set(() => ({
			currStorage,
		})),
}));

export const useCurrentUser = create<CurrentUser>((set) => ({
	user: null,
	setUser: (user: User) => set({ user }),
}));

export const useCurrentDirectoryItems = create<{
	items: ContentItem[];
	setItems: (items: ContentItem[]) => void;
}>((set) => ({
	items: [],
	setItems: (items) => set({ items }),
}));

export const useSelectedItems = create<CurrentSelectedItem>((set) => ({
	selectedItems: new Set(),
	setSelectedItems: (selectedItems) => set({ selectedItems }),
}));

export const useLoadingDirectory = create<LoadingState>((set) => ({
	isLoading: false,
	setIsLoading: (isLoading: boolean) => set({ isLoading }),
}));

export const useNewFolderName = create<NewItemName>((set) => ({
	newItemName: "",
	setNewItemName: (newItemName: string) => set({ newItemName }),
}));

export const useNewFileName = create<NewItemName>((set) => ({
	newItemName: "",
	setNewItemName: (newItemName: string) => set({ newItemName }),
}));

export const useUploadFilesArray = create<UploadFilesArray>((set) => ({
	filesArray: [],
	setFilesArray: (filesArray) =>
		set((state) => ({
			filesArray:
				typeof filesArray === "function"
					? filesArray(state.filesArray)
					: filesArray,
		})),
}));

export const useSortBy = create<SortType>((set) => ({
	sortBy: "name",
	setSortBy: (sortBy) => set({ sortBy }),
}));

export const useSearchTerm = create<SearchTerm>((set) => ({
	searchTerm: null,
	setSearchTerm: (searchTerm: string | null) => set({ searchTerm }),
}));

export const useRenamedFileName = create<NewItemName>((set) => ({
	newItemName: "",
	setNewItemName: (newItemName: string) => set({ newItemName }),
}));

export const useClipboard = create<ClipboardState>()((set) => ({
	clipboard: { items: [], mode: null, sourceDir: null },
	setClipboard: (mode, items, sourceDir) =>
		set({ clipboard: { items, mode, sourceDir } }),
	clearClipboard: () =>
		set({ clipboard: { items: [], mode: null, sourceDir: null } }),
}));

export const useSharedItems = create<SharedItemsState>((set) => ({
	sharedCurrentDir: "",
	setSharedCurrentDir: (dir: string) => set({ sharedCurrentDir: dir }),
	sharedDirItems: [],
	setSharedDirItems: (items: ContentItem[]) => set({ sharedDirItems: items }),
	sharedIsLoading: false,
	setSharedIsLoading: (loading: boolean) => set({ sharedIsLoading: loading }),
}));
