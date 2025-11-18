import {
  useSelectedItems,
  useCurrentDirectoryItems,
} from "../store/drive-variables";
import type { ContentItem } from "@/lib/types";

export function useSelectAll(items?: ContentItem[]) {
  const setSelectedItems = useSelectedItems((state) => state.setSelectedItems);
  const dirContents = useCurrentDirectoryItems((state) => state.items);

  const itemsToUse = items ?? dirContents;

  const selectAll = () => {
    setSelectedItems(new Set(itemsToUse));
  };
  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  return { selectAll, deselectAll };
}
