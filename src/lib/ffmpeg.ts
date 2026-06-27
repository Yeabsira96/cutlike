import ffmpeg from 'fluent-ffmpeg'
import ffprobeInstaller from '@ffprobe-installer/ffprobe'

// tell fluent-ffmpeg where to find ffprobe
ffmpeg.setFfprobePath(ffprobeInstaller.path)

export interface VideoMetadata {
  duration: number        // total duration in seconds
  width: number           // video width in pixels
  height: number          // video height in pixels
  fps: number             // frames per second
  bitrate: number         // bitrate in kb/s
  codec: string           // video codec (h264, hevc etc)
  audioCodec: string      // audio codec
  sampleRate: number      // audio sample rate
  fileSize: number        // file size in bytes
}

export interface StyleFingerprint {
  duration: number
  estimatedCutsPerMinute: number   // how fast the editing is
  avgShotLength: number            // average seconds per shot
  resolution: string               // e.g. "1920x1080"
  fps: number
  hasAudio: boolean
  energyLevel: 'low' | 'medium' | 'high'  // derived from cuts/min
  editingStyle: 'cinematic' | 'fast-paced' | 'vlog' | 'unknown'
}

/**
 * Extract raw metadata from a video file
 * uses ffprobe under the hood
 */
export function getVideoMetadata(filePath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err)

      const videoStream = data.streams.find(s => s.codec_type === 'video')
      const audioStream = data.streams.find(s => s.codec_type === 'audio')

      if (!videoStream) return reject(new Error('No video stream found'))

      // parse fps from string like "30000/1001" or "30/1"
      const fpsRaw = videoStream.r_frame_rate || '30/1'
      const [num, den] = fpsRaw.split('/').map(Number)
      const fps = den ? num / den : num

      resolve({
        duration: Number(data.format.duration) || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        fps: Math.round(fps),
        bitrate: Number(data.format.bit_rate) / 1000 || 0,
        codec: videoStream.codec_name || 'unknown',
        audioCodec: audioStream?.codec_name || 'none',
        sampleRate: Number(audioStream?.sample_rate) || 0,
        fileSize: Number(data.format.size) || 0,
      })
    })
  })
}

/**
 * Detect scene changes in a video file
 * FFmpeg's scene filter outputs a score 0-1 for each frame
 * scores above threshold (0.3) = likely a cut
 */
export function detectSceneChanges(filePath: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const timestamps: number[] = []

    ffmpeg(filePath)
      .outputOptions([
        '-vf', 'select=gt(scene\\,0.3),showinfo',
        '-vsync', 'vfr',
        '-f', 'null',
      ])
      .output('/dev/null')
      .on('stderr', (line: string) => {
        // parse timestamp from showinfo output
        // looks like: [Parsed_showinfo] n:42 pts:1234 pts_time:4.200
        const match = line.match(/pts_time:([\d.]+)/)
        if (match) {
          timestamps.push(parseFloat(match[1]))
        }
      })
      .on('end', () => resolve(timestamps))
      .on('error', reject)
      .run()
  })
}

/**
 * Build a style fingerprint from a video file
 * this is the core of what makes CutLike smart
 * combines metadata + scene detection into one clean object
 */
export async function buildStyleFingerprint(
  filePath: string
): Promise<StyleFingerprint> {
  const [metadata, sceneChanges] = await Promise.all([
    getVideoMetadata(filePath),
    detectSceneChanges(filePath),
  ])

  const duration = metadata.duration
  const cutCount = sceneChanges.length

  // cuts per minute = how many cuts in 60 seconds
  const cutsPerMinute = duration > 0 ? (cutCount / duration) * 60 : 0

  // average shot length in seconds
  const avgShotLength = cutCount > 0 ? duration / cutCount : duration

  // classify energy level based on cuts per minute
  let energyLevel: StyleFingerprint['energyLevel']
  if (cutsPerMinute < 3) energyLevel = 'low'
  else if (cutsPerMinute < 8) energyLevel = 'medium'
  else energyLevel = 'high'

  // classify editing style
  let editingStyle: StyleFingerprint['editingStyle']
  if (cutsPerMinute < 2 && metadata.fps >= 24) editingStyle = 'cinematic'
  else if (cutsPerMinute >= 8) editingStyle = 'fast-paced'
  else if (cutsPerMinute >= 2 && cutsPerMinute < 8) editingStyle = 'vlog'
  else editingStyle = 'unknown'

  return {
    duration: Math.round(duration),
    estimatedCutsPerMinute: Math.round(cutsPerMinute * 10) / 10,
    avgShotLength: Math.round(avgShotLength * 10) / 10,
    resolution: `${metadata.width}x${metadata.height}`,
    fps: metadata.fps,
    hasAudio: metadata.audioCodec !== 'none',
    energyLevel,
    editingStyle,
  }
}