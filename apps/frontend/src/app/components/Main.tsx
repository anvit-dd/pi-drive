// import FileDirectory from "./FileDirectory";
import FileDisplay from "./display/FileDisplay";
import TopNav from "./TopNav";
import SelectedItemDirectory from "./navigation/SelectedItemDirectory";
import FileOperations from "./display/FileOperations";

export default function FileList() {
  return (
		<div className="flex-1 h-screen flex flex-col">
			<TopNav />
			<FileOperations />
			<FileDisplay />
			<div className="flex items-center w-full h-12 bg-[var(--color-background)] border-t border-t-[var(--gray-a5)]">
				<SelectedItemDirectory />
			</div>
		</div>
	);
}
