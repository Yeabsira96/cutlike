import ffmpeg from 'fluent-ffmpeg'
import ffprobeInstaller from '@ffprobe-installer/ffprobe'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import os from 'os'

ffmpeg.setFfprobePath(ffprobeInstaller.path)

export interface TimelineClip {
  clipId: string
  filename: string
  startTime: number
  endTime: number
  transition: 'cut' | 'crossfade' | 'dissolve'
}

export interface ExecutionResult {
  success: boolean
  outputPath?: string
  duration?: number
  error?: string
}

/**
 * Takes a timeline JSON from Groq and a map of uploaded files
 * runs FFmpeg to produce a real MP4 output
 * returns the path to the output file
 */
export async function executeTimeline(
  timeline: TimelineClip[],
  fileMap: Record<string, string>, // filename -> tmp file path
  outputDir: string = os.tmpdir()
): Promise<ExecutionResult> {
  if (timeline.length === 0) {
    return { success: false, error: 'Empty timeline' }
  }

  const outputId = uuidv4()
  const outputPath = path.join(outputDir, `cutlike_output_${outputId}.mp4`)

  try {
    // step 1: trim each clip to its start/end time
    // saves each trimmed segment to tmp
    const segmentPaths: string[] = []

    for (let i = 0; i < timeline.length; i++) {
      const clip = timeline[i]
      const sourcePath = fileMap[clip.filename]

      if (!sourcePath || !fs.existsSync(sourcePath)) {
        console.warn(`Skipping ${clip.filename} — file not found`)
        continue
      }

      const segmentPath = path.join(
        os.tmpdir(),
        `cutlike_seg_${outputId}_${i}.mp4`
      )

      await trimClip(sourcePath, segmentPath, clip.startTime, clip.endTime)
      segmentPaths.push(segmentPath)
    }

    if (segmentPaths.length === 0) {
      return { success: false, error: 'No valid clips to process' }
    }

    // step 2: concatenate all segments into final output
    await concatenateSegments(segmentPaths, outputPath)

    // step 3: clean up segment tmp files
    segmentPaths.forEach(p => {
      if (fs.existsSync(p)) fs.unlinkSync(p)
    })

    // get duration of output
    const { duration } = await getOutputDuration(outputPath)

    return {
      success: true,
      outputPath,
      duration,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Trim a single clip to start/end time
 */
function trimClip(
  inputPath: string,
  outputPath: string,
  startTime: number,
  endTime: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const duration = endTime - startTime

    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .outputOptions([
        '-c:v libx264',
        '-c:a aac',
        '-avoid_negative_ts make_zero',
        // re-encode to ensure consistent format for concatenation
        '-preset fast',
        '-crf 23',
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', reject)
      .run()
  })
}

/**
 * Concatenate multiple video segments into one file
 * uses FFmpeg's concat demuxer — fastest method, no re-encoding
 */
function concatenateSegments(
  segmentPaths: string[],
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // write a concat list file that FFmpeg reads
    const listPath = path.join(os.tmpdir(), `cutlike_list_${Date.now()}.txt`)
    const listContent = segmentPaths
      .map(p => `file '${p}'`)
      .join('\n')

    fs.writeFileSync(listPath, listContent)

    ffmpeg()
      .input(listPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions(['-c copy']) // no re-encode needed since segments match
      .output(outputPath)
      .on('end', () => {
        // clean up list file
        if (fs.existsSync(listPath)) fs.unlinkSync(listPath)
        resolve()
      })
      .on('error', (err) => {
        if (fs.existsSync(listPath)) fs.unlinkSync(listPath)
        reject(err)
      })
      .run()
  })
}

/**
 * Get duration of output file to return to client
 */
function getOutputDuration(filePath: string): Promise<{ duration: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err)
      resolve({ duration: Number(data.format.duration) || 0 })
    })
  })
}

/**
 * Generate an EDL (Edit Decision List) for Premiere Pro
 * EDL is a plain text format all professional editors understand
 */
export function generateEDL(timeline: TimelineClip[]): string {
  const lines: string[] = []
  lines.push('TITLE: CutLike Export')
  lines.push('FCM: NON-DROP FRAME')
  lines.push('')

  timeline.forEach((clip, i) => {
    const eventNum = String(i + 1).padStart(3, '0')
    const startTC = secondsToTimecode(clip.startTime)
    const endTC = secondsToTimecode(clip.endTime)
    const duration = clip.endTime - clip.startTime
    const recStart = secondsToTimecode(
      timeline.slice(0, i).reduce((sum, c) => sum + (c.endTime - c.startTime), 0)
    )
    const recEnd = secondsToTimecode(
      timeline.slice(0, i + 1).reduce((sum, c) => sum + (c.endTime - c.startTime), 0)
    )

    lines.push(`${eventNum}  ${clip.filename.slice(0, 8).padEnd(8)} V     C        ${startTC} ${endTC} ${recStart} ${recEnd}`)
    lines.push(`* FROM CLIP NAME: ${clip.filename}`)
    lines.push(`* CLIP DURATION: ${duration.toFixed(2)}s`)
    lines.push('')
  })

  return lines.join('\n')
}

/**
 * Convert seconds to SMPTE timecode HH:MM:SS:FF
 */
function secondsToTimecode(seconds: number, fps: number = 30): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const f = Math.floor((seconds % 1) * fps)
  return [h, m, s, f].map(n => String(n).padStart(2, '0')).join(':')
}