import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { message: "URL parametresi gerekli" },
      { status: 400 }
    );
  }

  try {
    // Forward request to backend proxy service
    const response = await fetch(
      `${BACKEND_URL}/proxy?url=${encodeURIComponent(url)}`,
      {
        headers: {
          Accept: "text/html",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Backend hatası: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        // Not JSON, use status message
      }

      return NextResponse.json(
        { message: errorMessage },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Return HTML with appropriate headers
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        { message: "Backend servise bağlanılamadı. Backend çalışıyor mu?" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { message: "Proxy isteği başarısız oldu" },
      { status: 500 }
    );
  }
}
