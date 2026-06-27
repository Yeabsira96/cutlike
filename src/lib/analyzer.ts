import { buildStyleFingerprint, StyleFingerprint } from './ffmpeg'
import { getInspoMetadata, downloadInspoClip } from './ytdlp'
import path from 'path'
import os from 'os'
import fs from 'fs'

export interface InspoAnalysis {
  metadata: {
    title: string
    duration: number
    platform: string
    url: string
  }
  fingerprint: StyleFingerprint
  weight: number  // 0-100, how much influence this inspo has
}

export interface EditContext {
  footage: {
    files: string[]
    totalDuration: number
    clipCount: number
  }
  inspirations: InspoAnalysis[]
  blendedStyle: {
    targetCutsPerMinute: number
    targetAvgShotLength: number
    dominantStyle: string
    energyLevel: string
  }
}

/**
 * Analyze an inspiration URL fully
 * 1. fetch metadata (fast, no download)
 * 2. download first 60s clip
 * 3. run scene detection on clip
 * 4. build style fingerprint
 */
export async function analyzeInspoUrl(
  url: string,
  weight: number = 50
): Promise<InspoAnalysis> {
  // step 1: get metadata
  const metadata = await getInspoMetadata(url)

  // step 2: download first 60s to tmp
  const tmpPath = path.join(os.tmpdir(), `cutlike_inspo_${Date.now()}.mp4`)

  try {
    await downloadInspoClip(url, tmpPath)

    // step 3 + 4: analyze the clip
    const fingerprint = await buildStyleFingerprint(tmpPath)

    return {
      metadata: {
        title: metadata.title,
        duration: metadata.duration,
        platform: metadata.platform,
        url,
      },
      fingerprint,
      weight,
    }
  } finally {
    // always clean up tmp file
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath)
    }
  }
}

/**
 * Blend multiple inspiration analyses into one target style
 * weighted average of all the style fingerprints
 * this is what Claude gets as context
 */
export function blendInspirations(inspirations: InspoAnalysis[]): EditContext['blendedStyle'] {
  if (inspirations.length === 0) {
    return {
      targetCutsPerMinute: 4,
      targetAvgShotLength: 3,
      dominantStyle: 'vlog',
      energyLevel: 'medium',
    }
  }

  const totalWeight = inspirations.reduce((sum, i) => sum + i.weight, 0)

  // weighted average of cuts per minute
  const targetCutsPerMinute = inspirations.reduce((sum, i) => {
    return sum + (i.fingerprint.estimatedCutsPerMinute * i.weight)
  }, 0) / totalWeight

  // weighted average of shot length
  const targetAvgShotLength = inspirations.reduce((sum, i) => {
    return sum + (i.fingerprint.avgShotLength * i.weight)
  }, 0) / totalWeight

  // dominant style = style from highest-weight inspiration
  const dominant = inspirations.reduce((a, b) => a.weight > b.weight ? a : b)

  return {
    targetCutsPerMinute: Math.round(targetCutsPerMinute * 10) / 10,
    targetAvgShotLength: Math.round(targetAvgShotLength * 10) / 10,
    dominantStyle: dominant.fingerprint.editingStyle,
    energyLevel: dominant.fingerprint.energyLevel,
  }
}