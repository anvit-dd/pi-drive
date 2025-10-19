import { redirect } from "next/navigation";
import { getUserFromToken } from "@/lib/auth-server-component";
import { createServerAxios } from "@/lib/axios";
import HomeInit from "@/app/components/HomeInit";
import Home from "../components/Home";

export default async function HomeLayout() {
	const user = await getUserFromToken();
	if (!user) {
		redirect("/login");
	}

	let initialStorage: number | null = null;
	try {
		const ax = createServerAxios();
		const response = await ax.get(`/users`);
		initialStorage = response.data.storage;
	} catch {
		initialStorage = null;
	}

	return (
		<HomeInit currUser={user} initialStorage={initialStorage ?? undefined}>
			<Home />
			{/* {children} */}
		</HomeInit>
	);
}
