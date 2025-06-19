import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { verifyJWT } from "@/lib/jwt";

export async function POST(request: Request) {
  try {
    // Authorization check
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyJWT(token) as { userId: string; email: string };

    let { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Ensure URL has protocol
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    // Fetch the webpage content
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch the URL" },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Parse the HTML using Cheerio
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $(
      "script, style, nav, footer, header, aside, .ads, .comments, .sidebar"
    ).remove();

    // Extract the main content (example strategies)
    let mainContent = "";

    // Strategy 1: Look for common content containers
    const contentSelectors = [
      "article",
      "main",
      ".content",
      "#content",
      ".post",
      ".article",
      ".blog-post",
    ];

    for (const selector of contentSelectors) {
      if ($(selector).length > 0) {
        mainContent = $(selector).text().trim();
        break;
      }
    }

    // Strategy 2: If no common containers found, use the body content
    if (!mainContent) {
      mainContent = $("body").text().trim();
    }

    // Basic cleaning
    mainContent = mainContent.replace(/\s+/g, " ").substring(0, 1000).trim();

    return NextResponse.json({
      url,
      content: mainContent,
      title: $("title").text().trim(),
      description: $('meta[name="description"]').attr("content") || "",
    });
  } catch (error) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
