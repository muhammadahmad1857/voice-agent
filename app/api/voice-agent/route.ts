/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiWithAuth } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const messageType = req.nextUrl.searchParams.get("message_type");

    const response = await apiWithAuth.post("/voice-agent", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      params: {
        message_type: messageType,
      },
    });

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error(
      "Voice Agent API Error:",
      error.response?.data || error.message
    );
    return NextResponse.json(
      { error: error.response?.data.error || "Something went wrong" },
      { status: error.response?.status || 500 }
    );
  }
}
