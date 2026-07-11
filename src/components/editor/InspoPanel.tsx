'use client'
import { useState } from 'react'
import { useEditor } from '@/context/EditorContext'
import styles from './InspoPanel.module.css'

export default function InspoPanel() {
  const { state, addInspo, removeInspo, updateInspo, setIsGenerating, setTimeline, addMessage } = useEditor()
  const [input, setInput] = useState('')
  const [analyzingUrl, setAnalyzingUrl] = useState('')

  async function handleAddInspo() {
    const trimmed = input.trim()
    if (!trimmed) return
    if (state.inspirations.length >= 4) return
    setInput('')
    setAnalyzingUrl(trimmed)

    addInspo(trimmed, 50)

    try {
      const res = await fetch('/api/analyze-inspo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, weight: 50 }),
      })

      const data = await res.json()

      if (data.success) {
        // find inspo by url and update it
        const currentInspos = state.inspirations
        const match = currentInspos.find(i => i.url === trimmed)
        const targetId = match?.id

        if (targetId) {
          updateInspo(targetId, {
            status: 'ready',
            title: data.analysis.metadata.title,
            fingerprint: data.analysis.fingerprint,
          })
        }
      }
    } catch (err) {
      console.error('Failed to analyze inspo:', err)
    } finally {
      setAnalyzingUrl('')
    }
  }

  async function handleGenerate() {
    if (state.clips.length === 0) {
      addMessage({
        role: 'ai',
        text: 'Please upload some footage first.',
        timestamp: new Date(),
      })
      return
    }

    if (state.inspirations.length === 0) {
      addMessage({
        role: 'ai',
        text: 'Please add at least one inspiration link.',
        timestamp: new Date(),
      })
      return
    }

    const pendingClips = state.clips.filter(c => c.status !== 'ready')
    if (pendingClips.length > 0) {
      addMessage({
        role: 'ai',
        text: 'Please click Analyze on your footage clips first.',
        timestamp: new Date(),
      })
      return
    }

    setIsGenerating(true)
    addMessage({
      role: 'ai',
      text: `Blending ${state.inspirations.length} inspiration style${state.inspirations.length > 1 ? 's' : ''} with your ${state.clips.length} clip${state.clips.length > 1 ? 's' : ''}...`,
      timestamp: new Date(),
    })

    try {
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Generate an edit based on my footage and inspiration links',
          clips: state.clips.map(c => ({
            filename: c.filename,
            duration: c.metadata?.duration || 0,
            fingerprint: c.fingerprint || null,
          })),
          inspirations: state.inspirations.map(i => ({
            url: i.url,
            weight: i.weight,
            title: i.title || i.url,
            fingerprint: i.fingerprint || null,
          })),
        }),
      })

      const chatData = await chatRes.json()

      if (chatData.timeline?.length > 0) {
        setTimeline(chatData.timeline)
        addMessage({
          role: 'ai',
          text: chatData.message || 'Timeline generated! Rendering your video now...',
          timestamp: new Date(),
        })

        addMessage({
          role: 'ai',
          text: '⟳ Running FFmpeg — this takes 30-60 seconds depending on clip length...',
          timestamp: new Date(),
        })

        const formData = new FormData()
        formData.append('timeline', JSON.stringify(chatData.timeline))
        state.clips.forEach(clip => {
          formData.append(`file_${clip.filename}`, clip.file)
        })

        const execRes = await fetch('/api/execute', {
          method: 'POST',
          body: formData,
        })

        if (execRes.ok) {
          const blob = await execRes.blob()
          const videoUrl = URL.createObjectURL(blob)

          addMessage({
            role: 'ai',
            text: '✓ Your edited video is ready and downloading now!',
            timestamp: new Date(),
          })

          const a = document.createElement('a')
          a.href = videoUrl
          a.download = 'cutlike_edit.mp4'
          a.click()
        } else {
          addMessage({
            role: 'ai',
            text: 'Rendering failed. Try with a shorter clip under 10MB.',
            timestamp: new Date(),
          })
        }
      } else {
        addMessage({
          role: 'ai',
          text: chatData.message || 'Could not generate timeline. Make sure clips are analyzed.',
          timestamp: new Date(),
        })
      }
    } catch {
      addMessage({
        role: 'ai',
        text: 'Something went wrong. Check your connection and try again.',
        timestamp: new Date(),
      })
    } finally {
      setIsGenerating(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAddInspo()
  }

  const allClipsReady = state.clips.length > 0 &&
    state.clips.every(c => c.status === 'ready')
  const allInsposReady = state.inspirations.length > 0 &&
    state.inspirations.every(i => i.status === 'ready')

  return (
    <main className={styles.panel}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <p className={styles.label}>Style inspiration</p>
          <span className={styles.badge}>{state.inspirations.length}/4</span>
        </div>

        <div className={styles.inputRow}>
          <input
            className={styles.input}
            type="url"
            placeholder="Paste YouTube or TikTok URL..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!!analyzingUrl}
          />
          <button
            className={styles.addBtn}
            onClick={handleAddInspo}
            disabled={state.inspirations.length >= 4 || !!analyzingUrl}
          >
            {analyzingUrl ? '⟳' : '+'}
          </button>
        </div>

        {analyzingUrl && (
          <div className={styles.analyzingBanner}>
            <span className={styles.analyzingDot} />
            Analyzing video — fetching style data...
          </div>
        )}

        {state.inspirations.length === 0 && !analyzingUrl && (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>🔗</p>
            <p className={styles.emptyText}>Add a video you want to edit like</p>
            <p className={styles.emptySub}>Paste any YouTube or TikTok URL</p>
          </div>
        )}

        <div className={styles.linkList}>
          {state.inspirations.map((inspo) => (
            <div key={inspo.id} className={styles.linkCard}>
              <div className={styles.linkTop}>
                <div className={`${styles.platform} ${styles[inspo.platform]}`}>
                  {inspo.platform === 'youtube' ? '▶' : inspo.platform === 'tiktok' ? '♪' : '🔗'}
                </div>
                <div className={styles.linkInfo}>
                  <p className={styles.linkTitle}>
                    {inspo.title || inspo.url.slice(0, 35) + '...'}
                  </p>
                  {inspo.fingerprint ? (
                    <p className={styles.linkMeta}>
                      {inspo.fingerprint.estimatedCutsPerMinute} cuts/min
                      · {inspo.fingerprint.editingStyle}
                      · {inspo.fingerprint.energyLevel} energy
                    </p>
                  ) : (
                    <p className={styles.linkMeta}>
                      {inspo.url === analyzingUrl ? '⟳ analyzing...' : '○ pending'}
                    </p>
                  )}
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeInspo(inspo.id)}
                >✕</button>
              </div>

              <div className={styles.weightRow}>
                <span className={styles.weightLabel}>Influence</span>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={inspo.weight}
                  onChange={e => updateInspo(inspo.id, { weight: Number(e.target.value) })}
                  className={styles.slider}
                />
                <span className={styles.weightValue}>{inspo.weight}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {state.timeline.length > 0 && (
        <div className={styles.timelineSection}>
          <p className={styles.label} style={{ padding: '0 16px', marginBottom: '8px' }}>
            Generated timeline
          </p>
          <div className={styles.timeline}>
            {state.timeline.map((clip, i) => (
              <div
                key={i}
                className={styles.timelineClip}
                style={{ width: `${Math.max(8, (clip.endTime - clip.startTime) * 8)}%` }}
                title={`${clip.filename} (${clip.startTime}s - ${clip.endTime}s)`}
              >
                <span className={styles.clipLabel}>
                  {clip.filename.split('.')[0].slice(0, 8)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.generateSection}>
        <button
          className={styles.generateBtn}
          onClick={handleGenerate}
          disabled={state.isGenerating || !!analyzingUrl}
        >
          {state.isGenerating ? '⟳ Rendering...' : '✂️ Generate edit'}
        </button>
        <p className={styles.generateHint}>
          {allClipsReady && allInsposReady
            ? '✓ Ready to generate'
            : `${state.clips.length} clip${state.clips.length !== 1 ? 's' : ''} · ${state.inspirations.length} inspo`
          }
        </p>
      </div>
    </main>
  )
}