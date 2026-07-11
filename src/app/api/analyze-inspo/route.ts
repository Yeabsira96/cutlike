import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

function estimateStyle(title: string, description: string, duration: number) {
  const text = (title + ' ' + description).toLowerCase()

  const isCinematic =
    text.includes('cinematic') ||
    text.includes('film') ||
    text.includes('4k') ||
    text.includes('travel film') ||
    text.includes('documentary') ||
    text.includes('short film')

  const isFastPaced =
    text.includes('montage') ||
    text.includes('amv') ||
    text.includes('edit') ||
    text.includes('reels') ||
    text.includes('trending') ||
    text.includes('transition')

  const isVlog =
    text.includes('vlog') ||
    text.includes('day in my life') ||
    text.includes('travel vlog') ||
    text.includes('come with me') ||
    text.includes('week in') ||
    text.includes('trip')

  if (isCinematic) {
    return {
      editingStyle: 'cinematic',
      estimatedCutsPerMinute: 2.5,
      avgShotLength: 6.0,
      energyLevel: 'low',
    }
  } else if (isFastPaced) {
    return {
      editingStyle: 'fast-paced',
      estimatedCutsPerMinute: 12.0,
      avgShotLength: 1.5,
      energyLevel: 'high',
    }
  } else if (isVlog) {
    return {
      editingStyle: 'vlog',
      estimatedCutsPerMinute: 5.0,
      avgShotLength: 3.5,
      energyLevel: 'medium',
    }
  } else {
    return {
      editingStyle: 'vlog',
      estimatedCutsPerMinute: 4.0,
      avgShotLength: 4.0,
      energyLevel: 'medium',
    }
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { url, weight } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
    }

    try { new URL(url) } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // fast metadata fetch — no download, just JSON dump
    const { stdout } = await execAsync(
      `yt-dlp --dump-json --no-playlist --no-warnings "${url}"`,
      { timeout: 15000 }
    )

    const data = JSON.parse(stdout)

    const title = data.title || 'Unknown'
    const description = data.description || ''
    const duration = data.duration || 0
    const platform = url.includes('youtube.com') || url.includes('youtu.be')
      ? 'youtube'
      : url.includes('tiktok.com')
      ? 'tiktok'
      : 'other'

    const fingerprint = estimateStyle(title, description, duration)

    return NextResponse.json({
      success: true,
      analysis: {
        metadata: {
          title,
          duration,
          platform,
          url,
          thumbnail: data.thumbnail || '',
        },
        fingerprint: {
          ...fingerprint,
          resolution: '1920x1080',
          fps: 30,
          hasAudio: true,
        },
        weight: weight || 50,
      },
    })
  } catch (err) {
    console.error('analyze-inspo error:', err)
    return NextResponse.json(
      { error: 'Failed to analyze URL. Make sure it is a valid YouTube or TikTok link.' },
      { status: 500 }
    )
  }
}