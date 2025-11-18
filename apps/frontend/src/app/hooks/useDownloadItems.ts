import { useState } from "react";
import { useSelectedItems } from "../store/drive-variables";
import { client_ax } from "@/lib/axios";
import { useIsDownloading } from "../store/ui-variables";
import { useToast } from "@/components/useToast";

export const useDownloadItems = (
  isSharedView = false,
  linkId?: string,
  password?: string
) => {
  const selectedItems = useSelectedItems((state) => state.selectedItems);
  const setIsDownloading = useIsDownloading((state) => state.setOpen);
  const { notify } = useToast();

  const [downloadPercent, setDownloadPercent] = useState<number>(0);

  const handleDownload = async () => {
    if (selectedItems.size === 0) return;
    console.log("Downloading");
    setIsDownloading(true);

    const selectedFilesDownload = Array.from(selectedItems).map((item) => ({
      name: item.name,
      id: item.id,
      is_dir: item.is_dir,
    }));

    const toBase64 = (str: string) => {
      const bytes = new TextEncoder().encode(str);
      const binString = Array.from(bytes, (byte) =>
        String.fromCharCode(byte)
      ).join("");
      return btoa(binString);
    };

    const encodedId = toBase64(JSON.stringify(selectedFilesDownload));

    const buildUrl = () => {
      const params = new URLSearchParams({ id: encodedId });

      if (isSharedView) {
        if (linkId) params.set("linkId", linkId);
        if (password) params.set("password", password);
        return `/api/share/download?${params.toString()}`;
      }

      return `/api/files/download?${params.toString()}`;
    };

    const url = buildUrl();

    try {
      const res_head = await client_ax.head(url);
      console.log("All headers:", res_head.headers);
      const totalSize = parseInt(res_head.headers["x-total-size"], 10);
      const response = await client_ax.get(url, {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          if (totalSize) {
            console.log(progressEvent.loaded, totalSize);
            const percent = Math.round(
              (progressEvent.loaded / totalSize) * 100
            );
            setDownloadPercent(percent);
          } else {
            console.log("Loaded bytes:", progressEvent.loaded);
          }
        },
      });
      console.log(response.data);
      const blobUrl = window.URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download =
        selectedFilesDownload.length === 1
          ? selectedFilesDownload[0].name +
            (selectedFilesDownload[0].is_dir ? ".zip" : "")
          : selectedFilesDownload[0].name + ".zip";
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      notify(
        "Download Complete!",
        `Downloaded ${selectedFilesDownload.length} item${
          selectedFilesDownload.length > 1 ? "s" : ""
        }`
      );
    } catch (error) {
      console.error(error);
      notify(
        "Download Failed!",
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setIsDownloading(false);
      setDownloadPercent(0);
    }
  };

  return {
    handleDownload,
    downloadPercent,
  };
};
