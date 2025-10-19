import { Progress, Text, IconButton } from "@radix-ui/themes";
import { Check, ChevronUp, CircleAlert, File, Loader2, X } from "lucide-react";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { useOpenUploadDialog } from "../../store/ui-variables";
import {
	useCurrentDir,
	useTotalStorage,
	useUploadFilesArray,
} from "../../store/drive-variables";
import readable_size from "@/lib/readable_size";
import { client_ax } from "@/lib/axios";
import type { FilesWithStatus } from "@/lib/types";
import { useStorage } from "../../hooks/useTotalStorageHook";
import { UploadItemFileIcon } from "@/components/getFileIcon";
import { useOptimisticChange } from "@/app/hooks/useOptimisticChange";
import { useToast } from "@/components/useToast";

export default function UploadMenu() {
	const isOpen = useOpenUploadDialog((state) => state.open);
	const setIsOpen = useOpenUploadDialog((state) => state.setOpen);
	const [minimize, setMinimize] = useState(false);

	const currStorage = useTotalStorage((state) => state.currStorage);

	const currDir = useCurrentDir((state) => state.dir);
	const refreshKey = useCurrentDir((state) => state.refreshKey);
	const setRefreshDir = useCurrentDir((state) => state.refreshDir);

	const filesArray = useUploadFilesArray((state) => state.filesArray);
	const setFilesArray = useUploadFilesArray((state) => state.setFilesArray);
	const [files, setFiles] = useState<FilesWithStatus[]>([]);
	const filesRef = useRef<FilesWithStatus[]>([]);
	const [error, setError] = useState<string | null>(null);
	const isProcessingRef = useRef(false);
	const [uploadControllers, setUploadControllers] = useState<
		Map<number, AbortController>
	>(new Map());
	const { handleGetUpdatedStorage } = useStorage();
	const { handleOptimisticAddNewFile } = useOptimisticChange();
	const { notify } = useToast();

	useEffect(() => {
		filesRef.current = files;
	}, [files]);

	const handleCheckOverLimit = useCallback(
		(newFiles: File[]) => {
			const currentTotalSize = files.reduce(
				(total, fileUpload) => total + fileUpload.file.size,
				0
			);
			const newFilesTotalSize = newFiles.reduce(
				(total, file) => total + file.size,
				0
			);
			const totalSize = currentTotalSize + newFilesTotalSize;
			const maxSize =
				parseInt(process.env.NEXT_PUBLIC_UPLOAD_SIZE_LIMIT_GB || "100") *
				1024 *
				1024 *
				1024;

			if (totalSize > maxSize || totalSize + currStorage > maxSize) {
				setError(
					`Total upload size exceeds ${
						process.env.NEXT_PUBLIC_UPLOAD_SIZE_LIMIT_GB || "100"
					}GB limit. Current total: ${readable_size(totalSize)}`
				);
				return false;
			}
			return true;
		},
		[files, currStorage]
	);

	const handleUploadForFiles = useCallback(async () => {
		if (isProcessingRef.current) return;
		isProcessingRef.current = true;

		const processNextFile = async () => {
			const currentFiles = filesRef.current;
			const nextFileIndex = currentFiles.findIndex(
				(f) => f.status === "pending"
			);

			if (nextFileIndex === -1) {
				isProcessingRef.current = false;
				setRefreshDir(refreshKey * -1);
				handleGetUpdatedStorage();

				const uploadedCount = currentFiles.filter(
					(f) => f.status === "uploaded"
				).length;
				if (uploadedCount > 0) {
					notify(
						"Upload Complete!",
						`Successfully uploaded ${uploadedCount} file${
							uploadedCount > 1 ? "s" : ""
						}`
					);
				}
				return;
			}

			const fileUpload = currentFiles[nextFileIndex];
			const controller = new AbortController();

			setUploadControllers((prev) =>
				new Map(prev).set(nextFileIndex, controller)
			);

			setFiles((prev) =>
				prev.map((f, i) =>
					i === nextFileIndex ? { ...f, status: "uploading" } : f
				)
			);

			const formData = new FormData();
			formData.append("file", fileUpload.file);

			try {
				const baseDir = currDir.replace(/\/+/g, "/");
				const targetDir =
					fileUpload.isFolderUpload && fileUpload.path
						? `${baseDir}/${fileUpload.path}`.replace(/\/+/g, "/")
						: baseDir;

				await client_ax.post("/api/files/upload", formData, {
					signal: controller.signal,
					headers: {
						"Content-Type": "multipart/form-data",
					},
					params: { path: targetDir },
					onUploadProgress: (event) => {
						const percent = Math.round(
							(event.loaded * 100) / (event.total || 1)
						);
						setFiles((prev) =>
							prev.map((f, i) =>
								i === nextFileIndex ? { ...f, progress: percent } : f
							)
						);
					},
				});

				setFiles((prev) =>
					prev.map((f, i) =>
						i === nextFileIndex ? { ...f, status: "uploaded" } : f
					)
				);
				if (!fileUpload.isFolderUpload || !fileUpload.path) {
					handleOptimisticAddNewFile({
						name: fileUpload.file.name,
						size: fileUpload.file.size,
					});
				}
			} catch (err: unknown) {
				if (err instanceof Error && err.name === "AbortError") {
					setFiles((prev) =>
						prev.map((f, i) =>
							i === nextFileIndex ? { ...f, status: "canceled" } : f
						)
					);
				} else {
					console.error("Upload error:", err);
					setFiles((prev) =>
						prev.map((f, i) =>
							i === nextFileIndex ? { ...f, status: "error" } : f
						)
					);
				}
			} finally {
				setUploadControllers((prev) => {
					const newMap = new Map(prev);
					newMap.delete(nextFileIndex);
					return newMap;
				});

				setTimeout(processNextFile, 100);
			}
		};

		processNextFile();
	}, [
		currDir,
		handleGetUpdatedStorage,
		refreshKey,
		setRefreshDir,
		handleOptimisticAddNewFile,
		notify,
	]);

	const handleFiles = useCallback(
		(newFiles: FilesWithStatus[]) => {
			const rawFiles = newFiles.map((item) => item.file);
			if (!handleCheckOverLimit(rawFiles)) return;

			setError(null);
			setFiles((prev) => {
				const hadActive = prev.some(
					(f) => f.status === "uploading" || f.status === "pending"
				);
				const updated = [...prev, ...newFiles];
				if (!hadActive) setTimeout(() => handleUploadForFiles(), 0);
				return updated;
			});
		},
		[handleCheckOverLimit, handleUploadForFiles]
	);

	useEffect(() => {
		if (filesArray.length > 0) {
			handleFiles(filesArray);
			setFilesArray([]);
		}
	}, [filesArray, handleFiles, setFilesArray]);

	const removeFile = (index: number) => {
		const controller = uploadControllers.get(index);
		if (controller) {
			controller.abort();
		}

		setFiles((prev) => prev.filter((_, i) => i !== index));

		setUploadControllers((prev) => {
			const newMap = new Map();
			for (const [key, value] of prev) {
				if (key < index) {
					newMap.set(key, value);
				} else if (key > index) {
					newMap.set(key - 1, value);
				}
			}
			return newMap;
		});
	};

	const cancelUpload = (index: number) => {
		const controller = uploadControllers.get(index);
		if (controller) {
			controller.abort();
		}
	};

	if (!isOpen) return null;

	return (
		<div
			className={`border border-[var(--gray-a5)] bg-[var(--color-background)] p-4 pt-3 ${
				minimize ? "h-12" : "h-72 md:h-96"
			} w-full md:w-96 rounded-lg flex flex-col transition-all duration-200`}>
			<div className="flex justify-between items-center">
				<Text className="!font-sans">
					{files.filter((f) => f.status === "uploaded").length}/{files.length}{" "}
					completed
				</Text>
				<div className="flex items-center gap-x-4">
					{minimize ? (
						<button
							onClick={() => setMinimize(false)}
							className="cursor-pointer">
							<ChevronUp className="rotate-0" />
						</button>
					) : (
						<button
							onClick={() => setMinimize(true)}
							className="cursor-pointer rotate-180">
							<ChevronUp className="" />
						</button>
					)}
					<X
						onClick={() => {
							setIsOpen(false);
							setFiles([]);
						}}
						className="cursor-pointer"
					/>
				</div>
			</div>

			{error && (
				<Text className="text-red-500 text-sm font-medium my-2">{error}</Text>
			)}

			<div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1">
				{files.map((fileUpload, index) => (
					<div
						key={index}
						className="flex items-center space-x-3 p-3 border border-[var(--gray-a5)] rounded-lg bg-[var(--color-background)]">
						<UploadItemFileIcon item={fileUpload} size="medium" />
						<div className="flex-1 min-w-0">
							<Text size="2" weight="medium" className="truncate block">
								{fileUpload.file.name}
							</Text>
							<Text size="1" color="gray">
								{readable_size(fileUpload.file.size)}
							</Text>
							{fileUpload.status === "uploading" && (
								<div className="mt-2">
									<Progress value={fileUpload.progress} className="w-full" />
								</div>
							)}
						</div>
						<div className="flex items-center space-x-2">
							{fileUpload.status === "uploading" && (
								<>
									<Loader2 className="h-4 w-4 animate-spin text-blue-500" />
									<IconButton
										variant="ghost"
										size="1"
										onClick={() => cancelUpload(index)}
										className="text-gray-400 hover:text-red-600">
										<X className="h-3 w-3" />
									</IconButton>
								</>
							)}
							{fileUpload.status === "uploaded" && (
								<Check className="h-4 w-4 text-green-500" />
							)}
							{fileUpload.status === "error" && (
								<CircleAlert className="text-red-500" size={"18"} />
							)}
							{(fileUpload.status === "pending" ||
								fileUpload.status === "error" ||
								fileUpload.status === "canceled") && (
								<IconButton
									variant="ghost"
									size="1"
									onClick={() => removeFile(index)}
									className="text-gray-400 hover:text-gray-600">
									<X className="h-3 w-3" />
								</IconButton>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
