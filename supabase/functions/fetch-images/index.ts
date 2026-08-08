import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const TRACKING_TOKENS = ['spinner', 'placeholder', 'transparent', 'pixel', 'loading', 'lazyload', 'favicon']

const SHOPEE_IMAGE_HOST_SUFFIXES = ['cf.shopee.co.id', 'img.shopee.co.id', 'img.susercontent.com']

function isBlockedAssetHost(url: string): boolean {
  const host = new URL(url).hostname.toLowerCase()
  if (
    host.endsWith('shopee.co.id') ||
    host.endsWith('shopeemobile.com') ||
    host.endsWith('shopeecdn.com')
  ) {
    return !SHOPEE_IMAGE_HOST_SUFFIXES.some(s => host.endsWith(s))
  }
  return false
}

function isImageLike(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  const path = parsed.pathname.toLowerCase()
  if (path.endsWith('.ico')) return false
  return !/\.(js|mjs|css|json|xml|html?|txt|woff2?|ttf|eot|otf|mp4|mp3|webm|ogg|pdf|zip|wasm|map)$/.test(path)
}

const ABSOLUTE_IMAGE_PATTERN = /https?:\/\/[^\s"'<>\\]+\.(?:jpe?g|png|webp|gif|avif)(?:\?[^\s"'<>\\]*)?/gi

function isBlockedPage(html: string): boolean {
  const head = html.slice(0, 20000).toLowerCase()
  if (head.includes('security check')) return true
  if (head.includes('captcha')) return true
  if (head.includes('verify you are human')) return true
  if (head.includes('slido') || head.includes('frost')) return true
  return false
}

function extractImages(html: string, baseUrl: URL): string[] {
  const found = new Set<string>()
  const add = (src: string) => {
    const trimmed = (src ?? '').trim().split(/\s+/)[0]
    if (!trimmed || trimmed.startsWith('data:')) return
    try {
      const absolute = new URL(trimmed, baseUrl).toString()
      if (!['http:', 'https:'].includes(new URL(absolute).protocol)) return
      if (!isImageLike(absolute)) return
      found.add(absolute)
    } catch {
      // ignore malformed urls
    }
  }

  // og:image / twitter:image meta tags are usually the primary product image
  const metaImage = html.match(
    /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i
  )
  if (metaImage?.[1]) add(metaImage[1])

  const metaImageAlt = html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i
  )
  if (metaImageAlt?.[1]) add(metaImageAlt[1])

  // collect image urls only from <img> tags (not script/link tags)
  const imgTagPattern = /<img\b[^>]*>/gi
  let tagMatch: RegExpExecArray | null
  while ((tagMatch = imgTagPattern.exec(html))) {
    const tag = tagMatch[0]
    const attrPattern = /(?:src|data-src|data-lazy-src|data-original|data-srcset)=["']([^"']+)["']/gi
    let attr: RegExpExecArray | null
    while ((attr = attrPattern.exec(tag))) {
      if (!attr[1]) continue
      // srcset may contain comma separated candidates; keep each candidate url
      if (attr[0].startsWith('data-srcset=')) {
        for (const part of attr[1].split(',')) {
          const candidate = part.trim().split(/\s+/)[0]
          if (candidate) add(candidate)
        }
      } else {
        add(attr[1])
      }
    }
  }

  // scan for absolute image urls embedded anywhere (json blobs, etc.)
  let absolute: RegExpExecArray | null
  while ((absolute = ABSOLUTE_IMAGE_PATTERN.exec(html))) {
    add(absolute[0])
  }

  const filtered = [...found].filter(u => {
    const lower = u.toLowerCase()
    if (TRACKING_TOKENS.some(w => lower.includes(w))) return false
    if (isBlockedAssetHost(u)) return false
    return true
  })

  return filtered.slice(0, 20)
}

function extractShopeeImageHashes(data: unknown): string[] {
  const item = (data as { item?: { images?: unknown } })?.item
  const images = Array.isArray(item?.images) ? item.images : undefined
  if (!Array.isArray(images)) return []
  return images
    .filter((h: unknown): h is string => typeof h === 'string' && /^[a-zA-Z0-9_-]+$/.test(h))
    .map((h: string) => `https://cf.shopee.co.id/file/${h}`)
}

async function extractShopeeImages(url: URL): Promise<string[] | null> {
  if (!/shopee\.co\.id/i.test(url.hostname)) return null
  const match = url.pathname.match(/-i\.(\d+)\.(\d+)/)
  if (!match) return null
  const [, shopId, itemId] = match
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json',
    Referer: url.origin,
    'x-api-source': 'pc',
    'af-ac-enc-dat': '0',
  }
  const endpoints = [
    `https://shopee.co.id/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`,
    `https://shopee.co.id/api/v4/pdp/get_pc?item_id=${itemId}&shop_id=${shopId}&version=1`,
  ]
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, { headers, redirect: 'follow' })
      if (!res.ok) continue
      const data = await res.json()
      const item = (data as { item?: unknown; data?: unknown })?.item
      const images = extractShopeeImageHashes(data) || extractShopeeImageHashes((data as { data?: unknown })?.data)
      if (images.length) return images
    } catch {
      // try next endpoint
    }
  }
  return null
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const rawUrl = body?.url
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
      return json({ error: 'url is required' }, 400)
    }

    let baseUrl: URL
    try {
      baseUrl = new URL(rawUrl.trim())
    } catch {
      return json({ error: 'invalid url' }, 400)
    }
    if (!['http:', 'https:'].includes(baseUrl.protocol)) {
      return json({ error: 'invalid url protocol' }, 400)
    }

    // shopee product pages are JS shells with no server-side images; use the api instead
    const shopeeImages = await extractShopeeImages(baseUrl)
    if (shopeeImages && shopeeImages.length) {
      return json({ url: baseUrl.toString(), images: shopeeImages })
    }

    const res = await fetch(baseUrl.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })
    if (!res.ok) {
      return json({ error: `Failed to fetch page: ${res.status}` }, 502)
    }

    const html = await res.text()
    if (isBlockedPage(html)) {
      return json({
        error: 'blocked',
        message: 'The page is protected by anti-bot / captcha and blocks automatic image extraction.',
      })
    }
    const images = extractImages(html, baseUrl)

    return json({ url: baseUrl.toString(), images })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to extract images'
    return json({ error: message }, 500)
  }
})
