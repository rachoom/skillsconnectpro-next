import { NextResponse } from "next/server";
import { getConstructionEstimate } from "@/services/geminiService";

const TEXT_FIELD_KEYS = ["description", "estimateText", "text", "details", "notes", "summary"];

const isUploadFile = (value: unknown): value is File => {
  return typeof value === "object" && value !== null && typeof (value as any).arrayBuffer === "function";
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const description = TEXT_FIELD_KEYS.reduce<string | null>((found, key) => {
      if (found) return found;
      const field = formData.get(key);
      return typeof field === "string" && field.trim().length > 0 ? field.trim() : null;
    }, null) || "";

    const imageFiles: File[] = [];
    for (const value of formData.values()) {
      if (isUploadFile(value)) {
        imageFiles.push(value as File);
      }
    }

    if (!description && imageFiles.length === 0) {
      return NextResponse.json(
        { error: "Request must include at least a description or an image file." },
        { status: 400 }
      );
    }

    const estimate = await getConstructionEstimate(description, imageFiles);
    return NextResponse.json({ estimate });
  } catch (error) {
    console.error("Estimate API error:", error);
    return NextResponse.json(
      { error: "Unable to generate estimate at this time." },
      { status: 500 }
    );
  }
}
