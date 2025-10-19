import { create } from "zustand";

type OpenWindows = {
	open: boolean;
	setOpen: (open: boolean) => void;
};

type LoadingType = {
	isLoading: boolean;
	setIsLoading: (isLoading: boolean) => void;
};

type ViewType = {
	viewType: "grid" | "list";
	setViewType: (viewType: "grid" | "list") => void;
};

export const useOpenSideBarMenu = create<OpenWindows>((set) => ({
	open: false,
	setOpen: (open: boolean) => set({ open }),
}));

export const useOpenNewFolderDialog = create<OpenWindows>((set) => ({
	open: false,
	setOpen: (open: boolean) => set({ open }),
}));

export const useOpenNewFileDialog = create<OpenWindows>((set) => ({
	open: false,
	setOpen: (open: boolean) => set({ open }),
}));

export const useLoadingNewFolder = create<LoadingType>((set) => ({
	isLoading: false,
	setIsLoading: (isLoading: boolean) => set({ isLoading }),
}));

export const useLoadingNewFile = create<LoadingType>((set) => ({
	isLoading: false,
	setIsLoading: (isLoading: boolean) => set({ isLoading }),
}));

export const useOpenUploadDialog = create<OpenWindows>((set) => ({
	open: false,
	setOpen: (open: boolean) => set({ open }),
}));

export const useOpenShareDialog = create<OpenWindows>((set) => ({
	open: false,
	setOpen: (open: boolean) => set({ open }),
}));

export const useLoadingShare = create<LoadingType>((set) => ({
	isLoading: false,
	setIsLoading: (isLoading: boolean) => set({ isLoading }),
}));

export const useViewType = create<ViewType>((set) => ({
	viewType: "grid",
	setViewType: (viewType: "grid" | "list") => set({ viewType }),
}));

export const usePreviewOpen = create<OpenWindows>((set) => ({
	open: false,
	setOpen: (open) => set({ open }),
}));

export const useOpenRenameDialog = create<OpenWindows>((set) => ({
	open: false,
	setOpen: (open) => set({ open }),
}));

export const useIsDownloading = create<OpenWindows>((set) => ({
	open: false,
	setOpen: (open) => set({ open }),
}));
