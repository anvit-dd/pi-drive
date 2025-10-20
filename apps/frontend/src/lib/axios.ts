import axios from "axios";
import { getValidToken } from "@/lib/auth";

const ax = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL,
});

const resolveSiteUrl = () => {
	if (typeof window !== "undefined") {
		return window.location.origin;
	}

	return process.env.NEXT_PUBLIC_SITE_URL;
};

const client_ax = axios.create({
	baseURL: resolveSiteUrl(),
});

ax.interceptors.request.use(
	async (config) => {
		config.headers["X-API-KEY"] = process.env.NEXT_PUBLIC_API_KEY;

		if (typeof window !== "undefined") {
			const token = await getValidToken();
			if (token) {
				config.headers["Authorization"] = `Bearer ${token}`;
			}
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

ax.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (
			error.response?.status === 401 &&
			!originalRequest._retry &&
			typeof window !== "undefined"
		) {
			originalRequest._retry = true;

			try {
				// Try to refresh the token
				const refreshed = await import("@/lib/auth").then((module) =>
					module.refreshToken()
				);

				if (refreshed) {
					// Retry the original request with new token
					const newToken = await import("@/lib/auth").then((module) =>
						module.getValidToken()
					);
					if (newToken) {
						originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
						return ax(originalRequest);
					}
				} else {
					// Refresh failed, but don't immediately logout
					// The user might still have a valid token for a short time
					console.warn(
						"Token refresh failed, but continuing with existing token"
					);
				}
			} catch (refreshError) {
				console.error("Token refresh failed:", refreshError);
			}

			// If we get here, refresh failed, so redirect to login
			window.location.href = "/login";
		}

		return Promise.reject(error);
	}
);

client_ax.interceptors.request.use(
	async (config) => {
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

client_ax.interceptors.response.use(
	(response) => response,
	async (error) => {
		return Promise.reject(error);
	}
);

export default ax;
export { client_ax };

export function createServerAxios() {
	const serverAx = axios.create({
		baseURL: process.env.NEXT_PUBLIC_API_URL,
	});

	serverAx.interceptors.request.use(
		async (config) => {
			config.headers["X-API-KEY"] = process.env.NEXT_PUBLIC_API_KEY;

			const { cookies } = await import("next/headers");
			const cookieStore = await cookies();
			const token = cookieStore.get("auth-token")?.value;
			if (token) {
				config.headers["Authorization"] = `Bearer ${token}`;
			}

			return config;
		},
		(error) => {
			return Promise.reject(error);
		}
	);

	return serverAx;
}
