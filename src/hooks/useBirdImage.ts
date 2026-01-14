import { useState, useEffect } from "react";

interface BirdMediaInfo {
  imageUrl: string | null;
  fullImageUrl: string | null;
  wikiUrl: string | null;
}

const cache = new Map<string, BirdMediaInfo>();
const failedAttempts = new Map<string, number>(); // Track failed fetches with timestamp

// Global rate limiter - max 1 request per second to respect API limits
class RateLimiter {
  private lastRequestTime = 0;
  private readonly minDelayMs = 1000; // 1 second between requests

  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minDelayMs) {
      const waitTime = this.minDelayMs - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }
}

const rateLimiter = new RateLimiter();

export function useBirdImage(
  latinName: string | undefined,
  swedishName?: string,
  shouldFetch: boolean = true
) {
  const [mediaInfo, setMediaInfo] = useState<BirdMediaInfo>({
    imageUrl: null,
    fullImageUrl: null,
    wikiUrl: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!latinName && !swedishName) {
      setMediaInfo({ imageUrl: null, fullImageUrl: null, wikiUrl: null });
      return;
    }

    if (!shouldFetch) {
      return;
    }

    const cacheKey = (latinName || swedishName || "").toLowerCase();

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      setMediaInfo(cached);
      return;
    }

    // Check if recently failed - allow retry after 10 seconds
    const lastFailure = failedAttempts.get(cacheKey);
    if (lastFailure && Date.now() - lastFailure < 10000) {
      setMediaInfo({ imageUrl: null, fullImageUrl: null, wikiUrl: null });
      return;
    }

    async function fetchMediaInfo() {
      setLoading(true);
      try {
        // Wait for rate limiter before making any requests
        await rateLimiter.throttle();

        // Try Latin name first
        let info: BirdMediaInfo = {
          imageUrl: null,
          fullImageUrl: null,
          wikiUrl: null,
        };
        if (latinName) {
          info = await getBirdMediaFromWikidata(latinName);
        }

        // Fallback to Swedish name if no results
        if (!info.imageUrl && !info.wikiUrl && swedishName) {
          await rateLimiter.throttle();
          info = await getBirdMediaFromWikidata(swedishName);
        }

        // Only cache if we got some data
        if (info.imageUrl || info.wikiUrl) {
          cache.set(cacheKey, info);
          failedAttempts.delete(cacheKey); // Clear any previous failure
        }

        setMediaInfo(info);
      } catch (error) {
        console.error("Failed to fetch bird media:", error);
        // Mark as failed with timestamp for retry
        failedAttempts.set(cacheKey, Date.now());
        setMediaInfo({ imageUrl: null, fullImageUrl: null, wikiUrl: null });
      } finally {
        setLoading(false);
      }
    }

    fetchMediaInfo();
  }, [latinName, swedishName, shouldFetch]);

  return { ...mediaInfo, loading };
}

async function getBirdMediaFromWikidata(
  latinName: string
): Promise<BirdMediaInfo> {
  try {
    // Search Wikidata for the species by scientific name
    const searchUrl =
      `https://www.wikidata.org/w/api.php?` +
      new URLSearchParams({
        action: "wbsearchentities",
        search: latinName,
        language: "en",
        type: "item",
        limit: "5",
        format: "json",
        origin: "*",
      });

    const searchResponse = await fetchWithRetry(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.search?.length) {
      return { imageUrl: null, fullImageUrl: null, wikiUrl: null };
    }

    // Try each result to find one with matching taxon name
    for (const result of searchData.search) {
      const entityId = result.id;

      // Get entity details including image (P18) and taxon name (P225)
      const entityUrl =
        `https://www.wikidata.org/w/api.php?` +
        new URLSearchParams({
          action: "wbgetentities",
          ids: entityId,
          props: "claims|sitelinks",
          format: "json",
          origin: "*",
        });

      const entityResponse = await fetchWithRetry(entityUrl);
      const entityData = await entityResponse.json();

      const entity = entityData.entities?.[entityId];
      if (!entity) continue;

      // Verify this is the right species by checking taxon name (P225)
      const taxonClaim = entity.claims?.P225?.[0];
      const taxonName = taxonClaim?.mainsnak?.datavalue?.value;

      if (taxonName && taxonName.toLowerCase() !== latinName.toLowerCase()) {
        continue; // Not the right species
      }

      // Get image from P18 claim
      let imageUrl: string | null = null;
      let fullImageUrl: string | null = null;
      const imageClaim = entity.claims?.P18?.[0];
      if (imageClaim?.mainsnak?.datavalue?.value) {
        const imageName = imageClaim.mainsnak.datavalue.value;
        // Get both thumbnail (100px) and full-size (800px) URLs
        imageUrl = await getCommonsImageUrl(imageName, 100);
        fullImageUrl = await getCommonsImageUrl(imageName, 800);
      }

      // Get Wikipedia URL from sitelinks (prefer Swedish, then English)
      let wikiUrl: string | null = null;
      const sitelinks = entity.sitelinks;
      if (sitelinks?.svwiki) {
        wikiUrl = `https://sv.wikipedia.org/wiki/${encodeURIComponent(
          sitelinks.svwiki.title
        )}`;
      } else if (sitelinks?.enwiki) {
        wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(
          sitelinks.enwiki.title
        )}`;
      }

      if (imageUrl || wikiUrl) {
        return { imageUrl, fullImageUrl, wikiUrl };
      }
    }

    return { imageUrl: null, fullImageUrl: null, wikiUrl: null };
  } catch (error) {
    console.error("Wikidata fetch error:", error);
    return { imageUrl: null, fullImageUrl: null, wikiUrl: null };
  }
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url);

    if (response.status === 429) {
      // Rate limited, wait with exponential backoff
      const waitTime = Math.min(1000 * Math.pow(2, i), 8000);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      continue;
    }

    return response;
  }

  throw new Error("Max retries exceeded");
}

async function getCommonsImageUrl(
  fileName: string,
  width: number
): Promise<string | null> {
  try {
    // Use Commons API to get the proper thumbnail URL
    const apiUrl =
      `https://commons.wikimedia.org/w/api.php?` +
      new URLSearchParams({
        action: "query",
        titles: `File:${fileName}`,
        prop: "imageinfo",
        iiprop: "url",
        iiurlwidth: width.toString(),
        format: "json",
        origin: "*",
      });

    const response = await fetchWithRetry(apiUrl);
    const data = await response.json();

    const pages = data.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as {
      imageinfo?: Array<{ thumburl?: string }>;
    };
    return page.imageinfo?.[0]?.thumburl || null;
  } catch {
    return null;
  }
}
