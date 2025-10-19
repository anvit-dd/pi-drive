import React from "react";
import { DropdownMenu } from "@radix-ui/themes";
import { useSearchTerm, useSelectedItems } from "../../store/drive-variables";
import { ChevronRight, Folder } from "lucide-react";
import { useCurrentDir } from "../../store/drive-variables";

export default function SelectedItemDirectory() {
	const searchTerm = useSearchTerm((state) => state.searchTerm);
	const setSearchTerm = useSearchTerm((state) => state.setSearchTerm);
	const selectedItems = useSelectedItems((state) => state.selectedItems);

	const selectedItemPath =
		selectedItems.size === 1 ? Array.from(selectedItems)[0] : null;
	const setCurrDir = useCurrentDir((state) => state.setDir);
	const dirs =
		selectedItems.size === 1 ? selectedItemPath?.id.split("/") : null;

	const relativePaths = dirs?.map((part, i) => {
		const fullPath = dirs.slice(0, i + 1).join("/");
		return { name: part, path: fullPath };
	});

	const maxCount = 5;
	const displayedPaths = relativePaths?.slice(-maxCount);

	function truncateText(str: string) {
		return str.length <= 12 ? str : str.slice(0, 12) + "...";
	}

	function truncateTextMobile(str: string) {
		return str.length <= 10 ? str : str.slice(0, 10) + "...";
	}

	return (
		<div>
			{searchTerm && selectedItems.size === 1 && (
				<div className="px-4 md:text-md flex justify-between h-auto w-full">
					<div className="hidden md:flex items-center gap-x-2">
						{dirs && dirs.length > maxCount && (
							<>
								<div className="text-[var(--gray-11)]">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											<button className="rounded w-6 aspect-square hover:bg-[var(--gray-a5)] flex justify-center items-center">
												...
											</button>
										</DropdownMenu.Trigger>

										<DropdownMenu.Content
											className="bg-[var(--color-panel)] border border-[var(--gray-a5)] rounded shadow-md p-1 min-w-[120px] font-sans text-[var(--gray-11)]"
											sideOffset={4}>
											{relativePaths &&
												relativePaths
													.slice(0, dirs.length - maxCount)
													.map(({ name, path }, idx) => (
														<DropdownMenu.Item
															key={idx}
															className="px-3 py-1 hover:bg-[var(--gray-a3)] rounded cursor-pointer"
															onClick={() => {
																setSearchTerm(null);
																setCurrDir(path);
															}}>
															<Folder size="15" />
															{name}
														</DropdownMenu.Item>
													))}
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</div>
								<ChevronRight className="text-[var(--accent-9)]" size="20" />
							</>
						)}

						{displayedPaths &&
							displayedPaths.map(({ name, path }, idx) => (
								<div
									key={idx}
									className="flex items-center gap-x-2 font-sans font-medium">
									<div
										className={
											idx !== displayedPaths.length - 1
												? "text-[var(--gray-11)]"
												: "text-[var(--gray-12)]"
										}>
										<button
											onClick={() => {
												if (idx !== displayedPaths.length - 1) {
													console.log(path);
													setCurrDir(path);
													setSearchTerm(null);
													return;
												}
												const p = path.split("/");
												p.pop();
												setCurrDir(p.join("/"));
												setSearchTerm(null);
											}}>
											{truncateText(name)}
										</button>
									</div>
									{idx !== displayedPaths.length - 1 && (
										<ChevronRight
											className="text-[var(--accent-9)]"
											size="20"
										/>
									)}
								</div>
							))}
					</div>

					<div className="flex md:hidden items-center">
						{dirs && dirs.length > 1 && (
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
											{relativePaths &&
												relativePaths
													.slice(0, dirs.length - 1)
													.map(({ name, path }, idx) => (
														<DropdownMenu.Item
															key={idx}
															onClick={() => setCurrDir(path)}
															className="px-3 py-1 hover:bg-[var(--gray-a3)] rounded cursor-pointer flex justify-start items-center gap-x-2">
															<Folder size="15" />
															{name}
														</DropdownMenu.Item>
													))}
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</div>
								<ChevronRight className="text-[var(--accent-9)]" size="20" />
							</>
						)}
						<button
							className={`text-[var(--gray-12)] ${
								dirs && dirs.length > 1 && dirs[dirs.length - 1].length > 8
									? "text-sm"
									: "text-base"
							}`}
							onClick={() => {
								const lastPath =
									relativePaths?.[relativePaths.length - 1]?.path;
								if (lastPath) {
									const pathParts = lastPath.split("/");
									pathParts.pop();
									setCurrDir(pathParts.join("/"));
									setSearchTerm(null);
								}
							}}>
							{dirs && truncateTextMobile(dirs[dirs.length - 1])}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
