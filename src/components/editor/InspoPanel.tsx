'use client'
import { useState } from 'react'
import styles from './InspoPanel.module.css'

interface InspoLink {
  url: string
  weight: number
  platform: 'youtube' | 'tiktok' | 'other'
  title: string
}

function detectPlatform(url: string): 'youtube' | 'tiktok' | 'other' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('tiktok.com')) return 'tiktok'
  return 'other'
}

export default function InspoPanel() {
  const [links, setLinks] = useState<InspoLink[]>([])
  const [input, setInput] = useState('')

  function addLink() {
    const trimmed = input.trim()
    if (!trimmed) return
    const platform = detectPlatform(trimmed)
    const newLink: InspoLink = {
      url: trimmed,
      weight: 50,
      platform,
      title: platform === 'youtube' ? 'YouTube video' : platform === 'tiktok' ? 'TikTok video' : 'Video',
    }
    setLinks(prev => [...prev, newLink])
    setInput('')
  }

  function removeLink(index: number) {
    setLinks(prev => prev.filter((_, i) => i !== index))
  }

  function updateWeight(index: number, weight: number) {
    setLinks(prev => prev.map((l, i) => i === index ? { ...l, weight } : l))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') addLink()
  }

  return (
    <main className={styles.panel}>

      {/* INSPO SECTION */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <p className={styles.label}>Style inspiration</p>
          <span className={styles.badge}>{links.length}/4</span>
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
          <button className={styles.addBtn} onClick={addLink}>+</button>
        </div>

        {links.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>🔗</p>
            <p className={styles.emptyText}>Add a video you want to edit like</p>
            <p className={styles.emptySub}>Try a travel vlog, cinematic reel, or TikTok you love</p>
          </div>
        )}

        <div className={styles.linkList}>
          {links.map((link, i) => (
            <div key={i} className={styles.linkCard}>
              <div className={styles.linkTop}>
                <div className={`${styles.platform} ${styles[link.platform]}`}>
                  {link.platform === 'youtube' ? '▶' : link.platform === 'tiktok' ? '♪' : '🔗'}
                </div>
                <div className={styles.linkInfo}>
                  <p className={styles.linkTitle}>{link.title}</p>
                  <p className={styles.linkUrl}>{link.url.slice(0, 40)}...</p>
                </div>
                <button className={styles.removeBtn} onClick={() => removeLink(i)}>✕</button>
              </div>
              <div className={styles.weightRow}>
                <span className={styles.weightLabel}>Influence</span>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={link.weight}
                  onChange={e => updateWeight(i, Number(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.weightValue}>{link.weight}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GENERATE BUTTON */}
      {links.length > 0 && (
        <div className={styles.generateSection}>
          <button className={styles.generateBtn}>
            ✂️ Generate edit
          </button>
          <p className={styles.generateHint}>
            AI will blend {links.length} inspiration{links.length > 1 ? 's' : ''} with your footage
          </p>
        </div>
      )}

    </main>
  )
}