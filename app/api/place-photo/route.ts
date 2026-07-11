import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const photoName = request.nextUrl.searchParams.get("name");
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!photoName || !photoName.startsWith("places/") || !apiKey) {
    return new NextResponse("Missing photo", { status: 404 });
  }

  const url = new URL(`https://places.googleapis.com/v1/${photoName}/media`);
  url.searchParams.set("maxWidthPx", "720");
  url.searchParams.set("maxHeightPx", "480");
  url.searchParams.set("skipHttpRedirect", "true");
  url.searchParams.set("key", apiKey);

  const metadataResponse = await fetch(url);

  if (!metadataResponse.ok) {
    return new NextResponse("Photo unavailable", { status: metadataResponse.status });
  }

  const metadata = (await metadataResponse.json()) as { photoUri?: string };

  if (!metadata.photoUri) {
    return new NextResponse("Photo unavailable", { status: 404 });
  }

  const imageResponse = await fetch(metadata.photoUri);

  if (!imageResponse.ok || !imageResponse.body) {
    return new NextResponse("Photo unavailable", { status: imageResponse.status });
  }

  return new NextResponse(imageResponse.body, {
    headers: {
      "Cache-Control": "public, max-age=86400",
      "Content-Type": imageResponse.headers.get("content-type") ?? "image/jpeg",
    },
  });
}
