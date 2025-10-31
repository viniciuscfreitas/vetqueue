import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const iconPath = path.join(process.cwd(), "public", "icon.svg");
  
  try {
    const iconContent = fs.readFileSync(iconPath, "utf-8");
    return new NextResponse(iconContent, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}

