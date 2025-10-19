import { Button, Flex, Text } from "@radix-ui/themes";
import { File, Folder, Upload, X } from "lucide-react";
import {
	useOpenNewFileDialog,
	useOpenNewFolderDialog,
	useOpenUploadDialog,
} from "../store/ui-variables";
import { DropdownMenu } from "@radix-ui/themes";
import {
	useCurrentDir,
	useCurrentUser,
	useTotalStorage,
	useUploadFilesArray,
} from "../store/drive-variables";
import type { FilesWithStatus } from "@/lib/types";
import readable_size from "@/lib/readable_size";
import { ChangeEvent, useRef } from "react";
import { useCreateFolder } from "../hooks/useCreateFolder";

export default function Sidebar({
	isOpen,
	onClose,
	isSharedView = false,
}: {
	isOpen: boolean;
	onClose: () => void;
	isSharedView?: boolean;
}) {
	const setOpenNewFolder = useOpenNewFolderDialog((state) => state.setOpen);
	const setOpenNewFile = useOpenNewFileDialog((state) => state.setOpen);

	const setCurrDirectory = useCurrentDir((state) => state.setDir);

	const { handleCreateFolder } = useCreateFolder();

	const setIsUploadDialog = useOpenUploadDialog((state) => state.setOpen);

	const user = useCurrentUser((state) => state.user);

	const uploadFileRef = useRef<HTMLInputElement>(null);
	const uploadFolderRef = useRef<HTMLInputElement>(null);
	const triggerRef = useRef<HTMLSpanElement>(null);

	const currStorage = useTotalStorage((state) => state.currStorage);

	const setFilesArray = useUploadFilesArray((state) => state.setFilesArray);

	const handleCalcPercentage = (byteSize: number) => {
		return ((byteSize / 107374182400) * 100).toFixed(2);
	};

	const handleInitializeUpload = (
		e: ChangeEvent<HTMLInputElement>,
		isFolder: boolean = false
	) => {
		const files = Array.from(e.target.files || []);
		if (files.length === 0) return;

		if (isFolder) {
			const subFolderNamesSet = new Set<string>();
			const filesWithStatus: FilesWithStatus[] = [];
			let topLevel: string | null = null;
			for (const file of files) {
				const withRel = file as File & { webkitRelativePath?: string };
				const fullRelPath = withRel.webkitRelativePath || file.name;
				const pathParts = fullRelPath.split("/").filter(Boolean);
				if (pathParts.length > 1) {
					if (!topLevel) topLevel = pathParts[0];
					const folderPathParts = pathParts.slice(0, -1);
					const folderPath = folderPathParts.join("/");
					if (folderPath) subFolderNamesSet.add(folderPath);
					filesWithStatus.push({
						file,
						progress: 0,
						isFolderUpload: true,
						path: folderPath,
						status: "pending" as const,
					});
				} else {
					filesWithStatus.push({
						file,
						progress: 0,
						isFolderUpload: true,
						path: "",
						status: "pending" as const,
					});
				}
			}

			Array.from(subFolderNamesSet)
				.sort((a, b) => a.split("/").length - b.split("/").length)
				.forEach((sf) => {
					if (sf && sf !== topLevel) handleCreateFolder(sf);
				});

			if (filesWithStatus.length > 0) {
				setFilesArray((prev) => [...prev, ...filesWithStatus]);
				setIsUploadDialog(true);
			}
			return;
		}
		const filesWithStatus: FilesWithStatus[] = files.map((file) => ({
			file,
			progress: 0,
			status: "pending" as const,
		}));
		setFilesArray((prev) => [...prev, ...filesWithStatus]);
		setIsUploadDialog(true);
	};

	return (
		<nav
			className={`
        fixed md:static top-0 left-0 h-screen max-w-72 w-72 bg-[var(--color-background)] border-r border-[var(--gray-a5)] p-4 flex flex-col justify-between z-50 transform transition-transform duration-300 ease-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
			<div>
				<Flex direction="row" justify="between" align="center" className="mb-8">
					<h1 className="text-3xl md:text-4xl font-semibold">
						<Text className="text-[var(--accent-a10)]">pi</Text>
						<Text>Drive</Text>
					</h1>
					<Button
						variant="ghost"
						size="1"
						onClick={onClose}
						className="block md:!hidden">
						<X size="16" />
					</Button>
				</Flex>
				{!isSharedView && (
					<Button size="3" radius="medium" className="!w-full gap-2 !px-0">
						<input
							id="upload-file"
							type="file"
							multiple
							hidden
							ref={uploadFileRef}
							onChange={(e) => handleInitializeUpload(e, false)}
						/>
						<input
							id="upload-folder"
							type="file"
							hidden
							multiple
							ref={uploadFolderRef}
							onChange={(e) => handleInitializeUpload(e, true)}
							// @ts-expect-error - webkitdirectory is a non-standard attribute
							webkitdirectory=""
						/>
						<>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger className="">
									<Text
										ref={triggerRef}
										className="font-sans flex justify-center items-center gap-2 w-full h-full"
										onClick={(e) => e.stopPropagation()}>
										<Upload size="18" />
										Upload
									</Text>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content
									align="center"
									style={{ width: triggerRef.current?.offsetWidth }}
									className="bg-[var(--color-panel)] border border-[var(--gray-a5)] rounded shadow-md font-sans text-[var(--gray-11)]"
									sideOffset={4}>
									<DropdownMenu.Item
										onClick={(e) => {
											e.stopPropagation();
											console.log(uploadFileRef.current);
											uploadFileRef.current?.click();
										}}
										className="px-3 py-1 hover:bg-[var(--gray-a3)] rounded cursor-pointer flex justify-between items-center">
										<div className="flex items-center gap-x-2">
											<File size="15" />
											Upload File
										</div>
										<span>⇧ U</span>
									</DropdownMenu.Item>

									<DropdownMenu.Item
										onClick={(e) => {
											e.stopPropagation();
											uploadFolderRef.current?.click();
										}}
										className="px-3 py-1 hover:bg-[var(--gray-a3)] rounded cursor-pointer flex justify-between items-center">
										<div className="flex items-center gap-x-2">
											<Folder size="15" />
											Upload Folder
										</div>
										<span>⌘ ⇧ U</span>
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</>
					</Button>
				)}

				<div className="my-4">
					<Flex direction="column" gap="4">
						{isSharedView ? (
							<>
								<Button
									size="2"
									variant="surface"
									className="!font-sans"
									onClick={() => setCurrDirectory("Home")}>
									Home
								</Button>
								{!user && (
									<Button
										variant="surface"
										className="!font-sans"
										onClick={() => window.open("/login")}>
										Login
									</Button>
								)}
							</>
						) : (
							<>
								<Button
									size="2"
									variant="surface"
									className="!font-sans"
									onClick={() => setCurrDirectory("Home")}>
									Home
								</Button>
								<Button
									size="2"
									variant="surface"
									className="!font-sans"
									onClick={() => setOpenNewFolder(true)}>
									New Folder
								</Button>
								<Button
									size="2"
									variant="surface"
									className="!font-sans"
									onClick={() => setOpenNewFile(true)}>
									New File
								</Button>
							</>
						)}
					</Flex>
				</div>

				{!isSharedView && (
					<div className="p-4 rounded-md border border-[var(--gray-a5)]">
						<Flex align="center" justify="between">
							<Text size="2" className="mb-2">
								Storage
							</Text>
							<Text
								size="1"
								weight="medium"
								className="block mb-2"
								color="gray">
								{handleCalcPercentage(currStorage)}%
							</Text>
						</Flex>
						<div className="h-2 w-full bg-[var(--gray-a5)] rounded-full overflow-hidden my-2">
							<div
								className="bg-[var(--accent-9)] h-full transition-all duration-1000"
								style={{ width: `${handleCalcPercentage(currStorage)}%` }}
							/>
						</div>
						<Text size="2" color="gray" weight="medium">
							{readable_size(currStorage)} of 100 GB
						</Text>
					</div>
				)}
			</div>

			<div className="text-sm text-neutral-500 text-center">
				<Text>© 2025 piDrive</Text>
			</div>
		</nav>
	);
}
