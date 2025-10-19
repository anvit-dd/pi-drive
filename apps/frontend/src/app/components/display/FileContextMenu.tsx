import React from "react";
import { ContextMenu } from "@radix-ui/themes";
import type { ContentItem } from "@/lib/types";

interface FileContextMenuProps {
	selectedItems: Set<ContentItem>;
	searchTerm: string | null;
	onCopy?: () => void;
	onCut?: () => void;
	onPaste?: () => void;
	onDownload?: () => void;
	onRename?: () => void;
	onNewFolder?: () => void;
	onNewFile?: () => void;
	onUpload?: () => void;
	onRefresh?: () => void;
	onDelete?: () => void;
	onShare?: () => void;
}

export function FileContextMenu({
	selectedItems,
	searchTerm,
	onCopy,
	onCut,
	onPaste,
	onDownload,
	onRename,
	onNewFolder,
	onNewFile,
	onUpload,
	onRefresh,
	onDelete,
	onShare,
}: FileContextMenuProps) {
	return (
		<ContextMenu.Content>
			{selectedItems && selectedItems.size > 0 && (
				<>
					{onCopy && (
						<ContextMenu.Item
							shortcut="⌘ C"
							disabled={selectedItems.size <= 0}
							onClick={() => {
								if (selectedItems.size <= 0) return;
								onCopy();
							}}>
							Copy
						</ContextMenu.Item>
					)}
					{onCut && (
						<ContextMenu.Item
							shortcut="⌘ X"
							disabled={selectedItems.size <= 0}
							onClick={() => {
								if (selectedItems.size <= 0) return;
								onCut();
							}}>
							Cut
						</ContextMenu.Item>
					)}
					{onDownload && (
						<ContextMenu.Item
							disabled={selectedItems.size <= 0}
							onClick={() => {
								if (selectedItems.size <= 0) return;
								onDownload();
							}}>
							Download
						</ContextMenu.Item>
					)}
					{onRename && (
						<ContextMenu.Item
							shortcut="⇧ R"
							disabled={!(selectedItems.size === 1)}
							onClick={() => {
								if (!(selectedItems.size === 1)) return;
								onRename();
							}}>
							Rename
						</ContextMenu.Item>
					)}
					{onShare && (
						<ContextMenu.Item
							shortcut="⌘ S"
							disabled={selectedItems.size <= 0}
							onClick={() => {
								if (selectedItems.size <= 0) return;
								onShare();
							}}>
							Share
						</ContextMenu.Item>
					)}
					<ContextMenu.Separator />
				</>
			)}
			{onPaste && (
				<ContextMenu.Item shortcut="⌘ V" onClick={onPaste}>
					Paste
				</ContextMenu.Item>
			)}
			{!searchTerm && (
				<>
					{onNewFolder && (
						<ContextMenu.Item shortcut="⌘ ⇧ N" onClick={onNewFolder}>
							New Folder
						</ContextMenu.Item>
					)}
					{onNewFile && (
						<ContextMenu.Item shortcut="⇧ N" onClick={onNewFile}>
							New File
						</ContextMenu.Item>
					)}
				</>
			)}

			{onUpload && (
				<ContextMenu.Item shortcut="⇧ U" onClick={onUpload}>
					Upload Files
				</ContextMenu.Item>
			)}

			{onRefresh && (
				<ContextMenu.Item shortcut="⌘ R" onClick={onRefresh}>
					Refresh
				</ContextMenu.Item>
			)}
			<ContextMenu.Separator />
			{onDelete && (
				<ContextMenu.Item
					color="red"
					onClick={() => {
						if (selectedItems.size <= 0) return;
						onDelete();
					}}>
					Delete
				</ContextMenu.Item>
			)}
		</ContextMenu.Content>
	);
}
