import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { executeTimeline, generateEDL } from '@/lib/executor'
import { writeFile } from 'fs/promises'
import path from 'path'
import os from 'os'
import fs from 'fs'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()

    const timelineRaw = formData.get('timeline') as string
    if (!timelineRaw) {
      return NextResponse.json({ error: 'No timeline provided' }, { status: 400 })
    }

    const timeline = JSON.parse(timelineRaw)

    const fileMap: Record<string, string> = {}

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        const bytes = await value.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const tmpPath = path.join(os.tmpdir(), `cutlike_exec_${Date.now()}_${value.name}`)
        await writeFile(tmpPath, buffer)
        fileMap[value.name] = tmpPath
      }
    }

    const result = await executeTimeline(timeline, fileMap)

    Object.values(fileMap).forEach(p => {
      if (fs.existsSync(p)) fs.unlinkSync(p)
    })

    if (!result.success || !result.outputPath) {
      return NextResponse.json(
        { error: result.error || 'Execution failed' },
        { status: 500 }
      )
    }

    const outputBuffer = fs.readFileSync(result.outputPath)
    fs.unlinkSync(result.outputPath)

    const edl = generateEDL(timeline)

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="cutlike_edit.mp4"',
        'X-EDL': Buffer.from(edl).toString('base64'),
        'X-Duration': String(result.duration || 0),
      },
    })
  } catch (err) {
    console.error('execute route error:', err)
    return NextResponse.json(
      { error: 'Failed to execute timeline' },
      { status: 500 }
    )
  }
}