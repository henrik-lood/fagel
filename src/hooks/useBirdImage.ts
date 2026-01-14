import { useState, useEffect } from 'react';

interface BirdMediaInfo {
  imageUrl: string | null;
  wikiUrl: string | null;
}

const cache = new Map<string, BirdMediaInfo>();

export function useBirdImage(latinName: string | undefined, swedishName?: string) {
  const [mediaInfo, setMediaInfo] = useState<BirdMediaInfo>({ imageUrl: null, wikiUrl: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!latinName && !swedishName) {
      setMediaInfo({ imageUrl: null, wikiUrl: null });
      return;
    }

    const cacheKey = (latinName || swedishName || '').toLowerCase();

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      setMediaInfo(cached);
      return;
    }

    async function fetchMediaInfo() {
      setLoading(true);
      try {
        // Try Latin name first
        let info: BirdMediaInfo = { imageUrl: null, wikiUrl: null };
        if (latinName) {
          info = await getBirdMediaFromWikidata(latinName);
        }

        // Fallback to Swedish name if no results
        if (!info.imageUrl && !info.wikiUrl && swedishName) {
          info = await getBirdMediaFromWikidata(swedishName);
        }

        cache.set(cacheKey, info);
        setMediaInfo(info);
      } catch (error) {
        console.error('Failed to fetch bird media:', error);
        setMediaInfo({ imageUrl: null, wikiUrl: null });
      } finally {
        setLoading(false);
      }
    }

    fetchMediaInfo();
  }, [latinName, swedishName]);

  return { ...mediaInfo, loading };
}

async function getBirdMediaFromWikidata(latinName: string): Promise<BirdMediaInfo> {
  try {
    // Search Wikidata for the species by scientific name
    const searchUrl = `https://www.wikidata.org/w/api.php?` +
      new URLSearchParams({
        action: 'wbsearchentities',
        search: latinName,
        language: 'en',
        type: 'item',
        limit: '5',
        format: 'json',
        origin: '*',
      });

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.search?.length) {
      return { imageUrl: null, wikiUrl: null };
    }

    // Try each result to find one with matching taxon name
    for (const result of searchData.search) {
      const entityId = result.id;

      // Get entity details including image (P18) and taxon name (P225)
      const entityUrl = `https://www.wikidata.org/w/api.php?` +
        new URLSearchParams({
          action: 'wbgetentities',
          ids: entityId,
          props: 'claims|sitelinks',
          format: 'json',
          origin: '*',
        });

      const entityResponse = await fetch(entityUrl);
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
      const imageClaim = entity.claims?.P18?.[0];
      if (imageClaim?.mainsnak?.datavalue?.value) {
        const imageName = imageClaim.mainsnak.datavalue.value;
        // Get proper thumbnail URL from Commons API
        imageUrl = await getCommonsImageUrl(imageName, 100);
      }

      // Get Wikipedia URL from sitelinks (prefer Swedish, then English)
      let wikiUrl: string | null = null;
      const sitelinks = entity.sitelinks;
      if (sitelinks?.svwiki) {
        wikiUrl = `https://sv.wikipedia.org/wiki/${encodeURIComponent(sitelinks.svwiki.title)}`;
      } else if (sitelinks?.enwiki) {
        wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(sitelinks.enwiki.title)}`;
      }

      if (imageUrl || wikiUrl) {
        return { imageUrl, wikiUrl };
      }
    }

    return { imageUrl: null, wikiUrl: null };
  } catch (error) {
    console.error('Wikidata fetch error:', error);
    return { imageUrl: null, wikiUrl: null };
  }
}

async function getCommonsImageUrl(fileName: string, width: number): Promise<string | null> {
  try {
    // Use Commons API to get the proper thumbnail URL
    const apiUrl = `https://commons.wikimedia.org/w/api.php?` +
      new URLSearchParams({
        action: 'query',
        titles: `File:${fileName}`,
        prop: 'imageinfo',
        iiprop: 'url',
        iiurlwidth: width.toString(),
        format: 'json',
        origin: '*',
      });

    const response = await fetch(apiUrl);
    const data = await response.json();

    const pages = data.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as { imageinfo?: Array<{ thumburl?: string }> };
    return page.imageinfo?.[0]?.thumburl || null;
  } catch {
    return null;
  }
}
