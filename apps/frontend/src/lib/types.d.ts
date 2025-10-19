export type ContentItem = {
	id: string;
	order_no: number;
	name: string;
	is_dir: boolean;
	extension: string;
	created_at: number;
	accessed_at: number;
	size: number;
	no_items?: number;
};

export type User = {
	id: string;
	email: string;
	name?: string;
	password: string;
	provider: string;
	createdAt: Date;
	updatedAt: Date;
};

export type FilesWithStatus = {
	file: File;
	progress: number;
	isFolderUpload?: boolean;
	path?: string | null;
	status: "pending" | "uploading" | "uploaded" | "error" | "canceled";
};

export type ClipboardMode = "copy" | "cut" | null;

export interface ClipboardState {
	clipboard: {
		items: ContentItem[];
		mode: ClipboardMode;
		sourceDir: string | null;
	};
	setClipboard: (
		mode: Exclude<ClipboardMode, null>,
		items: ContentItem[],
		sourceDir: string | null
	) => void;
	clearClipboard: () => void;
}
export type User = {
	id: string;
	email: string;
	name?: string;
	password: string;
	provider: string;
	createdAt: Date;
	updatedAt: Date;
};

export type FilesWithStatus = {
	file: File;
	progress: number;
	isFolderUpload?: boolean;
	path?: string | null;
	status: "pending" | "uploading" | "uploaded" | "error" | "canceled";
};

export interface ClipboardState {
	clipboard: {
		items: ContentItem[];
		mode: "copy" | "cut" | null;
		sourceDir: string | null;
	};
	setClipboard: (
		mode: Exclude<"copy" | "cut" | null, null>,
		items: ContentItem[],
		sourceDir: string | null
	) => void;
	clearClipboard: () => void;
}
