import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface InspoMetadata {
  title: string
  duration: number
  viewCount: number
  platform: 'youtube' | 'tiktok' | 'other'
  url: string
  thumbnail: string
  description: string
}

/**
 * Extract metadata from a YouTube or TikTok URL
 * yt-dlp --dump-json returns a JSON blob with everything we need
 * we never download the actual video — just the metadata
 */
export async function getInspoMetadata(url: string): Promise<InspoMetadata> {
  try {
    // --dump-json = print metadata as JSON, no download
    // --no-playlist = don't expand playlists
    const { stdout } = await execAsync(
      `yt-dlp --dump-json --no-playlist "${url}"`
    )

    const data = JSON.parse(stdout)

    const platform = url.includes('youtube.com') || url.includes('youtu.be')
      ? 'youtube'
      : url.includes('tiktok.com')
      ? 'tiktok'
      : 'other'

    return {
      title: data.title || 'Unknown',
      duration: data.duration || 0,
      viewCount: data.view_count || 0,
      platform,
      url,
      thumbnail: data.thumbnail || '',
      description: data.description || '',
    }
  } catch (err) {
    throw new Error(`Failed to fetch metadata for ${url}: ${err}`)
  }
}

/**
 * Download a short clip from a URL for analysis
 * we only download first 60 seconds to keep it fast
 * saves to /tmp so it gets cleaned up automatically
 */
export async function downloadInspoClip(
  url: string,
  outputPath: string
): Promise<string> {
  try {
    // --download-sections downloads only first 60s
    // -f bestvideo[height<=720] keeps file size small
    await execAsync(
      `yt-dlp --download-sections "*0-60" -f "bestvideo[height<=720]+bestaudio/best[height<=720]" -o "${outputPath}" "${url}"`
    )
    return outputPath
  } catch (err) {
    throw new Error(`Failed to download clip: ${err}`)
  }
}