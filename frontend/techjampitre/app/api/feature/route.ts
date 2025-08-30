import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const response = await fetch("http://127.0.0.1:8080/features", {
      method: "GET",
    });
    const data = await response.json();
    return NextResponse.json({ success: true, response: data });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
