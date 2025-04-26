import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    console.log(body, "body");
    // Call your FastAPI login endpoint
    const res = await axios.post(
      "https://voice-agent.kognifi.ai/login",
      {
        username: body.username,
        password: body.password,
      },
      {
        headers: {
          accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const data = await res.data;
    console.log(data);
    // If login fails, return an error response
    if (res.status !== 200) {
      return NextResponse.json(
        { message: data.detail || "Login failed" },
        { status: res.status }
      );
    }

    // Create a NextResponse to set an HTTP-only cookie
    const response = NextResponse.json(
      {
        message: data.detail || "Login Successful!",
      },
      { status: 200 }
    );
    response.cookies.set({
      name: "user",
      value: JSON.stringify({
        token: data.access_token,
        user_name: data.user_name,
      }),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Login error:", error.response.data.detail);
    return NextResponse.json(
      {
        detail:
          error.response.data.detail || "Something Went Wrong while logging in",
      },
      { status: 400 }
    );
  }
}
