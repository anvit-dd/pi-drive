import { useTotalStorage } from "../store/drive-variables";
import { client_ax } from "@/lib/axios";

export const useStorage = () => {
	const setCurrentStorage = useTotalStorage((state) => state.setCurrentStorage);

	const handleGetUpdatedStorage = async () => {
		try {
			const res = await client_ax.get(`/api/users/storage`);

			const data = res.data;
			setCurrentStorage(data.contents.storage);
		} catch (error) {
			console.error("Error fetching storage:", error);
		}
	};

	return { handleGetUpdatedStorage };
};
