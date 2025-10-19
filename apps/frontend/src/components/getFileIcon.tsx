import React from "react";
import { Folder } from "lucide-react";
import { fileIconMap } from "@/lib/fileIconMap";
import type { ContentItem } from "@/lib/types";
import type { FilesWithStatus } from "@/lib/types";

interface FileIconProps {
	item: ContentItem;
	size: "small" | "medium" | "large";
}

interface UploadFileIconProps {
	item: FilesWithStatus;
	size: "small" | "medium" | "large";
}

export function ItemFileIcon({ item, size }: FileIconProps) {
	const iconSize = size === "small" ? "16" : size === "medium" ? "25" : "120";

	if (item.is_dir) {
		return <Folder size={iconSize} className="text-[var(--accent-10)]" />;
	}

	const extension = item.extension?.toLowerCase().slice(1);
	console.log("ItemFileIcon - item:", item, "extension:", extension);
	console.log("fileIconMap has jpg:", !!fileIconMap["jpg"]);
	console.log("fileIconMap[extension]:", fileIconMap[extension]);
	const IconComponent =
		extension && fileIconMap[extension]
			? fileIconMap[extension]
			: fileIconMap.default;
	console.log("IconComponent:", IconComponent);
	return <IconComponent size={iconSize} />;
}

export function UploadItemFileIcon({ item, size }: UploadFileIconProps) {
	const iconSize = size === "small" ? "16" : size === "medium" ? "20" : "120";

	const extension = item.file.name.split(".").pop()?.toLowerCase();
	const IconComponent =
		extension && fileIconMap[extension]
			? fileIconMap[extension]
			: fileIconMap.default;
	return <IconComponent size={iconSize} />;
}
