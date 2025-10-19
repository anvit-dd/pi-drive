"use client";

import { useCurrentDir, useSearchTerm } from "../../store/drive-variables";
import { ChevronRight, Folder } from "lucide-react";
import { DropdownMenu } from "@radix-ui/themes";

export default function FileDirectory() {
	const currDir = useCurrentDir((state) => state.dir);
	const setCurrDir = useCurrentDir((state) => state.setDir);

	const searchTerm = useSearchTerm((state) => state.searchTerm);
	const dirs = currDir.split("/");

	const relativePaths = dirs.map((part, i) => {
		const fullPath = dirs.slice(0, i + 1).join("/");
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
						{dirs.length > maxCount && (
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
												.slice(0, dirs.length - maxCount)
												.map(({ name, path }, idx) => (
													<DropdownMenu.Item
														key={idx}
														className="px-3 py-1 hover:bg-[var(--gray-a3)] rounded cursor-pointer flex justify-start items-center"
														onClick={() => setCurrDir(path)}>
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

						{displayedPaths.map(({ name, path }, idx) => (
							<div
								key={idx}
								className="flex items-center gap-x-2 font-sans font-medium">
								<div
									className={
										idx !== displayedPaths.length - 1
											? "text-[var(--gray-11)]"
											: "text-[var(--gray-12)]"
									}>
									<button onClick={() => setCurrDir(path)}>
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
						{dirs.length > 1 && (
							<>
								<div className="text-[var(--gray-11)]">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger>
											<div className="rounded w-6 aspect-square hover:bg-[var(--gray-a3)] flex justify-center items-center select-none">
												...
											</div>
										</DropdownMenu.Trigger>

										<DropdownMenu.Content
											className="bg-[var(--color-panel)] border border-[var(--gray-a5)] rounded shadow-md min-w-[120px] font-sans text-[var(--gray-11)]"
											sideOffset={4}>
											{relativePaths
												.slice(0, dirs.length - 1)
												.map(({ name, path }, idx) => (
													<DropdownMenu.Item
														key={idx}
														className="px-3 py-1 rounded cursor-pointer flex justify-start items-center gap-x-2"
														onClick={() => setCurrDir(path)}>
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
						<p
							className={`text-[var(--gray-12)] ${
								dirs.length > 1 && dirs[dirs.length - 1].length > 8 ? "text-sm" : "text-base"
							}`}>
							{truncateTextMobile(dirs[dirs.length - 1])}
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
