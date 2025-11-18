"use client";

import { useState, useCallback, useEffect } from "react";
import { client_ax } from "@/lib/axios";
import type { ContentItem } from "@/lib/types";

interface ShareInfo {
  itemPath: string;
  sharedBy: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  requiresPassword: boolean;
  isFile: boolean;
}

interface UseShareReturn {
  shareInfo: ShareInfo | null;
  isLoading: boolean;
  error: string | null;
  isPasswordRequired: boolean;
  isAuthenticated: boolean;
  password: string;
  passwordError: string | null;
  fileMetadata: ContentItem | null;
  currentPassword?: string;
  setPassword: (password: string) => void;
  validateShare: (passwordParam?: string) => Promise<void>;
  handlePasswordSubmit: (e: React.FormEvent) => void;
  downloadFile: () => Promise<void>;
}

export function useShare(linkId: string): UseShareReturn {
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPassword, setCurrentPassword] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [fileMetadata, setFileMetadata] = useState<ContentItem | null>(null);

  useEffect(() => {
    if (linkId && typeof window !== "undefined") {
      const storedAuth = sessionStorage.getItem(`share_auth_${linkId}`);
      const storedPassword = sessionStorage.getItem(`share_password_${linkId}`);

      setIsAuthenticated(storedAuth === "true");
      setCurrentPassword(storedPassword || undefined);
    }
  }, [linkId]);

  const validateShare = useCallback(
    async (passwordParam?: string) => {
      try {
        setIsLoading(true);
        setError(null);
        setPasswordError(null);

        const params = new URLSearchParams();
        params.set("linkId", linkId);
        if (passwordParam) {
          params.set("password", passwordParam);
        } else if (currentPassword) {
          params.set("password", currentPassword);
        }

        const response = await fetch(
          `/api/share/validate?${params.toString()}`
        );
        const data = await response.json();

        if (!response.ok) {
          if (data.requiresPassword) {
            setIsPasswordRequired(true);
            setIsLoading(false);
            return;
          }

          if (response.status === 401 && data.error === "Invalid password") {
            setPasswordError(data.error);
            setIsPasswordRequired(true);
            setIsLoading(false);
            return;
          }

          throw new Error(data.error || "Failed to validate share link");
        }

        setShareInfo(data);
        setIsAuthenticated(true);
        setIsPasswordRequired(false);
        setCurrentPassword(passwordParam || currentPassword);
        setPassword("");
        setPasswordError(null);

        if (typeof window !== "undefined") {
          sessionStorage.setItem(`share_auth_${linkId}`, "true");
          if (passwordParam || currentPassword) {
            sessionStorage.setItem(
              `share_password_${linkId}`,
              passwordParam || currentPassword || ""
            );
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to validate share link"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [linkId, currentPassword]
  );

  const handlePasswordSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (password.trim()) {
        validateShare(password);
      }
    },
    [password, validateShare]
  );

  const downloadFile = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("linkId", linkId);
      if (currentPassword) {
        params.set("password", currentPassword);
      }

      const response = await client_ax(
        `/api/share/download?${params.toString()}`,
        { responseType: "blob" }
      );
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = shareInfo!.itemPath.split("/").pop() || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      setError("Failed to download file");
    }
  }, [linkId, currentPassword, shareInfo]);

  useEffect(() => {
    if (linkId) {
      validateShare();
    }
  }, [linkId, validateShare]);

  useEffect(() => {
    const fetchFileMetadata = async () => {
      if (!shareInfo || !shareInfo.isFile || !linkId) return;

      try {
        const params = new URLSearchParams();
        params.set("linkId", linkId);
        if (currentPassword) {
          params.set("password", currentPassword);
        }

        const response = await client_ax.get(
          `/api/share/contents?${params.toString()}`
        );
        const data = response.data;
        if (data.contents) {
          console.log("Setting file metadata:", data.contents[0]);
          setFileMetadata(data.contents[0]);
        }
      } catch (error) {
        console.error("Failed to fetch file metadata:", error);
      }
    };

    fetchFileMetadata();
  }, [shareInfo, linkId, currentPassword]);

  return {
    shareInfo,
    isLoading,
    error,
    isPasswordRequired,
    isAuthenticated,
    password,
    passwordError,
    fileMetadata,
    currentPassword,
    setPassword,
    validateShare,
    handlePasswordSubmit,
    downloadFile,
  };
}
