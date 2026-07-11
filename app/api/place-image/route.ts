import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name") ?? "";
  const address = request.nextUrl.searchParams.get("address") ?? "";
  const fallback = request.nextUrl.searchParams.get("fallback") ?? "";
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey || !name.trim()) {
    return redirectToFallback(fallback);
  }

  try {
    const searchResponse = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.photos.name",
      },
      body: JSON.stringify({
        textQuery: `${name} ${address}`.trim(),
        maxResultCount: 1,
      }),
    });

    if (!searchResponse.ok) {
      return redirectToFallback(fallback);
    }

    const data = await searchResponse.json();
    const photoName = data.places?.[0]?.photos?.[0]?.name;

    if (!photoName) {
      return redirectToFallback(fallback);
    }

    const photoUrl = new URL("/api/place-photo", request.nextUrl.origin);
    photoUrl.searchParams.set("name", photoName);

    return NextResponse.redirect(photoUrl, {
      headers: {
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return redirectToFallback(fallback);
  }
}

function redirectToFallback(fallback: string) {
  if (!fallback) {
    return new NextResponse("Image unavailable", { status: 404 });
  }

  return NextResponse.redirect(fallback, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
