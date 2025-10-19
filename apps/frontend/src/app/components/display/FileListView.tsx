import React from "react";
import { FileListItem } from "./FileListItem";
import LoadingDisplay from "./LoadingDisplay";
import EmptyFolder from "./EmptyFolder";
import type { ContentItem } from "@/lib/types";

interface FileListViewProps {
	dirContents: ContentItem[] | null;
	isLoading: boolean;
	selectedItems: Set<ContentItem>;
	setSelectedItems: (items: Set<ContentItem>) => void;
	onItemClick: (e: React.MouseEvent, item: ContentItem) => void;
	onItemDoubleClick: (e: React.MouseEvent, item: ContentItem) => void;
	onItemContextMenu: (item: ContentItem) => void;
}

export function FileListView({
	dirContents,
	isLoading,
	selectedItems,
	setSelectedItems,
	onItemClick,
	onItemDoubleClick,
	onItemContextMenu,
}: FileListViewProps) {
	const isSelected = (item: ContentItem) =>
		[...selectedItems].some((itm) => itm.id === item.id);

	const handleCheckboxChange = (item: ContentItem, checked: boolean) => {
		console.log("CHECKED");
		if (checked) {
			setSelectedItems(new Set([...selectedItems, item]));
		} else {
			const newSelection = new Set(selectedItems);
			newSelection.delete(item);
			setSelectedItems(newSelection);
		}
	};

	return (
		<div className="border border-[var(--gray-a5)] rounded-lg overflow-hidden">
			<div className="bg-[var(--gray-a2)] border-b border-[var(--gray-a5)] px-4 py-3">
				<div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto] gap-4 items-center text-sm font-medium text-[var(--gray-11)]">
					<div className="w-6" data-checkbox></div>
					<div className="w-8"></div>
					<div>Name</div>
					<div className="text-center min-w-[80px] hidden md:block">Size</div>
					<div className="text-center min-w-[80px] hidden md:block">Type</div>
					<div className="text-center min-w-[100px] hidden md:block">
						Modified
					</div>
				</div>
			</div>

			<div className="divide-y divide-[var(--gray-a5)]">
				{isLoading ? (
					<LoadingDisplay />
				) : dirContents && dirContents.length > 0 ? (
					dirContents.map((item: ContentItem) => (
						<FileListItem
							key={item.id}
							item={item}
							isSelected={isSelected(item)}
							onClick={(e) => onItemClick(e, item)}
							onDoubleClick={(e) => onItemDoubleClick(e, item)}
							onContextMenu={() => onItemContextMenu(item)}
							onCheckboxChange={(checked) =>
								handleCheckboxChange(item, checked)
							}
						/>
					))
				) : (
					<EmptyFolder />
				)}
			</div>
		</div>
	);
}
