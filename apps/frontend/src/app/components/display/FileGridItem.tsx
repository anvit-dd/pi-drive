import React from "react";
import { Card, Flex, Text, Badge } from "@radix-ui/themes";
import { ItemFileIcon } from "@/components/getFileIcon";
import readable_size from "@/lib/readable_size";
import convertToRelativeTime from "@/lib/relative_time";
import isPreviewable from "@/lib/isPreviewable";
import Image from "next/image";
import type { ContentItem } from "@/lib/types";

import { useDraggable, useDroppable } from "@dnd-kit/core";

interface FileGridItemProps {
	item: ContentItem;
	isSelected: boolean;
	onClick: (e: React.MouseEvent) => void;
	onDoubleClick: (e: React.MouseEvent) => void;
	onContextMenu: () => void;
}

function truncateText(str: string) {
	return str.length <= 16 ? str : str.slice(0, 16) + "...";
}

export function FileGridItem({
	item,
	isSelected,
	onClick,
	onDoubleClick,
	onContextMenu,
}: FileGridItemProps) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({ id: item.id, disabled: !isSelected });

	const { setNodeRef: setDropRef, isOver } = useDroppable({ id: item.id });

	return (
		<Card
			data-item="true"
			ref={(node) => {
				setNodeRef(node);
				setDropRef(node);
			}}
			style={{
				transform: transform
					? `translate3d(${transform.x}px, ${transform.y}px, 0)`
					: undefined,
				opacity: isDragging ? 0.5 : 1,
				backgroundColor: isOver ? "var(--gray-a5)" : undefined,
				zIndex: isDragging ? 999 : undefined,
				transition: isDragging ? "none" : "transform 150ms ease",
				cursor: isSelected ? "grab" : undefined,
			}}
			{...listeners}
			{...attributes}
			data-item-id={item.id}
			className={`transition-transform border-0 duration-100 hover:cursor-pointer p-4 !h-[250px] display-item ${
				isSelected
					? "ring-1 ring-[var(--accent-9)] bg-[var(--accent-a4)] dark:bg-[var(--accent-a2)] hover:dark:bg-[var(--accent-a2)]"
					: "bg-[var(--color-card-background)] hover:bg-[var(--gray-a5)] hover:dark:bg-[var(--gray-a2)]"
			}`}
			onClick={onClick}
			onDoubleClick={onDoubleClick}
			onContextMenu={onContextMenu}>
			<Flex direction="column" align="center" gap="2">
				{isPreviewable(item.extension) ? (
					<div className="w-full min-h-full">
						<Image
							src={`/api/media/thumbnails?path=${encodeURIComponent(item.id)}`}
							alt={item.name}
							width={250}
							height={128}
							draggable={false}
							className="object-cover w-full h-36 rounded-sm select-none"
						/>
					</div>
				) : (
					<div className="h-36 flex items-center">
						<ItemFileIcon item={item} size="large" />
					</div>
				)}

				<Flex direction="column" className="gap-y-1">
					<Text
						as="div"
						size="4"
						weight="bold"
						align="center"
						className="font-sans select-none truncate">
						{truncateText(item.name)}
					</Text>
					<div>
						{item.is_dir ? (
							<Flex align="center" justify="center" gap="4">
								<Text
									as="div"
									size="2"
									align="center"
									weight="medium"
									className="font-mono text-[var(--gray-9)] select-none">
									{item.no_items} items
								</Text>
							</Flex>
						) : (
							<Flex align="center" justify="center" gap="4">
								<Text
									as="div"
									size="2"
									align="center"
									weight="medium"
									className="font-mono text-[var(--gray-9)] select-none">
									{readable_size(item.size)}
								</Text>
								<Badge className="select-none">{item.extension || "N/A"}</Badge>
							</Flex>
						)}
					</div>
					<Text
						as="div"
						size="2"
						align="center"
						weight="medium"
						className="font-sans mt-2 select-none">
						{convertToRelativeTime(item.created_at)}
					</Text>
				</Flex>
			</Flex>
		</Card>
	);
}

export default React.memo(FileGridItem);
