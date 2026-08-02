const TRACKING_TOKENS = ['spinner', 'placeholder', 'transparent', 'pixel', 'loading', 'lazyload', 'favicon'];

const SHOPEE_IMAGE_HOST_SUFFIXES = ['cf.shopee.co.id', 'img.shopee.co.id', 'img.susercontent.com'];

function isBlockedAssetHost(url: string): boolean {
  const host = new URL(url).hostname.toLowerCase();
  if (host.endsWith('shopee.co.id') || host.endsWith('shopeemobile.com') || host.endsWith('shopeecdn.com')) {
    return !SHOPEE_IMAGE_HOST_SUFFIXES.some(s => host.endsWith(s));
  }
  return false;
}

function isImageLike(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  const path = parsed.pathname.toLowerCase();
  if (path.endsWith('.ico')) return false;
  return !/\.(js|mjs|css|json|xml|html?|txt|woff2?|ttf|eot|otf|mp4|mp3|webm|ogg|pdf|zip|wasm|map)$/.test(path);
}

export function sanitizeImageUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of urls) {
    const trimmed = (raw ?? '').trim().split(/\s+/)[0];
    if (!trimmed || trimmed.startsWith('data:')) continue;

    let absolute: string;
    try {
      absolute = new URL(trimmed).toString();
    } catch {
      continue;
    }

    const parsed = new URL(absolute);
    if (!['http:', 'https:'].includes(parsed.protocol)) continue;
    if (!isImageLike(absolute)) continue;
    if (TRACKING_TOKENS.some(w => absolute.toLowerCase().includes(w))) continue;
    if (isBlockedAssetHost(absolute)) continue;
    if (seen.has(absolute)) continue;

    seen.add(absolute);
    result.push(absolute);
  }
  return result.slice(0, 20);
}

const pushResolved = (raw: string[], src: string, baseUrl: string) => {
  const trimmed = (src ?? '').trim().split(/\s+/)[0];
  if (!trimmed || trimmed.startsWith('data:')) return;
  try {
    raw.push(new URL(trimmed, baseUrl).toString());
  } catch {
    // ignore malformed urls
  }
};

const ABSOLUTE_IMAGE_PATTERN = /https?:\/\/[^\s"'<>\\]+\.(?:jpe?g|png|webp|gif|avif)(?:\?[^\s"'<>\\]*)?/gi;

export function extractImagesFromHtml(html: string, baseUrl: string): string[] {
  const raw: string[] = [];

  const metaImage = html.match(
    /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i
  );
  if (metaImage?.[1]) pushResolved(raw, metaImage[1], baseUrl);

  const metaImageAlt = html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i
  );
  if (metaImageAlt?.[1]) pushResolved(raw, metaImageAlt[1], baseUrl);

  const imgTagPattern = /<img\b[^>]*>/gi;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = imgTagPattern.exec(html))) {
    const tag = tagMatch[0];
    const attrPattern = /(?:src|data-src|data-lazy-src|data-original|data-srcset)=["']([^"']+)["']/gi;
    let attr: RegExpExecArray | null;
    while ((attr = attrPattern.exec(tag))) {
      if (!attr[1]) continue;
      if (attr[0].startsWith('data-srcset=')) {
        for (const part of attr[1].split(',')) {
          const candidate = part.trim().split(/\s+/)[0];
          if (candidate) pushResolved(raw, candidate, baseUrl);
        }
      } else {
        pushResolved(raw, attr[1], baseUrl);
      }
    }
  }

  let absolute: RegExpExecArray | null;
  while ((absolute = ABSOLUTE_IMAGE_PATTERN.exec(html))) {
    pushResolved(raw, absolute[0], baseUrl);
  }

  return sanitizeImageUrls(raw);
}

export function extractImagesFromMarkdown(markdown: string, baseUrl: string): string[] {
  const raw: string[] = [];

  const imgPattern = /!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  let match: RegExpExecArray | null;
  while ((match = imgPattern.exec(markdown))) {
    if (match[1]) pushResolved(raw, match[1], baseUrl);
  }

  let absolute: RegExpExecArray | null;
  while ((absolute = ABSOLUTE_IMAGE_PATTERN.exec(markdown))) {
    pushResolved(raw, absolute[0], baseUrl);
  }

  return sanitizeImageUrls(raw);
}
