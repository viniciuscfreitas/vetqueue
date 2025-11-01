import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

export async function GET() {
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  
  try {
    const logoBuffer = fs.readFileSync(logoPath);
    return new NextResponse(logoBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Erro ao ler logo:", error);
    return new NextResponse("Not Found", { status: 404 });
  }
}

