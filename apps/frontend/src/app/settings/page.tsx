"use client";

import React, { Suspense, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { useOpenSideBarMenu } from "@/app/store/ui-variables";
import { Text, Card, Flex, Skeleton } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/app/store/drive-variables";

interface UserData {
	id: string;
	email: string;
	name?: string;
	provider: string;
	createdAt: string;
	updatedAt: string;
}

export default function Page() {
	const IsOpenSideBarMenu = useOpenSideBarMenu((state) => state.open);
	const setOpenSideBarMenu = useOpenSideBarMenu((state) => state.setOpen);
	const [user, setUser] = useState<UserData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const setCurrentUser = useCurrentUser((state) => state.setUser);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const response = await fetch("/api/users/me");
				if (!response.ok) {
					if (response.status === 401) {
						router.push("/login");
						return;
					}
					throw new Error("Failed to fetch user data");
				}
				const data = await response.json();
				const fetchedUser: UserData | undefined = data?.user;
				if (fetchedUser) {
					setUser(fetchedUser);
					setCurrentUser({
						...fetchedUser,
						password: "",
						createdAt: new Date(fetchedUser.createdAt),
						updatedAt: new Date(fetchedUser.updatedAt),
					});
				} else {
					setError("Failed to parse user data");
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred");
			} finally {
				setLoading(false);
			}
		};

		fetchUser();
	}, [router, setCurrentUser]);

	return (
		<Suspense fallback={<p>Loading...</p>}>
			<div className="flex h-screen font-mono">
				<Sidebar
					isOpen={IsOpenSideBarMenu}
					onClose={() => setOpenSideBarMenu(false)}
				/>
				{IsOpenSideBarMenu && (
					<div
						className="fixed inset-0 bg-black/30 md:hidden z-40"
						onClick={() => setOpenSideBarMenu(false)}
						aria-hidden="true"
					/>
				)}
				<div className="flex-1 md:ml-0">
					<div className="flex-1 h-screen flex flex-col">
						<TopNav />
						<div className="flex-1 overflow-auto p-4 md:p-6">
							<div className="max-w-2xl">
								<Text size="6" weight="bold" className="mb-6 block">
									Settings
								</Text>

								{loading ? (
									<Card className="p-6 bg-[var(--color-panel)] border border-[var(--gray-a5)]">
										<Flex direction="column" gap="4">
											<Skeleton>
												<Text>Loading...</Text>
											</Skeleton>
										</Flex>
									</Card>
								) : error ? (
									<Card className="p-6 bg-[var(--color-panel)] border border-[var(--gray-a5)]">
										<Text color="red">{error}</Text>
									</Card>
								) : user ? (
									<Card className="p-6 bg-[var(--color-panel)] border border-[var(--gray-a5)]">
										<Flex direction="column" gap="4">
											<div>
												<Text size="2" weight="bold" color="gray">
													Name
												</Text>
												<Text size="3" weight="medium" className="mt-1">
													{user.name || "Not set"}
												</Text>
											</div>

											<div>
												<Text size="2" weight="bold" color="gray">
													Email
												</Text>
												<Text size="3" weight="medium" className="mt-1">
													{user.email}
												</Text>
											</div>

											<div>
												<Text size="2" weight="bold" color="gray">
													Provider
												</Text>
												<Text
													size="3"
													weight="medium"
													className="mt-1 capitalize">
													{user.provider}
												</Text>
											</div>

											<div>
												<Text size="2" weight="bold" color="gray">
													Member Since
												</Text>
												<Text size="3" weight="medium" className="mt-1">
													{new Date(user.createdAt).toLocaleDateString(
														"en-US",
														{
															year: "numeric",
															month: "long",
															day: "numeric",
														}
													)}
												</Text>
											</div>

											<div>
												<Text size="2" weight="bold" color="gray">
													Last Updated
												</Text>
												<Text size="3" weight="medium" className="mt-1">
													{new Date(user.updatedAt).toLocaleDateString(
														"en-US",
														{
															year: "numeric",
															month: "long",
															day: "numeric",
														}
													)}
												</Text>
											</div>
										</Flex>
									</Card>
								) : (
									<Card className="p-6 bg-[var(--color-panel)] border border-[var(--gray-a5)]">
										<Text color="gray">No user data available</Text>
									</Card>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</Suspense>
	);
}
