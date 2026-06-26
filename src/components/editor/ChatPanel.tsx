'use client'
import { useState } from 'react'
import styles from './ChatPanel.module.css'

interface Message {
  role: 'user' | 'ai'
  text: string
}

const initialMessages: Message[] = [
  {
    role: 'ai',
    text: 'Upload your footage and add inspiration links to get started. I\'ll generate a first cut and you can refine it here.',
  },
]

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')

  function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed) return

    setMessages(prev => [
      ...prev,
      { role: 'user', text: trimmed },
      { role: 'ai', text: 'Got it — working on that edit now...' },
    ])
    setInput('')
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
        <span className={styles.statusDot} />
      </div>

      <div className={styles.messages}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={msg.role === 'ai' ? styles.msgAi : styles.msgUser}
          >
            {msg.role === 'ai' && (
              <div className={styles.avatar}>AI</div>
            )}
            <div className={msg.role === 'ai' ? styles.bubble : styles.bubbleUser}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.inputArea}>
        <textarea
          className={styles.textarea}
          placeholder='Try: "make the intro faster" or "add more b-roll"'
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
        />
        <button className={styles.sendBtn} onClick={sendMessage}>
          ↑
        </button>
      </div>
    </aside>
  )
}