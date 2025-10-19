"use client";

import {
	Badge,
	Button,
	Checkbox,
	IconButton,
	Spinner,
	DropdownMenu,
} from "@radix-ui/themes";
import {
	Trash2,
	Download,
	Grid3X3,
	List,
	Copy,
	Scissors,
	Clipboard,
	Share2,
	MoreVertical,
	FolderPlus,
} from "lucide-react";
import {
	useCurrentDirectoryItems,
	useSelectedItems,
	useSharedItems,
} from "../../store/drive-variables";
import {
	useIsDownloading,
	useLoadingNewFolder,
	useViewType,
} from "../../store/ui-variables";
import NewFolderDialog from "../dialogs/NewFolder";
import { useDeleteItems } from "../../hooks/useDeleteItems";
import { useCreateFolder } from "../../hooks/useCreateFolder";
import { useDownloadItems } from "../../hooks/useDownloadItems";
import { useSelectAll } from "../../hooks/useSelectAll";
import { useCopyPasteCut } from "../../hooks/useCopyPasteCut";
import ViewFile from "../dialogs/ViewFile";
import RenameDialog from "../dialogs/RenameItem";
import ShareItem from "../dialogs/ShareItem";
import { useOpenShareDialog } from "../../store/ui-variables";
import { useOpenNewFolderDialog } from "../../store/ui-variables";

