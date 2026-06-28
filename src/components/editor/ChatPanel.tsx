'use client'
import { useState } from 'react'
import { useEditor } from '@/context/EditorContext'
import styles from './ChatPanel.module.css'

export default function ChatPanel() {
  const { state, addMessage, setIsGenerating, setTimeline } = useEditor()
  const [input, setInput] = useState('')

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed) return

    addMessage({ role: 'user', text: trimmed, timestamp: new Date() })
    setInput('')
    setIsGenerating(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
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

      if (data.timeline?.length > 0) {
        setTimeline(data.timeline)
      }

      addMessage({
        role: 'ai',
        text: data.message || 'Done!',
        timestamp: new Date(),
      })
    } catch {
      addMessage({
        role: 'ai',
        text: 'Something went wrong. Try again.',
        timestamp: new Date(),
      })
    } finally {
      setIsGenerating(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <p className={styles.label}>Refine with chat</p>
        <span className={`${styles.statusDot} ${state.isGenerating ? styles.generating : ''}`} />
      </div>

      <div className={styles.messages}>
        {state.messages.map((msg, i) => (
          <div key={i} className={msg.role === 'ai' ? styles.msgAi : styles.msgUser}>
            {msg.role === 'ai' && <div className={styles.avatar}>AI</div>}
            <div className={msg.role === 'ai' ? styles.bubble : styles.bubbleUser}>
              {msg.text}
            </div>
          </div>
        ))}
        {state.isGenerating && (
          <div className={styles.msgAi}>
            <div className={styles.avatar}>AI</div>
            <div className={styles.bubble}>
              <span className={styles.typing}>●●●</span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.inputArea}>
        <textarea
          className={styles.textarea}
          placeholder='Try: "make the intro faster" or "add more b-roll"'
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={state.isGenerating}
        />
        <button
          className={styles.sendBtn}
          onClick={sendMessage}
          disabled={state.isGenerating}
        >
          ↑
        </button>
      </div>
    </aside>
  )
}