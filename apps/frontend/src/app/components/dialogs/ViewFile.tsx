import React, { useEffect, useState, useMemo } from "react";
import { Button, Dialog, Text } from "@radix-ui/themes";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { usePreviewOpen } from "@/app/store/ui-variables";
import { useSelectedItems } from "@/app/store/drive-variables";
import Image from "next/image";
import { LoaderIcon, Download } from "lucide-react";
import { Spinner } from "@radix-ui/themes";
import { useDownloadItems } from "@/app/hooks/useDownloadItems";
import { useIsDownloading } from "@/app/store/ui-variables";
import { checkFileType } from "@/lib/isPreviewable";
import type { ContentItem } from "@/lib/types";

export default function ViewFile({
	previewItem,
	onClose,
	isSharedView = false,
	linkId,
	userId,
	password,
}: {
	previewItem?: ContentItem;
	onClose?: () => void;
	isSharedView?: boolean;
	linkId?: string;
	userId?: string;
	password?: string;
}) {
	const globalOpen = usePreviewOpen((state) => state.open);
	const setGlobalOpen = usePreviewOpen((state) => state.setOpen);
	const selectedFile = useSelectedItems((state) => state.selectedItems);
	const arr_selectedFile = useMemo(
		() => (previewItem ? [previewItem] : Array.from(selectedFile)),
		[previewItem, selectedFile]
	);

	const [localOpen, setLocalOpen] = useState(false);

	const open = previewItem ? localOpen : globalOpen;
	const setOpen = previewItem ? setLocalOpen : setGlobalOpen;
	const [loading, setIsLoading] = useState(true);

	const { handleDownload, downloadPercent } = useDownloadItems(
		isSharedView,
		linkId,
		password
	);
	const isDownloading = useIsDownloading((state) => state.open);

	useEffect(() => {
		if (open) {
			setIsLoading(true);
		}
	}, [open]);

	useEffect(() => {
		if (previewItem) {
			setLocalOpen(true);
		}
	}, [previewItem]);

	const renderContent = () => {
		if (arr_selectedFile.length === 0) return null;

		const file = arr_selectedFile[0];
		const fileType = checkFileType(file);

		const buildUrl = (baseUrl: string, paramName: string) => {
			const params = new URLSearchParams();
			params.set(paramName, file.id);

			if (isSharedView && linkId && userId) {
				params.set("linkId", linkId);
				params.set("user_id", userId);
				if (password) {
					params.set("password", password);
				}
			}

			return `${baseUrl}?${params.toString()}`;
		};

		const streamUrl = isSharedView
			? buildUrl("/api/share/stream", "file_path")
			: buildUrl("/api/media/stream", "path");

		switch (fileType) {
			case "video":
				return (
					<video
						src={streamUrl}
						className="w-auto h-auto max-w-[80vw] max-h-[80vh]"
						controls
						onLoadedData={() => setIsLoading(false)}
						onError={() => setIsLoading(false)}
					/>
				);
			case "audio":
				return (
					<audio
						src={streamUrl}
						className="w-[80vw] max-w-[80vw]"
						controls
						onLoadedData={() => setIsLoading(false)}
						onError={() => setIsLoading(false)}
					/>
				);
			case "image":
				return (
					<Image
						src={streamUrl}
						alt={file.name}
						width={0}
						height={0}
						quality={100}
						sizes="100vw"
						priority
						draggable={false}
						className="w-auto h-auto max-w-[80vw] max-h-[80vh] object-cover"
						onLoad={() => setIsLoading(false)}
						onError={() => setIsLoading(false)}
					/>
				);
			case "document":
				return (
					<object
						data={streamUrl}
						type="application/pdf"
						className="w-[80vw] h-[80vh]"
						onLoad={() => setIsLoading(false)}
						onError={() => setIsLoading(false)}>
						<div className="bg-gray-100 flex-col p-4">
							<Text color="crimson" className="font-medium text-xl">
								PDF cannot be displayed
							</Text>
							<Text>
								Your browser does not support PDF viewing. Please download the
								file to view it.
							</Text>
						</div>
					</object>
				);
			default:
				return (
					<div className="p-4 space-y-2">
						<div>
							<p className="font-medium text-xl ">File cannot be previewed</p>
							<p>Download to view the content.</p>
						</div>
						<Button
							id="download-button"
							variant="soft"
							className="!flex !cursor-pointer !mx-auto"
							onClick={handleDownload}
							disabled={isDownloading}>
							{isDownloading ? (
								<>
									<Spinner />
									{downloadPercent}%
								</>
							) : (
								<>
									<Download size="20" />
									Download
								</>
							)}
						</Button>
					</div>
				);
		}
	};

	const titleText =
		arr_selectedFile.length > 0
			? `Preview: ${arr_selectedFile[0].name}`
			: "File preview";

	useEffect(() => {
		if (arr_selectedFile.length > 0) {
			const fileType = checkFileType(arr_selectedFile[0]);
			if (
				!["video", "audio", "image", "document"].includes(fileType as string)
			) {
				setIsLoading(false);
			}
		}
	}, [arr_selectedFile]);

	return (
		<Dialog.Root
			open={open}
			onOpenChange={(isOpen) => {
				setOpen(isOpen);
				if (!isOpen && onClose) onClose();
			}}>
			<Dialog.Content
				className="!p-0 !max-w-none !max-h-none !w-fit !h-fit !bg-transparent !ring-0 !flex !items-center !rounded-xs"
				style={{ width: "fit-content", height: "fit-content" }}>
				<Dialog.Title>
					<VisuallyHidden>{titleText}</VisuallyHidden>
				</Dialog.Title>

				{loading && <LoaderIcon className="animate-spin w-8 h-8 text-white" />}
				<div className="relative overflow-hidden">{renderContent()}</div>
			</Dialog.Content>
		</Dialog.Root>
	);
}