export default function FileOperations({
	isSharedView = false,
	linkId,
	password,
}: {
	isSharedView?: boolean;
	linkId?: string;
	password?: string;
}) {
	const viewType = useViewType((state) => state.viewType);
	const setViewType = useViewType((state) => state.setViewType);

	const selectedItems = useSelectedItems((state) => state.selectedItems);
	const currDirItems = useCurrentDirectoryItems((state) => state.items);

	const isLoadingNewFolder = useLoadingNewFolder((state) => state.isLoading);
	const setIsLoadingNewFolder = useLoadingNewFolder(
		(state) => state.setIsLoading
	);

	const sharedItems = useSharedItems((state) => state.sharedDirItems);

	const isDownloading = useIsDownloading((state) => state.open);

	const { handleDeleteItems, isLoadingDelete } = useDeleteItems();
	const { handleCreateFolder } = useCreateFolder();
	const { handleDownload, downloadPercent } = useDownloadItems(
		isSharedView,
		linkId,
		password
	);
	const { handleCopyItems, handleCutItems, handlePasteItems } =
		useCopyPasteCut();

	const { selectAll, deselectAll } = useSelectAll(
		isSharedView ? sharedItems : undefined
	);

	const setIsNewFolderDialogOpen = useOpenNewFolderDialog((s) => s.setOpen);

	const setOpenShare = useOpenShareDialog(
		(s: unknown) => (s as { setOpen: (open: boolean) => void }).setOpen
	);
	const handleShareItems = () => {
		if (selectedItems.size === 0) return;

		setOpenShare(true);
	};

	const handleCheckSelectItems = (checked: boolean) => {
		if (checked) {
			selectAll();
			return;
		}
		deselectAll();
		return;
	};

	return (
		<div className="flex items-center justify-between gap-x-2 border-b px-4 py-2 w-full">
			<div className="flex items-center justify-start gap-x-2">
				<Checkbox
					checked={
						(isSharedView ? sharedItems.length > 0 : currDirItems.length > 0) &&
						selectedItems.size ===
							(isSharedView ? sharedItems.length : currDirItems.length)
					}
					disabled={currDirItems.length === 0 && sharedItems.length === 0}
					onCheckedChange={(checked: boolean) =>
						handleCheckSelectItems(checked)
					}
				/>
				<Badge size="3" className="!font-sans">
					{selectedItems.size} selected
				</Badge>

				<div className="flex items-center gap-x-2 ">
					{!isSharedView && (
						<>
							<Button
								variant="soft"
								className="!hidden lg:!flex !cursor-pointer"
								onClick={() => setIsNewFolderDialogOpen(true)}>
								<FolderPlus size="20" />
								New Folder
							</Button>

							<IconButton
								variant="soft"
								className="!flex lg:!hidden"
								onClick={() => setIsNewFolderDialogOpen(true)}>
								<FolderPlus size="16" />
							</IconButton>
						</>
					)}
					{/* <Button
								variant="soft"
								className="!hidden lg:!flex !cursor-pointer"
								onClick={() => setIsNewFileDialogOpen(true)}>
								<FilePlus size="20" />
								New File
							</Button> */}

					{/* <IconButton
						variant="soft"
						className="!flex lg:!hidden"
						onClick={() => setIsNewFileDialogOpen(true)}>
						<FilePlus size="16" />
					</IconButton> */}
				</div>

				{selectedItems.size > 0 && (
					<div className="flex items-center gap-x-2">
						<Button
							id="download-button"
							variant="soft"
							className="!hidden lg:!flex !cursor-pointer"
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

						{!isSharedView && (
							<Button
								variant="soft"
								className="!hidden lg:!flex !cursor-pointer"
								onClick={handleShareItems}>
								<Share2 size="20" />
								Share
							</Button>
						)}

						{!isSharedView && (
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									<Button
										variant="soft"
										className="!hidden lg:!flex !cursor-pointer">
										<MoreVertical size="20" />
										More
									</Button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content>
									<DropdownMenu.Item onClick={handleCopyItems}>
										<Copy size="16" />
										Copy
									</DropdownMenu.Item>
									<DropdownMenu.Item onClick={handleCutItems}>
										<Scissors size="16" />
										Cut
									</DropdownMenu.Item>
									<DropdownMenu.Item onClick={handlePasteItems}>
										<Clipboard size="16" />
										Paste
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						)}
						{!isSharedView && (
							<Button
								className="!hidden lg:!flex !cursor-pointer"
								color="red"
								onClick={() => handleDeleteItems()}
								disabled={isLoadingDelete}
								loading={isLoadingDelete}>
								<Trash2 size="20" />
								Delete
							</Button>
						)}

						<IconButton
							id="download-button-mobile"
							variant="soft"
							className="!flex lg:!hidden"
							onClick={handleDownload}
							disabled={isDownloading}>
							{isDownloading ? (
								<p className="text-xs">{downloadPercent}%</p>
							) : (
								<Download size="16" />
							)}
						</IconButton>

						{!isSharedView && (
							<IconButton
								variant="soft"
								className="!flex lg:!hidden"
								onClick={handleShareItems}>
								<Share2 size="16" />
							</IconButton>
						)}

						{!isSharedView && (
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									<IconButton variant="soft" className="!flex lg:!hidden">
										<MoreVertical size="16" />
									</IconButton>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content>
									<DropdownMenu.Item onClick={handleCopyItems}>
										<Copy size="16" />
										Copy
									</DropdownMenu.Item>
									<DropdownMenu.Item onClick={handleCutItems}>
										<Scissors size="16" />
										Cut
									</DropdownMenu.Item>
									<DropdownMenu.Item onClick={handlePasteItems}>
										<Clipboard size="16" />
										Paste
									</DropdownMenu.Item>
									<DropdownMenu.Separator />
									<DropdownMenu.Item
										onClick={() => handleDeleteItems()}
										color="red">
										<Trash2 size="16" />
										Delete
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						)}
					</div>
				)}
			</div>

			<div className="flex w-8 md:w-20 h-8 overflow-hidden">
				<IconButton
					variant="outline"
					onClick={() => {
						if (viewType === "grid") {
							setViewType("list");
						} else {
							setViewType("grid");
						}
					}}
					className={`!h-full !w-full md:!hidden flex items-center justify-center transition-all duration-200 text-white`}>
					{viewType === "grid" ? <Grid3X3 size="18" /> : <List size="18" />}
				</IconButton>

				<div className="border-2 rounded-md flex md:w-20 overflow-hidden">
					<button
						onClick={() => setViewType("grid")}
						className={`rounded-r-none w-1/2 h-full hidden md:flex items-center justify-center transition-all duration-200 ${
							viewType === "grid"
								? "bg-[var(--accent-9)] text-white"
								: ""
						}`}>
						<Grid3X3 size="18" />
					</button>

					<button
						onClick={() => setViewType("list")}
						className={`rounded-l-none w-1/2 h-full hidden md:flex items-center justify-center transition-all duration-200 ${
							viewType === "list"
								? "bg-[var(--accent-9)] text-white"
								: ""
						}`}>
						<List size="18" className="" />
					</button>
				</div>
			</div>

			<NewFolderDialog
				createFolder={handleCreateFolder}
				isLoading={isLoadingNewFolder}
				setIsLoading={setIsLoadingNewFolder}
				// open={isNewFolderDialogOpen}
				// onOpenChange={setIsNewFolderDialogOpen}
			/>
			<RenameDialog />
			<ViewFile />
			<ShareItem />
		</div>
	);
}
