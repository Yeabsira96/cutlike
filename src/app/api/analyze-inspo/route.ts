import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { analyzeInspoUrl } from '@/lib/analyzer'

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

    // validate it's a real URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const analysis = await analyzeInspoUrl(url, weight || 50)

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (err) {
    console.error('analyze-inspo error:', err)
    return NextResponse.json(
      { error: 'Failed to analyze inspiration URL' },
      { status: 500 }
    )
  }
}