import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getVideoMetadata, buildStyleFingerprint } from '@/lib/ffmpeg'
import { writeFile } from 'fs/promises'
import path from 'path'
import os from 'os'

export async function POST(req: NextRequest) {
  // only logged in users can use this
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // save uploaded file to tmp directory
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tmpPath = path.join(os.tmpdir(), `cutlike_${Date.now()}_${file.name}`)
    await writeFile(tmpPath, buffer)

    // analyze the video
    const fingerprint = await buildStyleFingerprint(tmpPath)
    const metadata = await getVideoMetadata(tmpPath)

    return NextResponse.json({
      success: true,
      filename: file.name,
      metadata,
      fingerprint,
    })
  } catch (err) {
    console.error('analyze-footage error:', err)
    return NextResponse.json(
      { error: 'Failed to analyze footage' },
      { status: 500 }
    )
  }
}