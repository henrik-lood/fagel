import { useState } from 'react';

interface BirdLookupResult {
  swedishName?: string;
  latinName?: string;
}

export function useBirdLookup() {
  const [loading, setLoading] = useState(false);

  const lookupBird = async (searchTerm: string): Promise<BirdLookupResult | null> => {
    setLoading(true);
    try {
      // Check if input looks like a Latin name (two words, starts with capital)
      const looksLikeLatinName = /^[A-Z][a-z]+ [a-z]+/.test(searchTerm.trim());

      if (looksLikeLatinName) {
        // Search for Swedish name using the Latin name
        const result = await searchWikidataByLatinName(searchTerm);
        if (result?.swedishName) {
          return result;
        }
      }

      // Try Swedish Wikipedia first (best for Swedish bird names)
      const svResult = await searchWikipedia(searchTerm, 'sv');
      if (svResult?.latinName || svResult?.swedishName) {
        return svResult;
      }

      // Then try English Wikipedia
      const enResult = await searchWikipedia(searchTerm, 'en');
      if (enResult?.latinName) {
        return enResult;
      }

      // Try Wikidata as fallback
      const wdResult = await searchWikidata(searchTerm);
      if (wdResult?.latinName || wdResult?.swedishName) {
        return wdResult;
      }

      return null;
    } catch (error) {
      console.error('Bird lookup failed:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { lookupBird, loading };
}

async function searchWikipedia(
  searchTerm: string,
  lang: 'sv' | 'en'
): Promise<BirdLookupResult | null> {
  try {
    // Search for exact match first
    const searchUrl = `https://${lang}.wikipedia.org/w/api.php?` +
      new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: searchTerm,
        srlimit: '5',
        format: 'json',
        origin: '*',
      });

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.query?.search?.length) {
      return null;
    }

    // Find the best match - prefer exact title match
    const searchResults = searchData.query.search;
    let pageTitle = searchResults[0].title;

    // Check if any result is an exact match (case-insensitive)
    for (const result of searchResults) {
      if (result.title.toLowerCase() === searchTerm.toLowerCase()) {
        pageTitle = result.title;
        break;
      }
    }

    // First try to get the Wikidata entity ID from this Wikipedia page
    // This gives us reliable structured data including the scientific name
    const wikidataResult = await getWikidataFromWikipediaPage(pageTitle, lang);
    if (wikidataResult?.latinName) {
      return wikidataResult;
    }

    // Fallback: Get page content to extract Latin name via regex
    const contentUrl = `https://${lang}.wikipedia.org/w/api.php?` +
      new URLSearchParams({
        action: 'query',
        titles: pageTitle,
        prop: 'extracts',
        exintro: 'true',
        explaintext: 'true',
        format: 'json',
        origin: '*',
      });

    const contentResponse = await fetch(contentUrl);
    const contentData = await contentResponse.json();

    const pages = contentData.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as {
      title: string;
      extract?: string;
    };

    if (!page.extract) return null;

    const extract = page.extract;

    // Try to extract Latin name - various formats used in Wikipedia
    const latinPatterns = [
      /\(([A-Z][a-z]+ [a-z]+(?:\s+[a-z]+)?)\)/,  // (Genus species)
      /,\s*([A-Z][a-z]+ [a-z]+)/,  // ", Genus species" after Swedish name
      /vetenskapliga namnet?\s*[:\s]*([A-Z][a-z]+ [a-z]+)/i,  // "vetenskapliga namnet: X"
      /latin(?:skt)?\s*[:\s]*([A-Z][a-z]+ [a-z]+)/i,  // "latinskt namn: X" or "latin: X"
      /scientific name[:\s]+([A-Z][a-z]+ [a-z]+)/i,  // English
      /\b([A-Z][a-z]+us\s+[a-z]+)\b/,  // Common Latin genus endings (-us)
      /\b([A-Z][a-z]+a\s+[a-z]+)\b/,  // Common Latin genus endings (-a)
      /\b([A-Z][a-z]+is\s+[a-z]+)\b/,  // Common Latin genus endings (-is)
    ];

    for (const pattern of latinPatterns) {
      const match = extract.match(pattern);
      if (match && isValidLatinName(match[1])) {
        return { latinName: match[1].toLowerCase() };
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function getWikidataFromWikipediaPage(
  pageTitle: string,
  lang: 'sv' | 'en'
): Promise<BirdLookupResult | null> {
  try {
    // Get the Wikidata entity ID linked to this Wikipedia page
    const propsUrl = `https://${lang}.wikipedia.org/w/api.php?` +
      new URLSearchParams({
        action: 'query',
        titles: pageTitle,
        prop: 'pageprops',
        ppprop: 'wikibase_item',
        format: 'json',
        origin: '*',
      });

    const propsResponse = await fetch(propsUrl);
    const propsData = await propsResponse.json();

    const pages = propsData.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as { pageprops?: { wikibase_item?: string } };
    const wikidataId = page.pageprops?.wikibase_item;

    if (!wikidataId) return null;

    // Fetch the Wikidata entity to get the scientific name (P225)
    return getWikidataEntity(wikidataId);
  } catch {
    return null;
  }
}

async function searchWikidata(searchTerm: string): Promise<BirdLookupResult | null> {
  try {
    // Search Wikidata for the bird
    const searchUrl = `https://www.wikidata.org/w/api.php?` +
      new URLSearchParams({
        action: 'wbsearchentities',
        search: searchTerm,
        language: 'sv',
        uselang: 'sv',
        type: 'item',
        limit: '5',
        format: 'json',
        origin: '*',
      });

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.search?.length) {
      return null;
    }

    // Get the first result's ID
    const entityId = searchData.search[0].id;

    return getWikidataEntity(entityId);
  } catch {
    return null;
  }
}

async function searchWikidataByLatinName(latinName: string): Promise<BirdLookupResult | null> {
  try {
    // Try Wikidata search first
    const searchUrl = `https://www.wikidata.org/w/api.php?` +
      new URLSearchParams({
        action: 'wbsearchentities',
        search: latinName,
        language: 'en',
        type: 'item',
        limit: '10',
        format: 'json',
        origin: '*',
      });

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.search?.length) {
      for (const result of searchData.search) {
        const entityResult = await getWikidataEntityWithLatinCheck(result.id, latinName);
        if (entityResult?.swedishName) {
          return entityResult;
        }
      }
    }

    // Fallback: Search Swedish Wikipedia with the Latin name
    const svWikiResult = await searchSwedishWikipediaByLatinName(latinName);
    if (svWikiResult) {
      return svWikiResult;
    }

    // Fallback: Search English Wikipedia and follow interwiki link
    const enWikiResult = await searchEnglishWikipediaForSwedishName(latinName);
    if (enWikiResult) {
      return enWikiResult;
    }

    return null;
  } catch (err) {
    console.error('Latin name lookup failed:', err);
    return null;
  }
}

async function searchSwedishWikipediaByLatinName(latinName: string): Promise<BirdLookupResult | null> {
  try {
    // Search Swedish Wikipedia with the Latin name
    const searchUrl = `https://sv.wikipedia.org/w/api.php?` +
      new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: latinName,
        srlimit: '5',
        format: 'json',
        origin: '*',
      });

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.query?.search?.length) {
      return null;
    }

    // Check each result to see if it contains the Latin name
    for (const result of searchData.query.search) {
      const pageTitle = result.title;

      // Get the page content to verify it's about the right species
      const contentUrl = `https://sv.wikipedia.org/w/api.php?` +
        new URLSearchParams({
          action: 'query',
          titles: pageTitle,
          prop: 'extracts',
          exintro: 'true',
          explaintext: 'true',
          format: 'json',
          origin: '*',
        });

      const contentResponse = await fetch(contentUrl);
      const contentData = await contentResponse.json();

      const pages = contentData.query?.pages;
      if (!pages) continue;

      const page = Object.values(pages)[0] as { title: string; extract?: string };
      if (!page.extract) continue;

      // Check if the Latin name appears in the extract
      if (page.extract.toLowerCase().includes(latinName.toLowerCase())) {
        return {
          swedishName: pageTitle.toLowerCase(),
          latinName: latinName.toLowerCase(),
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function searchEnglishWikipediaForSwedishName(latinName: string): Promise<BirdLookupResult | null> {
  try {
    // Search English Wikipedia
    const searchUrl = `https://en.wikipedia.org/w/api.php?` +
      new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: latinName,
        srlimit: '3',
        format: 'json',
        origin: '*',
      });

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.query?.search?.length) {
      return null;
    }

    const pageTitle = searchData.query.search[0].title;

    // Get the Swedish language link
    const langLinksUrl = `https://en.wikipedia.org/w/api.php?` +
      new URLSearchParams({
        action: 'query',
        titles: pageTitle,
        prop: 'langlinks',
        lllang: 'sv',
        format: 'json',
        origin: '*',
      });

    const langLinksResponse = await fetch(langLinksUrl);
    const langLinksData = await langLinksResponse.json();

    const pages = langLinksData.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as { langlinks?: Array<{ lang: string; '*': string }> };
    const svLink = page.langlinks?.[0];

    if (svLink && svLink['*']) {
      return {
        swedishName: svLink['*'].toLowerCase(),
        latinName: latinName.toLowerCase(),
      };
    }

    return null;
  } catch {
    return null;
  }
}

async function getWikidataEntityWithLatinCheck(
  entityId: string,
  expectedLatinName: string
): Promise<BirdLookupResult | null> {
  try {
    const entityUrl = `https://www.wikidata.org/w/api.php?` +
      new URLSearchParams({
        action: 'wbgetentities',
        ids: entityId,
        props: 'claims|labels',
        languages: 'sv|en',
        format: 'json',
        origin: '*',
      });

    const entityResponse = await fetch(entityUrl);
    const entityData = await entityResponse.json();

    const entity = entityData.entities?.[entityId];
    if (!entity) return null;

    // Check if the Latin name matches (P225 is taxon name)
    const taxonClaim = entity.claims?.P225?.[0];
    const actualLatinName = taxonClaim?.mainsnak?.datavalue?.value;

    if (!actualLatinName) return null;

    // Case-insensitive match
    if (actualLatinName.toLowerCase() !== expectedLatinName.toLowerCase()) {
      return null;
    }

    // Get Swedish label
    const swedishLabel = entity.labels?.sv?.value;
    if (swedishLabel) {
      return {
        swedishName: swedishLabel.toLowerCase(),
        latinName: actualLatinName.toLowerCase(),
      };
    }

    return null;
  } catch {
    return null;
  }
}

// Validate that a string looks like a Latin species name
function isValidLatinName(name: string): boolean {
  // Latin names should be two words (Genus species), no Swedish characters
  return /^[A-Za-z]+ [a-z]+/.test(name.trim()) &&
    !name.includes('å') && !name.includes('ä') && !name.includes('ö');
}

async function getWikidataEntity(entityId: string): Promise<BirdLookupResult | null> {
  try {
    // Get entity details including scientific name (P225) and labels
    const entityUrl = `https://www.wikidata.org/w/api.php?` +
      new URLSearchParams({
        action: 'wbgetentities',
        ids: entityId,
        props: 'claims|labels',
        languages: 'sv',
        format: 'json',
        origin: '*',
      });

    const entityResponse = await fetch(entityUrl);
    const entityData = await entityResponse.json();

    const entity = entityData.entities?.[entityId];
    if (!entity) return null;

    const result: BirdLookupResult = {};

    // P225 is "taxon name" (scientific/Latin name)
    const taxonClaim = entity.claims?.P225?.[0];
    if (taxonClaim?.mainsnak?.datavalue?.value) {
      const latinName = taxonClaim.mainsnak.datavalue.value;
      // Only use it if it looks like a valid Latin name
      if (isValidLatinName(latinName)) {
        result.latinName = latinName.toLowerCase();
      }
    }

    // Get Swedish label
    const swedishLabel = entity.labels?.sv?.value;
    if (swedishLabel) {
      result.swedishName = swedishLabel.toLowerCase();
    }

    if (result.latinName || result.swedishName) {
      return result;
    }

    return null;
  } catch {
    return null;
  }
}
