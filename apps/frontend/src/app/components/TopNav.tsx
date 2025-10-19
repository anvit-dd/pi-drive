"use client";

import {
	Search,
	Menu,
	X,
	ArrowLeft,
	LogOut,
	User,
	Settings,
} from "lucide-react";
import { TextField, Badge, DropdownMenu } from "@radix-ui/themes";
import { IconButton } from "@radix-ui/themes";
import { useOpenSideBarMenu } from "../store/ui-variables";
import {
	useCurrentDirectoryItems,
	useCurrentUser,
	useLoadingDirectory,
	useSearchTerm,
} from "../store/drive-variables";
import { useState, useEffect, useCallback, useDeferredValue } from "react";
import { useCurrentDir } from "../store/drive-variables";
import FileDirectory from "./navigation/FileDirectory";
import SharedFileDirectory from "./navigation/SharedFileDirectory";
import { client_ax } from "@/lib/axios";
import { redirect } from "next/navigation";
import { useDebounce } from "../hooks/useDebounce";

export default function TopNav({
	isSharedView = false,
	shareInfo,
}: {
	isSharedView?: boolean;
	shareInfo?: {
		itemPath: string;
		sharedBy: string;
		expiresAt: string;
	};
}) {
	const setOpenSideBarMenu = useOpenSideBarMenu((state) => state.setOpen);
	const user = useCurrentUser((state) => state.user);

	const searchTerm = useSearchTerm((state) => state.searchTerm);
	const setSearchTerm = useSearchTerm((state) => state.setSearchTerm);

	const [searchInput, setSearchInput] = useState("");
	const deferredSearchInput = useDeferredValue(searchInput);
	const debouncedSearchInput = useDebounce(deferredSearchInput, 1000);
	const [showMobileSearch, setShowMobileSearch] = useState(false);
	const setIsLoading = useLoadingDirectory((state) => state.setIsLoading);

	const refreshDirectory = useCurrentDir((state) => state.refreshDirectory);

	const setDirContents = useCurrentDirectoryItems((state) => state.setItems);

	const performSearch = useCallback(
		async (searchTerm: string) => {
			setIsLoading(true);
			try {
				setSearchTerm(searchTerm);
				const res = await client_ax.get("/api/directories/search", {
					params: { query: searchTerm },
				});
				const data = res.data;
				setDirContents(data.results);
			} catch (error) {
				console.error("Search failed:", error);
			} finally {
				setIsLoading(false);
			}
		},
		[setIsLoading, setSearchTerm, setDirContents]
	);

	useEffect(() => {
		if (isSharedView) return;

		if (debouncedSearchInput.trim()) {
			performSearch(debouncedSearchInput);
		} else if (debouncedSearchInput === "") {
			setSearchTerm(null);
			refreshDirectory();
		}
	}, [
		debouncedSearchInput,
		isSharedView,
		refreshDirectory,
		setSearchTerm,
		performSearch,
	]);

	useEffect(() => {
		if (searchTerm) {
			return;
		}
		setSearchInput("");
	}, [searchTerm]);

	const handleMobileSearchToggle = () => {
		setShowMobileSearch(!showMobileSearch);
		if (showMobileSearch) {
			setSearchInput("");
			setSearchTerm(null);
		}
	};

	const handleLogout = async () => {
		try {
			const response = await fetch("/api/auth/logout", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				document.cookie =
					"client-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

				localStorage.clear();
				sessionStorage.clear();

				window.location.href = "/login";
			} else {
				console.error("Logout failed");
			}
		} catch (error) {
			console.error("Logout error:", error);
			window.location.href = "/login";
		}
	};

	return (
		<>
			<nav className="h-16 w-full p-2 px-4 bg-[var(--color-background)] border-b-1 border-[var(--gray-a5)] flex items-center justify-between gap-x-2 md:gap-x-4">
				<div className="flex items-center gap-x-4 flex-1 min-w-0">
					<div className="md:hidden">
						<IconButton
							variant="soft"
							size="2"
							onClick={() => setOpenSideBarMenu(true)}
							className="flex-shrink-0">
							<Menu size="20" />
						</IconButton>
					</div>

					{isSharedView ? (
						<SharedFileDirectory shareInfo={shareInfo} />
					) : (
						<FileDirectory />
					)}
				</div>

				<div className="flex items-center gap-x-2 md:gap-x-4">
					{isSharedView && shareInfo && (
						<div className="flex items-center">
							<Badge size="1" variant="soft">
								Exp:{" "}
								{new Date(shareInfo.expiresAt).toLocaleDateString(undefined, {
									month: "short",
									day: "numeric",
									year: "2-digit",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</Badge>
						</div>
					)}

					{!isSharedView && (
						<div className="hidden md:flex flex-1 min-w-0">
							<form className="w-full">
								<TextField.Root
									id="search-input"
									placeholder="Search for stuff..."
									variant="surface"
									size="2"
									radius="full"
									className="bg-transparent text-sm rounded-lg pl-10 pr-3 py-2 shadow-sm !font-sans w-full"
									value={searchInput}
									onChange={(e) => {
										setSearchInput(e.target.value);
									}}>
									<TextField.Slot>
										<Search height={16} width={16} />
									</TextField.Slot>
								</TextField.Root>
							</form>
						</div>
					)}

					{!isSharedView && (
						<div className="md:hidden">
							<IconButton
								variant="soft"
								onClick={handleMobileSearchToggle}
								className="flex-shrink-0">
								{showMobileSearch ? <X size="20" /> : <Search size="20" />}
							</IconButton>
						</div>
					)}

					{!isSharedView && (
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								<div className="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full select-none bg-[linear-gradient(123deg,#de3333_0%,#ee4a9b_100%)] cursor-pointer hover:opacity-90 transition-opacity">
									{user && (
										<p className="font-sans text-white text-xl md:text-2xl">
											{user.name?.charAt(0).toUpperCase()}
										</p>
									)}
								</div>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content
								align="end"
								className="bg-[var(--color-panel)] border border-[var(--gray-a5)] rounded shadow-lg font-sans text-[var(--gray-11)] min-w-[180px]"
								sideOffset={8}>
								<p className="px-3 py-2 hover:bg-[var(--gray-a3)] rounded cursor-default outline-none">
									<div className="flex items-center gap-x-2">
										<User size="16" />
										<div className="flex flex-col">
											<span className="text-sm font-medium text-[var(--gray-12)]">
												{user?.name}
											</span>
											<span className="text-xs text-[var(--gray-11)] truncate max-w-[120px]">
												{user?.email}
											</span>
										</div>
									</div>
								</p>
								<DropdownMenu.Separator className="bg-[var(--gray-a5)]" />
								<DropdownMenu.Item
									className="px-3 py-2 hover:bg-[var(--accent-a3)] rounded cursor-pointer flex items-center gap-x-2 outline-none"
									onClick={() => redirect("/settings")}>
									<Settings size="16" />
									Settings
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onClick={handleLogout}
									className="px-3 py-2 hover:bg-[var(--accent-a3)] rounded cursor-pointer flex items-center gap-x-2 outline-none">
									<LogOut size="16" />
									Logout
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					)}
				</div>
			</nav>

			{showMobileSearch && !isSharedView && (
				<div className="lg:hidden w-full px-4 py-3 border-b border-[var(--gray-a5)]">
					<div className="flex items-center gap-x-2">
						<IconButton
							variant="soft"
							onClick={handleMobileSearchToggle}
							className="flex-shrink-0">
							<ArrowLeft size="18" />
						</IconButton>
						<div className="flex-1">
							<form className="w-full">
								<TextField.Root
									id="search-input-mobile"
									placeholder="Search for stuff..."
									variant="surface"
									radius="full"
									className="bg-transparent text-base rounded-lg pl-4 pr-3 py-3 shadow-sm !font-sans"
									value={searchInput}
									onChange={(e) => {
										setSearchInput(e.target.value);
									}}
									autoFocus>
									<TextField.Slot>
										<Search height={18} width={18} />
									</TextField.Slot>
								</TextField.Root>
							</form>
						</div>
					</div>
				</div>
			)}

			{/* {isSharedView && shareInfo && (
				<div className="md:hidden w-full px-4 py-2 border-b border-[var(--gray-a5)] bg-[var(--gray-2)]">
					<div className="flex items-center justify-center">
						<Badge size="1" variant="soft" color="amber">
							Expires: {new Date(shareInfo.expiresAt).toLocaleString()}
						</Badge>
					</div>
				</div>
			)} */}
		</>
	);
}
