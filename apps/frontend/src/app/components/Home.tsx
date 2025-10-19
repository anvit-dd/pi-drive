"use client";
import Sidebar from "./Sidebar";
import FileList from "./Main";
import { useOpenSideBarMenu } from "../store/ui-variables";
import { Suspense } from "react";
import UploadMenu from "./dialogs/UploadMenu";

export default function Home({
	isSharedView = false,
}: {
	isSharedView?: boolean;
}) {
	const IsOpenSideBarMenu = useOpenSideBarMenu((state) => state.open);
	const setOpenSideBarMenu = useOpenSideBarMenu((state) => state.setOpen);

	return (
		<Suspense fallback={<p>Loading...</p>}>
			<div className="flex h-screen font-mono">
				<Sidebar
					isOpen={IsOpenSideBarMenu}
					onClose={() => setOpenSideBarMenu(false)}
					isSharedView={isSharedView}
				/>
				{IsOpenSideBarMenu && (
					<div
						className="fixed inset-0 bg-black/30 md:hidden z-40"
						onClick={() => setOpenSideBarMenu(false)}
						aria-hidden="true"
					/>
				)}
				<div className="flex-1 md:ml-0">
					<FileList />
				</div>
				<div className="fixed right-0 bottom-0 w-full md:w-auto">
					<UploadMenu />
				</div>
			</div>
		</Suspense>
	);
}
