import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import https from 'https'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const IMAGES_DIR = path.join(process.cwd(), 'public', 'generated')

function ensureDir() {
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true })
}

function downloadImage(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https.get(url, res => {
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
    }).on('error', err => {
      fs.unlink(dest, () => {})
      reject(err)
    })
  })
}

export async function generateImage(
  prompt: string,
  filename: string,
  size: '1024x1024' | '1792x1024' | '1024x1792' = '1792x1024'
): Promise<string> {
  ensureDir()

  const enhancedPrompt = `${prompt}. Professional blog article illustration, clean and modern design, high quality, vibrant colors, no text overlays.`

  const res = await openai.images.generate({
    model: 'dall-e-3',
    prompt: enhancedPrompt,
    size,
    quality: 'standard',
    n: 1,
  })

  const imageUrl = res.data?.[0]?.url
  if (!imageUrl) throw new Error('画像URLが取得できませんでした')

  const ext = '.png'
  const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, '_') + ext
  const destPath = path.join(IMAGES_DIR, safeName)
  await downloadImage(imageUrl, destPath)

  return `/generated/${safeName}`
}

export async function generateTopImage(prompt: string, articleId: string): Promise<string> {
  return generateImage(prompt, `top_${articleId}`, '1792x1024')
}

export async function generateSectionImage(prompt: string, articleId: string, index: number): Promise<string> {
  return generateImage(prompt, `section_${articleId}_${index}`, '1792x1024')
}
