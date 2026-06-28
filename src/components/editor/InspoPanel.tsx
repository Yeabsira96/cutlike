'use client'
import { useState } from 'react'
import { useEditor } from '@/context/EditorContext'
import styles from './InspoPanel.module.css'

export default function InspoPanel() {
  const { state, addInspo, removeInspo, updateInspo, setIsGenerating, setTimeline, addMessage } = useEditor()
  const [input, setInput] = useState('')

  async function handleAddInspo() {
    const trimmed = input.trim()
    if (!trimmed) return
    if (state.inspirations.length >= 4) return
    setInput('')

    // add to state first so UI updates immediately
    addInspo(trimmed, 50)

    // find the inspo we just added
    const inspoId = Date.now().toString()

    try {
      const res = await fetch('/api/analyze-inspo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, weight: 50 }),
      })

      const data = await res.json()

      if (data.success) {
        // update the inspo with real analysis
        const inspirations = state.inspirations
        const last = inspirations[inspirations.length - 1]
        if (last) {
          updateInspo(last.id, {
            status: 'ready',
            title: data.analysis.metadata.title,
            fingerprint: data.analysis.fingerprint,
          })
        }
      }
    } catch {
      console.error('Failed to analyze inspo')
    }
  }

  async function handleGenerate() {
    if (state.clips.length === 0) {
      addMessage({
        role: 'ai',
        text: 'Please upload some footage first before generating an edit.',
        timestamp: new Date(),
      })
      return
    }

    if (state.inspirations.length === 0) {
      addMessage({
        role: 'ai',
        text: 'Please add at least one inspiration link so I know what style to aim for.',
        timestamp: new Date(),
      })
      return
    }

    setIsGenerating(true)
    addMessage({
      role: 'ai',
      text: `Analyzing ${state.clips.length} clips and ${state.inspirations.length} inspiration${state.inspirations.length > 1 ? 's' : ''}. Building your edit now...`,
      timestamp: new Date(),
    })

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Generate an edit based on my footage and inspiration links',
          clips: state.clips.map(c => ({
            filename: c.filename,
            duration: c.metadata?.duration || 0,
            fingerprint: c.fingerprint,
          })),
          inspirations: state.inspirations.map(i => ({
            url: i.url,
            weight: i.weight,
            title: i.title,
            fingerprint: i.fingerprint,
          })),
        }),
      })

      const data = await res.json()

      if (data.timeline) {
        setTimeline(data.timeline)
      }

      addMessage({
        role: 'ai',
        text: data.message || 'Edit generated! Check the timeline below.',
        timestamp: new Date(),
      })
    } catch {
      addMessage({
        role: 'ai',
        text: 'Something went wrong generating the edit. Try again.',
        timestamp: new Date(),
      })
    } finally {
      setIsGenerating(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleAddInspo()
  }

  function updateWeight(id: string, weight: number) {
    updateInspo(id, { weight })
  }

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
          />
          <button
            className={styles.addBtn}
            onClick={handleAddInspo}
            disabled={state.inspirations.length >= 4}
          >
            +
          </button>
        </div>

        {state.inspirations.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>🔗</p>
            <p className={styles.emptyText}>Add a video you want to edit like</p>
            <p className={styles.emptySub}>Try a travel vlog, cinematic reel, or TikTok</p>
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
                      {inspo.status === 'analyzing' ? '⟳ analyzing...' : 'pending analysis'}
                    </p>
                  )}
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeInspo(inspo.id)}
                >
                  ✕
                </button>
              </div>

              <div className={styles.weightRow}>
                <span className={styles.weightLabel}>Influence</span>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={inspo.weight}
                  onChange={e => updateWeight(inspo.id, Number(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.weightValue}>{inspo.weight}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TIMELINE */}
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

      {/* GENERATE BUTTON */}
      <div className={styles.generateSection}>
        <button
          className={styles.generateBtn}
          onClick={handleGenerate}
          disabled={state.isGenerating}
        >
          {state.isGenerating ? '⟳ Generating...' : '✂️ Generate edit'}
        </button>
        <p className={styles.generateHint}>
          {state.clips.length} clip{state.clips.length !== 1 ? 's' : ''} · {state.inspirations.length} inspiration{state.inspirations.length !== 1 ? 's' : ''}
        </p>
      </div>
    </main>
  )
}