"use client";

import { Button, Dialog, TextField } from "@radix-ui/themes";
import React, { useState, useEffect } from "react";
import { useToast } from "@/components/useToast";
import { useOpenShareDialog, useLoadingShare } from "@/app/store/ui-variables";
import * as RadixSelect from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import { client_ax } from "@/lib/axios";
import { useSelectedItems } from "@/app/store/drive-variables";

export default function ShareItem() {
	const isOpen = useOpenShareDialog((s) => s.open);
	const setOpen = useOpenShareDialog((s) => s.setOpen);
	const isLoading = useLoadingShare((s) => s.isLoading);
	const setIsLoading = useLoadingShare((s) => s.setIsLoading);

	const selectedItems = useSelectedItems((s) => s.selectedItems);
	const selectedItem = Array.from(selectedItems)[0];
	const [duration, setDuration] = useState<string>("60");
	const [unit, setUnit] = useState<string>("MINUTES");
	const [password, setPassword] = useState<string>("");
	const [shareId, setShareId] = useState<string | null>(null);

	const { notify } = useToast();

	// Reset shareId when dialog opens
	useEffect(() => {
		if (isOpen) {
			setShareId(null);
		}
	}, [isOpen]);

	const handleCreateShare = async () => {
		try {
			setIsLoading(true);
			setShareId(null);
			const params = new URLSearchParams();
			if (!selectedItem) throw new Error("No item selected to share");
			params.set("itemPath", selectedItem.id);
			params.set("shareDuration", duration);
			params.set("durationUnit", unit);
			params.set("isFile", selectedItem.is_dir ? "false" : "true");
			if (password) params.set("password", password);

			const res = await client_ax.get(`/api/share?${params.toString()}`);
			if (res.status !== 201) throw new Error(`HTTP ${res.status}`);
			const data = res.data;
			setShareId(data.share_id);
			notify("Share link created", `Link id: ${data.share_id}`);
		} catch (e) {
			console.error("Failed to create share link", e);
			notify("Failed to create share link");
		} finally {
			setIsLoading(false);
		}
	};

	const handleCopy = async () => {
		if (!shareId) return;
		try {
			await navigator.clipboard.writeText(
				`${window.location.origin}/s/${shareId}`
			);
			notify("Copied to clipboard");
		} catch {
			notify("Failed to copy link");
		}
	};

	return (
		<Dialog.Root open={isOpen} onOpenChange={setOpen}>
			<Dialog.Content maxWidth="520px">
				<Dialog.Title>Share Item</Dialog.Title>
				<Dialog.Description size="2" mb="4">
					Create a temporary share link for the selected item.
				</Dialog.Description>
				<div className="mb-3">
					<div className="mt-1 text-sm text-[var(--gray-12)]">
						{selectedItem?.name}
					</div>
				</div>
				<div className="grid grid-cols-2 gap-2 mb-3 place-items-center">
					<TextField.Root
						className="!font-sans w-full"
						placeholder="60"
						value={duration}
						onChange={(e) => {
							setDuration(e.target.value);
						}}></TextField.Root>

					<div className="w-full">
						<RadixSelect.Root
							value={unit}
							onValueChange={(v: string) => setUnit(v)}
							aria-label="Duration unit">
							<RadixSelect.Trigger
								className="w-full flex items-center justify-between px-2 py-1 rounded-sm border border-[var(--gray-a6)] bg-[var(--color-background)]"
								aria-label="Select duration unit">
								<RadixSelect.Value className="text-sm">
									{unit === "SECONDS"
										? "Seconds"
										: unit === "MINUTES"
										? "Minutes"
										: unit === "HOURS"
										? "Hours"
										: unit === "DAYS"
										? "Days"
										: "Unit"}
								</RadixSelect.Value>
								<RadixSelect.Icon>
									<ChevronDown size={16} />
								</RadixSelect.Icon>
							</RadixSelect.Trigger>

							<RadixSelect.Portal>
								<RadixSelect.Content className="mt-1 rounded-md bg-[var(--color-secondary)] dark:bg-[var(--color-primary)] shadow-lg z-50">
									<RadixSelect.Viewport className="p-1 text-[var(--color-foreground)]">
										<RadixSelect.Item
											value="SECONDS"
											className="flex items-center justify-between px-2 py-1 rounded hover:bg-[var(--gray-a2)]"
											aria-label="Seconds">
											<RadixSelect.ItemText>Seconds</RadixSelect.ItemText>
											<RadixSelect.ItemIndicator>
												<Check size={14} />
											</RadixSelect.ItemIndicator>
										</RadixSelect.Item>

										<RadixSelect.Item
											value="MINUTES"
											className="flex items-center justify-between px-2 py-1 rounded hover:bg-[var(--gray-a2)]"
											aria-label="Minutes">
											<RadixSelect.ItemText>Minutes</RadixSelect.ItemText>
											<RadixSelect.ItemIndicator>
												<Check size={14} />
											</RadixSelect.ItemIndicator>
										</RadixSelect.Item>

										<RadixSelect.Item
											value="HOURS"
											className="flex items-center justify-between px-2 py-1 rounded hover:bg-[var(--gray-a2)]"
											aria-label="Hours">
											<RadixSelect.ItemText>Hours</RadixSelect.ItemText>
											<RadixSelect.ItemIndicator>
												<Check size={14} />
											</RadixSelect.ItemIndicator>
										</RadixSelect.Item>

										<RadixSelect.Item
											value="DAYS"
											className="flex items-center justify-between px-2 py-1 rounded hover:bg-[var(--gray-a2)]"
											aria-label="Days">
											<RadixSelect.ItemText>Days</RadixSelect.ItemText>
											<RadixSelect.ItemIndicator>
												<Check size={14} />
											</RadixSelect.ItemIndicator>
										</RadixSelect.Item>
									</RadixSelect.Viewport>
								</RadixSelect.Content>
							</RadixSelect.Portal>
						</RadixSelect.Root>
					</div>
				</div>
				<div className="mb-4">
					<TextField.Root
						className="!font-sans w-full"
						placeholder="Password (optional)"
						value={password}
						onChange={(e) => {
							setPassword(e.target.value);
						}}></TextField.Root>
				</div>
				{shareId && (
					<div className="mb-4">
						<div className="text-sm">Share URL</div>
						<div className="flex items-center gap-2 mt-1">
							{/* <input
								readOnly
								value={`${
									typeof window !== "undefined" ? window.location.origin : ""
								}/s/${shareId}`}
								className="flex-1 bg-[var(--gray-a2)] p-2 rounded-md text-sm"
							/> */}
							<TextField.Root
								readOnly
								className="!font-sans flex-1"
								value={`${
									typeof window !== "undefined" ? window.location.origin : ""
								}/s/${shareId}`}>
								{/* <TextField.Slot></TextField.Slot> */}
							</TextField.Root>
							<Button onClick={handleCopy}>Copy</Button>
						</div>
					</div>
				)}
				<div className="flex justify-end gap-2">
					<Dialog.Close>
						<Button variant="soft" color="gray" disabled={isLoading}>
							Close
						</Button>
					</Dialog.Close>
					<Button
						onClick={handleCreateShare}
						loading={isLoading}
						disabled={isLoading}>
						{isLoading ? "Creating..." : "Create Link"}
					</Button>
				</div>{" "}
			</Dialog.Content>
		</Dialog.Root>
	);
}
