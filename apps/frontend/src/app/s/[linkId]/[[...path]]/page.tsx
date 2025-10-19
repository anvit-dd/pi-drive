"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import FileDisplay from "@/app/components/display/FileDisplay";
import { useOpenSideBarMenu } from "@/app/store/ui-variables";
import { useSharedItems } from "@/app/store/drive-variables";
import { Suspense } from "react";
import {
	Button,
	Card,
	TextField,
	Text,
	Badge,
	Spinner,
} from "@radix-ui/themes";
import { AlertCircle, Download, Eye } from "lucide-react";
import { useFetchSharedDirectoryItems } from "@/app/hooks/useFetchSharedDirItems";
import type { ContentItem } from "@/lib/types";
import ViewFile from "@/app/components/dialogs/ViewFile";
import FileOperations from "@/app/components/display/FileOperations";
import TopNav from "@/app/components/TopNav";
import { client_ax } from "@/lib/axios";
import { FileGridItem } from "@/app/components/display/FileGridItem";

interface ShareInfo {
	itemPath: string;
	sharedBy: string;
	userId: string;
	createdAt: string;
	expiresAt: string;
	requiresPassword: boolean;
	isFile: boolean;
}

export default function ShareViewWithPath() {
	const params = useParams();
	const router = useRouter();

	const linkId = params.linkId as string;
	const pathSegments = Array.isArray(params.path) ? params.path : [];
	const relativePath = pathSegments.length > 0 ? pathSegments.join("/") : "";

	const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isPasswordRequired, setIsPasswordRequired] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
	const [currentPassword, setCurrentPassword] = useState<string | undefined>();
	const [fileMetadata, setFileMetadata] = useState<ContentItem | null>(null);
	const [passwordError, setPasswordError] = useState<string | null>(null);

	const currentPath = useMemo(() => {
		if (!shareInfo) return "";
		return relativePath
			? `${shareInfo.itemPath}/${relativePath}`
			: shareInfo.itemPath;
	}, [shareInfo, relativePath]);

	const IsOpenSideBarMenu = useOpenSideBarMenu((state) => state.open);
	const setOpenSideBarMenu = useOpenSideBarMenu((state) => state.setOpen);

	const sharedCurrentDir = useSharedItems((state) => state.sharedCurrentDir);
	const setSharedCurrentDir = useSharedItems(
		(state) => state.setSharedCurrentDir
	);
	const sharedDirItems = useSharedItems((state) => state.sharedDirItems);
	const setSharedDirItems = useSharedItems((state) => state.setSharedDirItems);
	const sharedIsLoading = useSharedItems((state) => state.sharedIsLoading);
	const setSharedIsLoading = useSharedItems(
		(state) => state.setSharedIsLoading
	);

	useEffect(() => {
		if (linkId && typeof window !== "undefined") {
			const storedAuth = sessionStorage.getItem(`share_auth_${linkId}`);
			const storedPassword = sessionStorage.getItem(`share_password_${linkId}`);

			setIsAuthenticated(storedAuth === "true");
			setCurrentPassword(storedPassword || undefined);
		}
	}, [linkId]);

	useFetchSharedDirectoryItems(
		linkId,
		currentPassword,
		currentPath,
		setSharedDirItems,
		setSharedIsLoading
	);

	const validateShare = useCallback(
		async (passwordParam?: string) => {
			try {
				setIsLoading(true);
				setError(null);
				setPasswordError(null);

				const params = new URLSearchParams();
				params.set("linkId", linkId);
				if (passwordParam) {
					params.set("password", passwordParam);
				} else if (currentPassword) {
					params.set("password", currentPassword);
				}

				const response = await fetch(
					`/api/share/validate?${params.toString()}`
				);
				const data = await response.json();

				if (!response.ok) {
					if (data.requiresPassword) {
						setIsPasswordRequired(true);
						setIsLoading(false);
						return;
					}

					if (response.status === 401 && data.error === "Invalid password") {
						setPasswordError(data.error);
						setIsPasswordRequired(true);
						setIsLoading(false);
						return;
					}

					throw new Error(data.error || "Failed to validate share link");
				}

				setShareInfo(data);
				setIsAuthenticated(true);
				setIsPasswordRequired(false);
				setCurrentPassword(passwordParam || currentPassword);
				setPassword("");
				setPasswordError(null);

				if (typeof window !== "undefined") {
					sessionStorage.setItem(`share_auth_${linkId}`, "true");
					if (passwordParam || currentPassword) {
						sessionStorage.setItem(
							`share_password_${linkId}`,
							passwordParam || currentPassword || ""
						);
					}
				}

				const initialPath = relativePath
					? `${data.itemPath}/${relativePath}`
					: data.itemPath;
				setSharedCurrentDir(initialPath);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to validate share link"
				);
			} finally {
				setIsLoading(false);
			}
		},
		[linkId, currentPassword, relativePath, setSharedCurrentDir]
	);

	const handlePasswordSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (password.trim()) {
			validateShare(password);
		}
	};

	const handleNavigateToFolder = (folderPath: string) => {
		const relativePathForUrl = folderPath.startsWith(shareInfo!.itemPath + "/")
			? folderPath.slice(shareInfo!.itemPath.length + 1)
			: "";
		const url = relativePathForUrl
			? `/s/${linkId}/${relativePathForUrl}`
			: `/s/${linkId}`;
		router.push(url);
		setSharedCurrentDir(folderPath);
	};

	const handleOpenPreview = useCallback((item: ContentItem) => {
		setPreviewItem(item);
	}, []);

	const handlePreviewSharedFile = useCallback(() => {
		if (fileMetadata) {
			setPreviewItem(fileMetadata);
		}
	}, [fileMetadata]);

	const handleDownloadSharedFile = async () => {
		try {
			const params = new URLSearchParams();
			params.set("linkId", linkId);
			if (currentPassword) {
				params.set("password", currentPassword);
			}

			const response = await client_ax(
				`/api/share/download?${params.toString()}`,
				{ responseType: "blob" }
			);
			const blob = response.data;
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = shareInfo!.itemPath.split("/").pop() || "download";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Download failed:", error);
			setError("Failed to download file");
		}
	};

	useEffect(() => {
		if (linkId) {
			validateShare();
		}
	}, [linkId, isAuthenticated, currentPassword, validateShare]);

	useEffect(() => {
		const fetchFileMetadata = async () => {
			if (!shareInfo || !shareInfo.isFile || !linkId) return;

			try {
				const params = new URLSearchParams();
				params.set("linkId", linkId);
				if (currentPassword) {
					params.set("password", currentPassword);
				}

				const response = await client_ax.get(
					`/api/share/contents?${params.toString()}`
				);
				const data = response.data;
				if (data.contents) {
					console.log("Setting file metadata:", data.contents[0]);
					setFileMetadata(data.contents[0]);
				}
			} catch (error) {
				console.error("Failed to fetch file metadata:", error);
			}
		};

		fetchFileMetadata();
	}, [shareInfo, linkId, currentPassword]);

	useEffect(() => {
		if (isAuthenticated && shareInfo) {
			if (currentPath !== sharedCurrentDir) {
				setSharedCurrentDir(currentPath);
			}
		}
	}, [
		currentPath,
		isAuthenticated,
		shareInfo,
		sharedCurrentDir,
		setSharedCurrentDir,
	]);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Spinner />
				<p className="text-[var(--gray-11)]">Loading share...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<Card className="max-w-md w-full p-6 text-center">
					<AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
					<p className="text-xl text-center font-bold mb-2 text-[var(--gray-12)]">
						Share Link Error
					</p>
					<p className="text-red-500 text-center">{error}</p>
				</Card>
			</div>
		);
	}

	if (isPasswordRequired) {
		return (
			<div className="min-h-screen flex items-center justify-center px-4">
				<Card className="mx-auto">
					<div className="text-center p-3 font-sans">
						<h2 className="text-2xl font-bold mb-2">Password Required</h2>
						<p className="text-sm">
							This shared {shareInfo?.isFile ? "file" : "folder"} is protected
						</p>
					</div>

					<div className="p-3 font-sans">
						<form onSubmit={handlePasswordSubmit} className="space-y-4">
							<div>
								<label
									htmlFor="password-input"
									className="block text-sm font-medium mb-2 text-[var(--gray-12)]">
									Password
								</label>
								<TextField.Root
									id="password-input"
									type="password"
									placeholder="••••••••"
									value={password}
									onChange={(e) => {
										setPassword(e.target.value);
										setPasswordError(null);
									}}
									className="w-full"
									size="3"
									required
								/>
								{passwordError && (
									<div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
										<AlertCircle className="h-4 w-4" />
										<p>{passwordError}. Please try again.</p>
									</div>
								)}
							</div>
							<Button type="submit" className="!w-full cursor-pointer" size="3">
								Access {shareInfo?.isFile ? "File" : "Folder"}
							</Button>
						</form>

						<div className="mt-4 pt-4 border-t border-[var(--gray-a5)]">
							<p className="text-xs text-center text-[var(--gray-11)]">
								Contact the person who shared this link if you need the password
							</p>
						</div>
					</div>
				</Card>
			</div>
		);
	}

	if (!isAuthenticated || !shareInfo) {
		return null;
	}

	if (shareInfo.isFile) {
		return (
			<Suspense fallback={<p>Loading...</p>}>
				<div className="flex h-screen font-mono">
					<div className="flex-1 md:ml-0">
						<div className="flex-1 h-screen flex flex-col">
							<div className="bg-[var(--color-background)] border-b border-[var(--gray-a5)] p-4">
								<div className="flex items-center justify-between">
									<Text as="p" size="2">
										Shared by {shareInfo.sharedBy}
									</Text>
									<Badge variant="soft">
										Exp:{" "}
										{new Date(shareInfo.expiresAt).toLocaleDateString(
											undefined,
											{
												month: "short",
												day: "numeric",
												year: "2-digit",
												hour: "2-digit",
												minute: "2-digit",
											}
										)}
									</Badge>
								</div>
							</div>
							<div className="flex-1 p-4">
								<div className="max-w-sm mx-auto">
									{fileMetadata && (
										<>
											<FileGridItem
												item={fileMetadata}
												isSelected={false}
												onClick={() => {}}
												onDoubleClick={handlePreviewSharedFile}
												onContextMenu={() => {}}
											/>
											<div className="mt-4 flex justify-center gap-3">
												<Button
													size="3"
													variant="soft"
													onClick={handlePreviewSharedFile}
													className="flex-1 flex items-center justify-center gap-2 cursor-pointer">
													<Eye size="18" />
													Preview
												</Button>
												<Button
													size="3"
													onClick={handleDownloadSharedFile}
													className="flex-1 flex items-center justify-center gap-2 cursor-pointer">
													<Download size="18" />
													Download
												</Button>
											</div>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
				<ViewFile
					previewItem={previewItem || undefined}
					onClose={() => setPreviewItem(null)}
					isSharedView={true}
					linkId={linkId}
					userId={shareInfo.userId}
					password={currentPassword}
				/>
			</Suspense>
		);
	}

	return (
		<Suspense fallback={<p>Loading...</p>}>
			<div className="flex h-screen font-mono">
				<Sidebar
					isOpen={IsOpenSideBarMenu}
					onClose={() => setOpenSideBarMenu(false)}
					isSharedView={true}
				/>
				{IsOpenSideBarMenu && (
					<div
						className="fixed inset-0 bg-black/30 md:hidden z-40"
						onClick={() => setOpenSideBarMenu(false)}
						aria-hidden="true"
					/>
				)}
				<div className="flex-1 md:ml-0">
					<div className="flex-1 h-screen flex flex-col">
						{/* <div className="bg-[var(--color-background)] border-b border-[var(--gray-a5)] p-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<div className="md:hidden">
										<IconButton
											variant="soft"
											size="2"
											onClick={() => setOpenSideBarMenu(true)}
											className="flex-shrink-0">
											<Menu size="20" />
										</IconButton>
									</div>
									<Button variant="ghost" size="2" onClick={handleNavigateBack}>
										<ArrowLeft size="16" />
									</Button>

									<p className="text-sm md:text-base">
										Shared by {shareInfo.sharedBy}
									</p>
								</div>
								<p className="text-sm md:text-base text-neutral-500">
									Expires: {new Date(shareInfo.expiresAt).toLocaleString()}
								</p>
							</div>
						</div> */}
						<TopNav isSharedView={true} shareInfo={shareInfo} />
						<FileOperations
							isSharedView={true}
							linkId={linkId}
							password={currentPassword}
						/>
						<FileDisplay
							onNavigateToFolder={handleNavigateToFolder}
							items={sharedDirItems}
							isLoading={sharedIsLoading}
							readOnly={true}
							onOpenPreview={handleOpenPreview}
						/>
					</div>
				</div>
			</div>
			<ViewFile
				previewItem={previewItem || undefined}
				onClose={() => setPreviewItem(null)}
				isSharedView={true}
				linkId={linkId}
				userId={shareInfo.userId}
				password={currentPassword}
			/>
		</Suspense>
	);
}
