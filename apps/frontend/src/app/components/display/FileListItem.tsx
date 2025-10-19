import React from "react";
import { Checkbox, Badge } from "@radix-ui/themes";
import { ItemFileIcon } from "@/components/getFileIcon";
import readable_size from "@/lib/readable_size";
import convertToRelativeTime from "@/lib/relative_time";
import type { ContentItem } from "@/lib/types";
import { useDraggable, useDroppable } from "@dnd-kit/core";

interface FileListItemProps {
	item: ContentItem;
	isSelected: boolean;
	onClick: (e: React.MouseEvent) => void;
	onDoubleClick: (e: React.MouseEvent) => void;
	onContextMenu: () => void;
	onCheckboxChange: (checked: boolean) => void;
}

export function FileListItem({
	item,
	isSelected,
	onClick,
	onDoubleClick,
	onContextMenu,
	onCheckboxChange,
}: FileListItemProps) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({ id: item.id, disabled: !isSelected });

	const { setNodeRef: setDropRef, isOver } = useDroppable({ id: item.id });
	return (
		<div
			data-item="true"
			ref={(node) => {
				setNodeRef(node);
				setDropRef(node);
			}}
			{...listeners}
			{...attributes}
			data-item-id={item.id}
			className={`grid grid-cols-[auto_auto_1fr_auto_auto_auto] gap-4 items-center py-3 px-2 cursor-pointer transition-colors display-item ${
				isSelected
					? "bg-[var(--accent-a3)] border-l-2 border-l-[var(--accent-9)]"
					: ""
			}`}
			style={{
				transform: transform
					? `translate3d(${transform.x}px, ${transform.y}px, 0)`
					: undefined,
				opacity: isDragging ? 0.6 : 1,
				backgroundColor: isOver ? "var(--accent-a2)" : undefined,
				zIndex: isDragging ? 999 : undefined,
				transition: isDragging ? "none" : "transform 150ms ease",
				cursor: isSelected ? "grab" : undefined,
			}}
			onClick={onClick}
			onDoubleClick={onDoubleClick}
			onContextMenu={onContextMenu}>
			<div className="w-6 translate-y-1.5" data-checkbox>
				<Checkbox
					onClick={(e) => e.stopPropagation()}
					checked={isSelected}
					onCheckedChange={onCheckboxChange}
				/>
			</div>

			<div className="w-8 flex justify-center">
				<ItemFileIcon item={item} size="medium" />
			</div>

			<div className="font-medium text-[var(--gray-12)] select-none min-w-0">
				<div className="truncate" title={item.name}>
					{item.name.length > 30 ? `${item.name.slice(0, 30)}...` : item.name}
					<p className="md:hidden text-sm text-[var(--gray-11)]">
						{!item.is_dir ? readable_size(item.size) : item.no_items + " items"}
					</p>
				</div>
			</div>

			<div className="text-sm text-[var(--gray-11)] text-center font-mono select-none min-w-[80px] hidden md:block">
				{item.is_dir ? (
					<span className="text-[var(--gray-9)]">—</span>
				) : (
					readable_size(item.size)
				)}
			</div>

			<div className="text-center min-w-[80px] hidden md:block">
				{item.is_dir ? (
					<Badge variant="outline" className="select-none">
						Folder
					</Badge>
				) : (
					<Badge className="select-none">{item.extension || "File"}</Badge>
				)}
			</div>

			<div className="text-sm text-[var(--gray-11)] text-center select-none min-w-[100px] hidden md:block">
				{convertToRelativeTime(item.created_at)}
			</div>
		</div>
	);
}

export default React.memo(FileListItem);
