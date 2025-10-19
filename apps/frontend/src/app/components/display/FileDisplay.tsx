import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ContextMenu } from "@radix-ui/themes";

import {
	useCurrentDir,
	useCurrentDirectoryItems,
	useLoadingDirectory,
	useSearchTerm,
	useSelectedItems,
	useUploadFilesArray,
} from "@/app/store/drive-variables";
import {
	useOpenNewFileDialog,
	useOpenNewFolderDialog,
	useOpenRenameDialog,
	usePreviewOpen,
	useViewType,
	useOpenUploadDialog,
	useOpenShareDialog,
} from "@/app/store/ui-variables";

import { useDeleteItems } from "@/app/hooks/useDeleteItems";
import { useDownloadItems } from "@/app/hooks/useDownloadItems";
import { useSelectAll } from "@/app/hooks/useSelectAll";
import { useFetchDirectoryItems } from "@/app/hooks/useFetchDirItems";
import { useCopyPasteCut } from "@/app/hooks/useCopyPasteCut";

import { useKeyboardNavigation } from "@/app/hooks/useKeyboardNavigation";
import { useDragAndDrop } from "@/app/hooks/useDragAndDrop";
import { useItemSelection } from "@/app/hooks/useItemSelection";
import { useMoveItems } from "@/app/hooks/useMoveItems";

import { FileListView } from "./FileListView";
import { FileGridView } from "./FileGridView";
import { FileContextMenu } from "./FileContextMenu";

