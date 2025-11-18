import React from "react";
import { FileGridItem } from "./FileGridItem";
import LoadingDisplay from "./LoadingDisplay";
import EmptyFolder from "./EmptyFolder";
import type { ContentItem } from "@/lib/types";

interface FileGridViewProps {
  dirContents: ContentItem[] | null;
  isLoading: boolean;
  selectedItems: Set<ContentItem>;
  onItemClick: (e: React.MouseEvent, item: ContentItem) => void;
  onItemDoubleClick: (e: React.MouseEvent, item: ContentItem) => void;
  onItemContextMenu: (item: ContentItem) => void;
  isSharedView?: boolean;
  linkId?: string;
  userId?: string;
  password?: string;
}

export function FileGridView({
  dirContents,
  isLoading,
  selectedItems,
  onItemClick,
  onItemDoubleClick,
  onItemContextMenu,
  isSharedView = false,
  linkId,
  userId,
  password,
}: FileGridViewProps) {
  const isSelected = (item: ContentItem) =>
    [...selectedItems].some((itm) => itm.id === item.id);

  return (
    <div
      className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4"
      data-grid-container="true"
    >
      {isLoading ? (
        <LoadingDisplay />
      ) : dirContents && dirContents.length > 0 ? (
        dirContents.map((item: ContentItem) => (
          <FileGridItem
            key={item.id}
            item={item}
            isSelected={isSelected(item)}
            onClick={(e) => onItemClick(e, item)}
            onDoubleClick={(e) => onItemDoubleClick(e, item)}
            onContextMenu={() => onItemContextMenu(item)}
            isSharedView={isSharedView}
            linkId={linkId}
            userId={userId}
            password={password}
          />
        ))
      ) : (
        <EmptyFolder />
      )}
    </div>
  );
}
