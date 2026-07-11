'use client'
import { UserButton } from '@clerk/nextjs'
import { EditorProvider, useEditor } from '@/context/EditorContext'
import UploadPanel from '@/components/editor/UploadPanel'
import InspoPanel from '@/components/editor/InspoPanel'
import ChatPanel from '@/components/editor/ChatPanel'
import styles from './page.module.css'

function EditorContent() {
  const { state } = useEditor()

  async function handleExport() {
    if (state.timeline.length === 0 || state.clips.length === 0) return

    const formData = new FormData()
    formData.append('timeline', JSON.stringify(state.timeline))

    state.clips.forEach(clip => {
      formData.append(`file_${clip.filename}`, clip.file)
    })

    const res = await fetch('/api/execute', {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'cutlike_edit.mp4'
      a.click()
      URL.revokeObjectURL(url)

      const edlBase64 = res.headers.get('X-EDL')
      if (edlBase64) {
        const edl = atob(edlBase64)
        const edlBlob = new Blob([edl], { type: 'text/plain' })
        const edlUrl = URL.createObjectURL(edlBlob)
        const edlA = document.createElement('a')
        edlA.href = edlUrl
        edlA.download = 'cutlike_edit.edl'
        edlA.click()
        URL.revokeObjectURL(edlUrl)
      }
    }
  }

  return (
    <div className={styles.layout}>
      <header className={styles.topbar}>
        <span className={styles.logo}>
          <span className={styles.logoDot} />
          CutLike
        </span>
        <div className={styles.topbarRight}>
          <span className={styles.projectName}>{state.projectName}</span>
          {state.timeline.length > 0 && (
            <button className={styles.exportBtn} onClick={handleExport}>
              ⬇ Export
            </button>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <div className={styles.body}>
        <UploadPanel />
        <InspoPanel />
        <ChatPanel />
      </div>
    </div>
  )
}

export default function EditorPage() {
  return (
    <EditorProvider>
      <EditorContent />
    </EditorProvider>
  )
}