import {
	DndContext,
	closestCenter,
	PointerSensor,
	useSensors,
	useSensor,
	// DragOverlay,
	type DragStartEvent,
	type DragEndEvent,
	type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";

import type { ContentItem } from "@/lib/types";

const FileDisplay = React.memo(
	({
		onNavigateToFolder,
		items: propItems,
		isLoading: propIsLoading,
		readOnly = false,
		onOpenPreview,
	}: {
		onNavigateToFolder?: (folderPath: string) => void;
		items?: ContentItem[];
		isLoading?: boolean;
		readOnly?: boolean;
		onOpenPreview?: (item: ContentItem) => void;
	} = {}) => {
		const setCurrDir = useCurrentDir((state) => state.setDir);
		const dirContents = useCurrentDirectoryItems((state) => state.items);
		const selectedItems = useSelectedItems((state) => state.selectedItems);
		const setSelectedItems = useSelectedItems(
			(state) => state.setSelectedItems
		);
		const isLoading = useLoadingDirectory((state) => state.isLoading);
		const viewType = useViewType((state) => state.viewType);
		const items = propItems ?? dirContents;
		const loading = propIsLoading ?? isLoading;

		const openNewFolder = useOpenNewFolderDialog((state) => state.open);
		const setOpenNewFolder = useOpenNewFolderDialog((state) => state.setOpen);
		const openNewFile = useOpenNewFileDialog((state) => state.open);
		const setOpenNewFile = useOpenNewFileDialog((state) => state.setOpen);
		const previewOpen = usePreviewOpen((state) => state.open);
		const setOpenPreview = usePreviewOpen((state) => state.setOpen);
		const setOpenUploadDialog = useOpenUploadDialog((state) => state.setOpen);
		const setFilesArray = useUploadFilesArray((state) => state.setFilesArray);
		const searchTerm = useSearchTerm((state) => state.searchTerm);
		const setSearchTerm = useSearchTerm((state) => state.setSearchTerm);
		const renameOpen = useOpenRenameDialog((state) => state.open);
		const setOpenRenameDialog = useOpenRenameDialog((state) => state.setOpen);
		const shareDialogOpen = useOpenShareDialog((state) => state.open);
		const setOpenShareDialog = useOpenShareDialog((state) => state.setOpen);
		const { moveItems } = useMoveItems();

		const { handleDeleteItems } = useDeleteItems();
		const { handleDownload } = useDownloadItems();
		const { selectAll } = useSelectAll(items);
		const { manualRefresh } = useFetchDirectoryItems();
		const { handleCopyItems, handleCutItems, handlePasteItems } =
			useCopyPasteCut();

		const [dragGroupIds, setDragGroupIds] = useState<string[]>([]);
		// const [activeDragId, setActiveDragId] = useState<string | null>(null);
		const itemsById = useMemo(() => {
			const m = new Map<string, ContentItem>();
			(items ?? []).forEach((it: ContentItem) => m.set(it.id, it));
			return m;
		}, [items]);

		const { handleItemSelect, handleBgClick } = useItemSelection({
			selectedItems,
			setSelectedItems,
			dirContents: items,
		});

		const {
			isDragOver,
			handleDragOver,
			handleDragEnter,
			handleDragLeave,
			handleDrop,
			setupGlobalDragPrevention,
		} = useDragAndDrop({
			setFilesArray,
			setOpenUploadDialog,
		});

		const handleOpenItem = useCallback(
			(item: ContentItem) => {
				if (item.is_dir) {
					if (searchTerm) setSearchTerm(null);
					if (onNavigateToFolder) {
						onNavigateToFolder(item.id);
					} else {
						setCurrDir(item.id);
					}
				} else {
					if (onOpenPreview) {
						onOpenPreview(item);
					} else {
						setOpenPreview(true);
					}
				}
			},
			[
				searchTerm,
				setSearchTerm,
				setCurrDir,
				setOpenPreview,
				onNavigateToFolder,
				onOpenPreview,
			]
		);

		const handleDoubleClick = useCallback(
			(e: React.MouseEvent, item: ContentItem) => {
				e.stopPropagation();
				handleOpenItem(item);
			},
			[handleOpenItem]
		);

		const handleItemContextMenu = useCallback(
			(item: ContentItem) => {
				if (!selectedItems.has(item)) setSelectedItems(new Set([item]));
			},
			[selectedItems, setSelectedItems]
		);

		const handleInputClick = () => {
			const input = document.getElementById("upload-file");
			if (input) input.click();
		};

		const sensors = useSensors(
			useSensor(PointerSensor, {
				activationConstraint: {
					distance: 5,
				},
			})
		);

		const isKbDisabled =
			openNewFile ||
			openNewFolder ||
			renameOpen ||
			previewOpen ||
			shareDialogOpen;

		useKeyboardNavigation({
			selectedItems,
			dirContents: items,
			viewType,
			setSelectedItems,
			handleOpenItem,
			selectAll,
			setOpenNewFolder,
			setOpenNewFile,
			setOpenRenameDialog,
			setOpenShareDialog: readOnly ? undefined : setOpenShareDialog,
			openNewFile,
			openNewFolder,
			isDisabled: isKbDisabled,
			disableModificationShortcuts: readOnly,
		});

		useEffect(() => {
			if (!readOnly) {
				const cleanup = setupGlobalDragPrevention();
				return cleanup;
			}
		}, [setupGlobalDragPrevention, readOnly]);

		const handleDragStart = useCallback(
			(event: DragStartEvent) => {
				if (readOnly) return;

				const id = String(event?.active?.id ?? "");
				if (!id) return;
				const selectedIds = Array.from(selectedItems).map((i) => i.id);
				const group = selectedIds.includes(id) ? selectedIds : [id];
				setDragGroupIds(group);
				// setActiveDragId(id);
			},
			[selectedItems, readOnly]
		);

		const handleDragEnd = useCallback(
			(event: DragEndEvent) => {
				if (readOnly) return;

				const overId = event.over?.id as UniqueIdentifier | undefined;
				const activeId = event.active?.id as UniqueIdentifier | undefined;

				// setActiveDragId(null);
				const group = dragGroupIds;
				setDragGroupIds([]);

				if (!overId || !activeId) return;
				if (!group || group.length === 0) return;

				const target = itemsById.get(String(overId));
				if (!target || !target.is_dir) return;

				const targetDir = target.id;
				const sourceIds = group;
				if (
					sourceIds.some(
						(sid) => sid === targetDir || targetDir.startsWith(sid + "/")
					)
				) {
					return;
				}
				const sameParent = sourceIds.every(
					(sid) => sid.split("/").slice(0, -1).join("/") === targetDir
				);
				if (sameParent) return;

				moveItems(sourceIds, targetDir).catch(() => {});
			},
			[dragGroupIds, itemsById, moveItems, readOnly]
		);

		const handleContextMenuDownload = useCallback(() => {
			if (selectedItems.size <= 0) return;
			handleDownload();
		}, [selectedItems.size, handleDownload]);

		const handleContextMenuRename = useCallback(() => {
			if (!(selectedItems.size === 1)) return;
			setOpenRenameDialog(true);
		}, [selectedItems.size, setOpenRenameDialog]);

		const handleContextMenuNewFolder = useCallback(() => {
			setOpenNewFolder(true);
		}, [setOpenNewFolder]);

		const handleContextMenuNewFile = useCallback(() => {
			setOpenNewFile(true);
		}, [setOpenNewFile]);

		const handleContextMenuUpload = useCallback(() => {
			handleInputClick();
		}, []);

		const handleContextMenuRefresh = useCallback(() => {
			manualRefresh();
		}, [manualRefresh]);

		const handleContextMenuDelete = useCallback(() => {
			if (selectedItems.size <= 0) return;
			handleDeleteItems();
		}, [selectedItems.size, handleDeleteItems]);

		const handleContextMenuCopy = useCallback(() => {
			if (selectedItems.size <= 0) return;
			handleCopyItems();
		}, [selectedItems.size, handleCopyItems]);

		const handleContextMenuCut = useCallback(() => {
			if (selectedItems.size <= 0) return;
			handleCutItems();
		}, [selectedItems.size, handleCutItems]);

		const handleContextMenuPaste = useCallback(() => {
			handlePasteItems();
		}, [handlePasteItems]);

		const handleContextMenuShare = useCallback(() => {
			if (selectedItems.size <= 0) return;
			setOpenShareDialog(true);
		}, [selectedItems.size, setOpenShareDialog]);

		return (
			<DndContext
				sensors={sensors}
				autoScroll={{ layoutShiftCompensation: true }}
				collisionDetection={closestCenter}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				modifiers={[restrictToWindowEdges]}>
				<ContextMenu.Root>
					<ContextMenu.Trigger>
						<div
							className={`flex-1 p-4 overflow-auto transition-colors relative ${
								isDragOver && !readOnly
									? "bg-[var(--accent-3)] border-2 border-dashed border-[var(--accent-6)]"
									: ""
							}`}
							onClick={handleBgClick}
							onDragEnter={readOnly ? undefined : handleDragEnter}
							onDragOver={readOnly ? undefined : handleDragOver}
							onDragLeave={readOnly ? undefined : handleDragLeave}
							onDrop={readOnly ? undefined : handleDrop}>
							{viewType === "list" ? (
								<FileListView
									dirContents={items}
									isLoading={loading}
									selectedItems={selectedItems}
									setSelectedItems={setSelectedItems}
									onItemClick={handleItemSelect}
									onItemDoubleClick={handleDoubleClick}
									onItemContextMenu={handleItemContextMenu}
								/>
							) : (
								<FileGridView
									dirContents={items}
									isLoading={loading}
									selectedItems={selectedItems}
									onItemClick={handleItemSelect}
									onItemDoubleClick={handleDoubleClick}
									onItemContextMenu={handleItemContextMenu}
								/>
							)}
						</div>
					</ContextMenu.Trigger>

					<FileContextMenu
						selectedItems={selectedItems}
						searchTerm={searchTerm}
						onCopy={readOnly ? undefined : handleContextMenuCopy}
						onCut={readOnly ? undefined : handleContextMenuCut}
						onPaste={readOnly ? undefined : handleContextMenuPaste}
						onDownload={handleContextMenuDownload}
						onRename={readOnly ? undefined : handleContextMenuRename}
						onNewFolder={readOnly ? undefined : handleContextMenuNewFolder}
						onNewFile={readOnly ? undefined : handleContextMenuNewFile}
						onUpload={readOnly ? undefined : handleContextMenuUpload}
						onRefresh={handleContextMenuRefresh}
						onDelete={readOnly ? undefined : handleContextMenuDelete}
						onShare={readOnly ? undefined : handleContextMenuShare}
					/>
				</ContextMenu.Root>{" "}
				{/* <DragOverlay style={{ pointerEvents: "none" }}>
				{activeDragId ? (
					<div className="px-3 py-2 rounded-md w-fit bg-[var(--accent-9)] text-white text-sm shadow-lg">
						{dragGroupIds.length > 1 ? (
							<span>{dragGroupIds.length} items</span>
						) : (
							<span>{itemsById.get(activeDragId)?.name ?? "Item"}</span>
						)}
					</div>
				) : null}
			</DragOverlay> */}
			</DndContext>
		);
	}
);

FileDisplay.displayName = "FileDisplay";

export default FileDisplay;
