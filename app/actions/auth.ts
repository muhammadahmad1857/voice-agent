"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("user");
  redirect("/auth");
}

export async function getCurrentUser() {
  console.log("User fetching startedd");
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("user");

  if (!userCookie) {
    throw new Error("User not authenticated");
  }

  const { user_name } = JSON.parse(userCookie.value);

  console.log("User fetched successfully", user_name);
  return user_name;
}