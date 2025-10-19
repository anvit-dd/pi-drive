import type { ContentItem } from "./types";

const imageExtensions = [
	".jpg",
	".jpeg",
	".png",
	".gif",
	".bmp",
	".webp",
	".ico",
];
const videoExtensions = [
	".mp4",
	".avi",
	".mov",
	".wmv",
	".flv",
	".webm",
	".mkv",
	".m4v",
];
const audioExtensions = [
	".mp3",
	".wav",
	".ogg",
	".aac",
	".flac",
	".m4a",
	".wma",
	".opus",
];
const documentExtensions = [".pdf"];

export function checkFileType(file: ContentItem) {
	if (imageExtensions.some((ex) => ex === file.extension)) {
		return "image";
	} else if (videoExtensions.some((ex) => ex === file.extension)) {
		return "video";
	} else if (audioExtensions.some((ex) => ex === file.extension)) {
		return "audio";
	} else if (documentExtensions.some((ex) => ex === file.extension)) {
		return "document";
	}
}

export default function isPreviewable(extension: string) {
	const normalizedExt = extension.toLowerCase();
	return (
		imageExtensions.includes(normalizedExt) ||
		videoExtensions.includes(normalizedExt) ||
		audioExtensions.includes(normalizedExt) ||
		documentExtensions.includes(normalizedExt)
	);
}
