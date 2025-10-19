"use client";

import { useState } from "react";
import { Button, Card, Text, TextField } from "@radix-ui/themes";
import { useRouter } from "next/navigation";

export default function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [showRegister, setShowRegister] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			});

			const contentType = response.headers.get("content-type");

			if (!response.ok) {
				let errorMessage = "Login failed";

				if (contentType?.includes("application/json")) {
					const errorData = await response.json();
					errorMessage = errorData.error || "Login failed";
				} else {
					errorMessage = "Server error occurred";
				}

				throw new Error(errorMessage);
			}

			if (contentType?.includes("application/json")) {
				await response.json();
			} else {
				throw new Error("Server returned unexpected response format");
			}

			router.push("/home");
		} catch (error) {
			setError(error instanceof Error ? error.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/auth/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password, name }),
			});

			const contentType = response.headers.get("content-type");

			if (!response.ok) {
				let errorMessage = "Registration failed";

				if (contentType?.includes("application/json")) {
					const errorData = await response.json();
					errorMessage = errorData.error || "Registration failed";
				} else {
					errorMessage = "Server error occurred";
				}

				throw new Error(errorMessage);
			}

			if (contentType?.includes("application/json")) {
				await response.json();
			} else {
				throw new Error("Server returned unexpected response format");
			}

			router.push("/home");
		} catch (error) {
			setError(error instanceof Error ? error.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4 font-primary">
			<div className="w-full max-w-md">
				<div className="text-center mb-4 font-mono">
					<h1 className="text-5xl font-bold">
						<Text className="inline text-[var(--accent-10)]">pi</Text>
						<Text className="inline">Drive</Text>
					</h1>
					<Text size="3" className="text-[var(--gray-11)]">
						Your personal cloud storage
					</Text>
				</div>

				<Card className="p-8 shadow-lg bg-[var(--color-background)]">
					<div className="space-y-6">
						<div className="text-center space-y-2">
							<Text
								size="7"
								weight="bold"
								className="block text-[var(--gray-12)]">
								{showRegister ? "Create Account" : "Welcome Back"}
							</Text>
							<Text size="2" className="text-[var(--gray-11)]">
								{showRegister
									? "Sign up to get started with piDrive"
									: "Sign in to access your files"}
							</Text>
						</div>

						{error && (
							<div className="bg-[var(--red-a3)] border border-[var(--red-a6)] rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
								<Text size="2" weight="medium" className="text-[var(--red-11)]">
									{error}
								</Text>
							</div>
						)}

						<form
							onSubmit={showRegister ? handleRegister : handleLogin}
							className="space-y-6">
							{showRegister && (
								<div className="!space-y-1">
									<Text
										size="2"
										weight="medium"
										className="block text-[var(--gray-12)]">
										Name
									</Text>
									<TextField.Root
										type="text"
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="Enter your name"
										required
										size="3"
										className="w-full"
									/>
								</div>
							)}

							<div className="!space-y-1">
								<Text
									size="2"
									weight="medium"
									className="block text-[var(--gray-12)]">
									Email
								</Text>
								<TextField.Root
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@example.com"
									required
									size="3"
									className="w-full"
								/>
							</div>

							<div className="!space-y-1">
								<Text
									size="2"
									weight="medium"
									className="block text-[var(--gray-12)]">
									Password
								</Text>
								<TextField.Root
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									required
									size="3"
									className="w-full"
								/>
							</div>

							<Button
								type="submit"
								size="3"
								className="!w-full font-semibold mt-6"
								disabled={isLoading}>
								{isLoading
									? showRegister
										? "Creating account..."
										: "Signing in..."
									: showRegister
									? "Create Account"
									: "Sign In"}
							</Button>

							<div className="text-center pt-4">
								<Text size="2" className="text-[var(--gray-11)]">
									{showRegister
										? "Already have an account? "
										: "Don't have an account? "}
									<button
										type="button"
										onClick={() => {
											setShowRegister(!showRegister);
											setError(null);
										}}
										className="text-[var(--accent-11)] hover:text-[var(--accent-12)] font-medium transition-colors">
										{showRegister ? "Sign in" : "Sign up"}
									</button>
								</Text>
							</div>
						</form>
					</div>
				</Card>
			</div>
		</div>
	);
}
