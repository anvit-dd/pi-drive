"use client";

import { useSharedItems, useSearchTerm } from "../../store/drive-variables";
import { ChevronRight, Folder } from "lucide-react";
import { DropdownMenu } from "@radix-ui/themes";
import { useRouter, useParams } from "next/navigation";

export default function SharedFileDirectory({
	shareInfo,
}: {
	shareInfo?: { itemPath: string };
}) {
	const sharedCurrentDir = useSharedItems((state) => state.sharedCurrentDir);
	const setSharedCurrentDir = useSharedItems(
		(state) => state.setSharedCurrentDir
	);

	const searchTerm = useSearchTerm((state) => state.searchTerm);
	const router = useRouter();
	const params = useParams();
	const linkId = params.linkId as string;

	const handleNavigate = (relativePath: string) => {
		const fullPath = shareInfo?.itemPath
			? relativePath
				? `${shareInfo.itemPath}/${relativePath}`
				: shareInfo.itemPath
			: relativePath;
		setSharedCurrentDir(fullPath);
		const url = relativePath ? `/s/${linkId}/${relativePath}` : `/s/${linkId}`;
		router.push(url);
	};

	let relativeDir = sharedCurrentDir;
	if (shareInfo?.itemPath && sharedCurrentDir.startsWith(shareInfo.itemPath)) {
		relativeDir = sharedCurrentDir.slice(shareInfo.itemPath.length);
		if (relativeDir.startsWith("/")) {
			relativeDir = relativeDir.slice(1);
		}
	}

	const dirs = relativeDir.split("/").filter(Boolean);

	const sharedFolderName = shareInfo?.itemPath.split("/").pop() || "Shared";
	const allDirs = [sharedFolderName, ...dirs];

	const relativePaths = allDirs.map((part, i) => {
		if (i === 0) {
			return { name: part, path: "" };
		}
		const fullPath = dirs.slice(0, i).join("/");
		return { name: part, path: fullPath };
	});

	const maxCount = 3;
	const displayedPaths = relativePaths.slice(-maxCount);

	function truncateText(str: string) {
		return str.length <= 12 ? str : str.slice(0, 12) + "...";
	}

	function truncateTextMobile(str: string) {
		return str.length <= 10 ? str : str.slice(0, 10) + "...";
	}

	return (
		<div className="md:text-md lg:text-lg flex justify-between items-center">
			{!searchTerm ? (
				<>
					<div className="hidden md:flex items-center gap-x-2">
						{allDirs.length > maxCount && (
							<>
								<div className="text-[var(--gray-11)]">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											<button className="rounded w-6 aspect-square hover:bg-[var(--gray-a3)] flex justify-center items-center">
												...
											</button>
										</DropdownMenu.Trigger>

										<DropdownMenu.Content
											className="bg-[var(--color-panel)] border border-[var(--gray-a5)] rounded shadow-md min-w-[120px] font-sans text-[var(--gray-11)]"
											sideOffset={4}>
											{relativePaths
												.slice(0, allDirs.length - maxCount)
												.map(({ name, path }, idx) => (
													<DropdownMenu.Item
														key={`${path}-${idx}`}
														className="px-3 py-1 hover:bg-[var(--gray-a3)] rounded cursor-pointer">
														<button
															className="flex justify-start items-center gap-x-2"
															onClick={() => handleNavigate(path)}>
															<Folder size="15" />
															{name}
														</button>
													</DropdownMenu.Item>
												))}
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</div>
								<ChevronRight className="text-[var(--accent-9)]" size="20" />
							</>
						)}

						{displayedPaths.map(({ name, path }, idx) => (
							<div
								key={`${path}-${idx}`}
								className="flex items-center gap-x-2 font-sans font-medium">
								<div
									className={
										idx !== displayedPaths.length - 1
											? "text-[var(--gray-11)]"
											: "text-[var(--gray-12)]"
									}>
									<button onClick={() => handleNavigate(path)}>
										{truncateText(name)}
									</button>
								</div>
								{idx !== displayedPaths.length - 1 && (
									<ChevronRight className="text-[var(--accent-9)]" size="20" />
								)}
							</div>
						))}
					</div>

					<div className="flex md:hidden items-center">
						{allDirs.length > 1 && (
							<>
								<div className="text-[var(--gray-11)]">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											<div className="rounded w-6 aspect-square hover:bg-[var(--gray-a3)] flex justify-center items-center">
												...
											</div>
										</DropdownMenu.Trigger>

										<DropdownMenu.Content
											className="bg-[var(--color-panel)] border border-[var(--gray-a5)] rounded shadow-md p-1 min-w-[120px] font-sans text-[var(--gray-11)]"
											sideOffset={4}>
											{relativePaths
												.slice(0, allDirs.length - 1)
												.map(({ name, path }, idx) => (
													<DropdownMenu.Item
														key={`mobile-${path}-${idx}`}
														className="px-3 py-1 rounded cursor-pointer flex justify-start items-center gap-x-2">
														<button
															onClick={() => handleNavigate(path)}
															className="flex items-center gap-x-2">
															<Folder size="15" />
															{name}
														</button>
													</DropdownMenu.Item>
												))}
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</div>
								<ChevronRight className="text-[var(--accent-9)]" size="20" />
							</>
						)}
						<p
							className={`text-[var(--gray-12)] ${
								allDirs.length > 1 && allDirs[allDirs.length - 1].length > 8
									? "text-sm"
									: "text-base"
							}`}>
							{truncateTextMobile(allDirs[allDirs.length - 1])}
						</p>
					</div>
				</>
			) : (
				<p className="font-sans text-sm md:text-lg">
					Results for &quot;{searchTerm}&quot;
				</p>
			)}
		</div>
	);
}
