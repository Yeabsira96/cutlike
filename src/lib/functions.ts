import { inngest } from './inngest'
import { getInspoMetadata, downloadInspoClip } from './ytdlp'
import { buildStyleFingerprint } from './ffmpeg'
import { neon } from '@neondatabase/serverless'
import path from 'path'
import os from 'os'
import fs from 'fs'

const sql = neon(process.env.DATABASE_URL!)

// background job that analyzes an inspiration URL
// no timeout limit — can run as long as needed
export const analyzeInspoJob = inngest.createFunction(
  { id: 'analyze-inspo', timeout: '10m' },
  { event: 'inspo/analyze' },
  async ({ event, step }) => {
    const { inspoId, url, projectId } = event.data

    // step 1: fetch metadata
    const metadata = await step.run('fetch-metadata', async () => {
      return await getInspoMetadata(url)
    })

    // step 2: download 60s clip
    const clipPath = await step.run('download-clip', async () => {
      const tmpPath = path.join(os.tmpdir(), `cutlike_inspo_${inspoId}.mp4`)
      await downloadInspoClip(url, tmpPath)
      return tmpPath
    })

    // step 3: analyze with FFmpeg
    const fingerprint = await step.run('analyze-clip', async () => {
      try {
        const result = await buildStyleFingerprint(clipPath)
        // clean up tmp file
        if (fs.existsSync(clipPath)) fs.unlinkSync(clipPath)
        return result
      } catch (err) {
        if (fs.existsSync(clipPath)) fs.unlinkSync(clipPath)
        throw err
      }
    })

    // step 4: save to database
    await step.run('save-to-db', async () => {
      await sql`
        UPDATE inspirations SET
          title = ${metadata.title},
          editing_style = ${fingerprint.editingStyle},
          energy_level = ${fingerprint.energyLevel},
          cuts_per_minute = ${fingerprint.estimatedCutsPerMinute},
          avg_shot_length = ${fingerprint.avgShotLength},
          status = 'ready'
        WHERE id = ${inspoId}
      `
    })

    return { inspoId, fingerprint, metadata }
  }
)