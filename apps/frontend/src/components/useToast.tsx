import * as Toast from "@radix-ui/react-toast";
import { Button } from "@radix-ui/themes";
import {
	createContext,
	useContext,
	useState,
	ReactNode,
	useEffect,
} from "react";

type ToastMessage = {
	id: number;
	title: string;
	description?: string;
	stackOffset?: number;
	scale?: number;
};

type ToastContextType = {
	notify: (
		title: string,
		description?: string,
		stackOffset?: number,
		scale?: number
	) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_DESCRIPTION_LENGTH = 40;
const MAX_TOASTS = 3;

const truncateText = (text: string, maxLength: number) => {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength) + "...";
};

export function useToast() {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error("useToast must be used within ToastProvider");
	return ctx;
}

export default function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<ToastMessage[]>([]);
	const [nextId, setNextId] = useState(0);
	const [isHovered, setIsHovered] = useState(false);

	useEffect(() => {
		if (toasts.length === 0) {
			setNextId(0);
		}
	}, [toasts.length]);

	const notify = (title: string, description?: string) => {
		const id = nextId;
		setNextId((prev) => prev + 1);
		const truncatedDescription = description
			? truncateText(description, MAX_DESCRIPTION_LENGTH)
			: undefined;
		setToasts((prev) => {
			const newToasts = [
				{ id, title, description: truncatedDescription },
				...prev,
			];
			return newToasts.slice(0, MAX_TOASTS);
		});
	};

	return (
		<ToastContext.Provider value={{ notify }}>
			<Toast.Provider swipeDirection="up">
				{children}
				<Toast.Viewport className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-96 max-w-full outline-none">
					<div
						onMouseEnter={() => {
							console.log("mouse entered");
							setIsHovered(true);
						}}
						onMouseLeave={() => setIsHovered(false)}>
						{toasts.map((toast, idx) => {
							const baseHeight = 70;
							const stackedOffset = idx * 16;
							const expandedOffset = idx * (baseHeight + 16);
							const offset = isHovered ? expandedOffset : stackedOffset;
							const scale = isHovered ? 1 : 1 - idx * 0.05;

							return (
								<Toast.Root
									key={toast.id}
									duration={2500}
									onOpenChange={(open) => {
										if (!open) {
											setTimeout(() => {
												setToasts((prev) =>
													prev.filter((t) => t.id !== toast.id)
												);
											}, 300);
										}
									}}
									style={{
										position: "absolute",
										bottom: `-${offset}px`,
										transform: `scale(${scale})`,
										zIndex: 50 - idx,
										transformOrigin: "top center",
										transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
									}}
									className="w-full bg-[var(--color-background)] border border-[var(--gray-a5)] shadow-md font-sans rounded-md p-4 flex items-center justify-between gap-1 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top duration-500">
									<div className="flex-col">
										<Toast.Title className="font-semibold text-sm text-[var(--gray-12)]">
											{toast.title}
										</Toast.Title>
										{toast.description && (
											<Toast.Description className="text-[var(--gray-11)] text-sm">
												{toast.description}
											</Toast.Description>
										)}
									</div>
									<Toast.Action className="ToastAction" asChild altText="Ack">
										<Button variant="solid" size="2">
											Ok
										</Button>
									</Toast.Action>
								</Toast.Root>
							);
						})}
					</div>
				</Toast.Viewport>
			</Toast.Provider>
		</ToastContext.Provider>
	);
}
