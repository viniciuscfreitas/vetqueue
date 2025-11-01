import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

export async function GET() {
  const cwd = process.cwd();
  
  const possiblePaths = [
    path.join(cwd, "public", "logo.png"),
    path.join(cwd, "..", "public", "logo.png"),
    path.join(cwd, ".", "public", "logo.png"),
    "/app/public/logo.png",
    "./public/logo.png",
  ];
  
  let logoBuffer: Buffer | null = null;
  let usedPath = "";
  
  for (const logoPath of possiblePaths) {
    try {
      if (fs.existsSync(logoPath)) {
        logoBuffer = fs.readFileSync(logoPath);
        usedPath = logoPath;
        break;
      }
    } catch (error) {
      // Silently continue to next path
    }
  }
  
  if (logoBuffer) {
    return new NextResponse(new Uint8Array(logoBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }
  
  return new NextResponse("Logo not found", { 
    status: 404,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

