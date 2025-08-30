import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file || !type) {
      return NextResponse.json(
        { error: "File and type are required" },
        { status: 400 }
      );
    }

    // Process the file here
    // This is where you would:
    // 1. Parse the uploaded document
    // 2. Extract relevant information
    // 3. Run compliance checks against your database
    // 4. Return conflicts/violations

    if (type === "feature") {
      const response = await fetch("http://127.0.0.1:8080/upload/feature", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      return NextResponse.json({ success: true, response: data });
    } else {
      // Check law against existing features
      const response = await fetch("http://127.0.0.1:8080/upload/law", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      return NextResponse.json({ success: true, response: data });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
