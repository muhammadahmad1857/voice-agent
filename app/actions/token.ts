"use server";

import { cookies } from "next/headers";

export async function getToken() {
  console.log("User fetching startedd");
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("user");

  if (!userCookie) {
    throw new Error("User not authenticated");
  }

  const { token } = JSON.parse(userCookie.value);

  console.log("Token fetched successfully", token);
  return token;
}