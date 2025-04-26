import axios from "axios";
import { getToken } from "@/app/actions/token"; // Adjust the import path

const BASE_URL = "https://voice-agent.kognifi.ai";

export const apiWithoutAuth = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export const apiWithAuth = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiWithAuth.interceptors.request.use(async (config) => {
  console.log("Interceptor: Token fetched or not"); // Confirm token is retrieved

  try {
    // Fetch the token from your authentication service or local storage
    const token = await getToken();
    console.log("Interceptor: Token fetched:", token); // Confirm token is retrieved
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        "Interceptor: Authorization header set to:",
        config.headers.Authorization
      );
    }
  } catch (error) {
    console.error("Interceptor error:", error);
  }
  return config;
});
