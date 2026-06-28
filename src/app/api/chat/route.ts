import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { message, clips, inspirations } = await req.json()

    const clipsContext = clips?.length > 0
      ? clips.map((c: {
          filename: string
          duration: number
          fingerprint?: {
            estimatedCutsPerMinute: number
            avgShotLength: number
            editingStyle: string
            energyLevel: string
          }
        }) =>
          `- ${c.filename}: ${c.duration}s duration, ${c.fingerprint?.editingStyle || 'unknown'} style, ${c.fingerprint?.estimatedCutsPerMinute || '?'} cuts/min`
        ).join('\n')
      : 'No footage uploaded yet'

    const inspoContext = inspirations?.length > 0
      ? inspirations.map((i: {
          title?: string
          url: string
          weight: number
          fingerprint?: {
            estimatedCutsPerMinute: number
            avgShotLength: number
            editingStyle: string
            energyLevel: string
          }
        }) =>
          `- ${i.title || i.url}: ${i.fingerprint?.estimatedCutsPerMinute || '?'} cuts/min, ${i.fingerprint?.editingStyle || 'unknown'} style, ${i.fingerprint?.energyLevel || '?'} energy, ${i.weight}% influence`
        ).join('\n')
      : 'No inspirations added yet'

    const systemPrompt = `You are CutLike's AI video editor. You analyze footage and inspiration videos to generate precise edit instructions based on real FFmpeg scene detection data.

FOOTAGE UPLOADED:
${clipsContext}

INSPIRATION STYLE ANALYSIS:
${inspoContext}

Your job is to generate a structured edit plan. Always respond with:
1. A brief human-readable message (2-3 sentences) explaining your edit decisions based on the actual data
2. A JSON timeline wrapped in <timeline> tags

The timeline format must be exactly:
[
  {
    "clipId": "filename",
    "filename": "original filename",
    "startTime": 0,
    "endTime": 4.2,
    "transition": "cut"
  }
]

Transition options: "cut", "crossfade", "dissolve"

Rules:
- Base cut timing decisions on the actual cuts/min data from the inspiration analysis
- If energy is high, keep shots short (1-3s). If low, keep shots longer (4-8s)
- Match the dominant editing style from the inspirations
- If no footage or inspirations provided, ask the user to add them first
- Always wrap timeline JSON in <timeline> tags
- Keep your human message friendly and specific to the actual data`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    })

    const rawText = completion.choices[0]?.message?.content || ''

    // extract timeline JSON from between <timeline> tags
    const timelineMatch = rawText.match(/<timeline>([\s\S]*?)<\/timeline>/)
    let timeline = []

    if (timelineMatch) {
      try {
        timeline = JSON.parse(timelineMatch[1].trim())
      } catch {
        console.error('Failed to parse timeline JSON:', timelineMatch[1])
      }
    }

    // human message = everything outside the timeline tags
    const humanMessage = rawText
      .replace(/<timeline>[\s\S]*?<\/timeline>/, '')
      .trim()

    return NextResponse.json({
      success: true,
      message: humanMessage || 'Edit generated successfully.',
      timeline,
    })
  } catch (err) {
    console.error('chat route error:', err)
    return NextResponse.json(
      { error: 'Failed to generate edit' },
      { status: 500 }
    )
  }
}