import { useCallback } from "react";
import type { ContentItem } from "@/lib/types";

interface UseItemSelectionProps {
  selectedItems: Set<ContentItem>;
  setSelectedItems: (items: Set<ContentItem>) => void;
  dirContents: ContentItem[] | null;
}

export function useItemSelection({
  selectedItems,
  setSelectedItems,
  dirContents,
}: UseItemSelectionProps) {
  const handleItemSelect = useCallback(
    (e: React.MouseEvent, item: ContentItem) => {
      e.stopPropagation();
      const selectedItemsArr = [...selectedItems];

      if (e.shiftKey) {
        if (selectedItemsArr.length === 0) {
          setSelectedItems(new Set([item]));
        } else {
          const lastItem = selectedItemsArr[selectedItemsArr.length - 1];
          const start = Math.min(lastItem.order_no, item.order_no);
          const end = Math.max(lastItem.order_no, item.order_no);

          const rangeItems = (dirContents || []).filter(
            (itm) => itm.order_no >= start && itm.order_no <= end
          );

          setSelectedItems(new Set(rangeItems));
        }
      } else if (e.ctrlKey || e.metaKey) {
        if (
          selectedItemsArr.some((selectedItem) => selectedItem.id === item.id)
        ) {
          setSelectedItems(
            new Set(selectedItemsArr.filter((i) => i.id !== item.id))
          );
        } else {
          setSelectedItems(new Set([...selectedItemsArr, item]));
        }
      } else {
        
        setSelectedItems(new Set([item]));
      }
    },
    [selectedItems, setSelectedItems, dirContents]
  );

  const handleBgClick = useCallback(() => {
    setSelectedItems(new Set());
  }, [setSelectedItems]);

  const isSelected = useCallback(
    (item: ContentItem) => [...selectedItems].some((itm) => itm.id === item.id),
    [selectedItems]
  );

  return {
    handleItemSelect,
    handleBgClick,
    isSelected,
  };
}
