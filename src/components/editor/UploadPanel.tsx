'use client'
import { useEditor } from '@/context/EditorContext'
import styles from './UploadPanel.module.css'

export default function UploadPanel() {
  const { state, addClips, removeClip, updateClip } = useEditor()

  async function analyzeClip(id: string, file: File) {
    updateClip(id, { status: 'analyzing' })

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/analyze-footage', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        updateClip(id, {
          status: 'ready',
          metadata: data.metadata,
          fingerprint: data.fingerprint,
        })
      } else {
        updateClip(id, { status: 'error' })
      }
    } catch {
      updateClip(id, { status: 'error' })
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files).filter(
      f => f.type.startsWith('video/')
    )
    if (dropped.length === 0) return

    addClips(dropped)

    // analyze each clip after adding
    dropped.forEach((file, i) => {
      const id = state.clips.length > 0
        ? state.clips[state.clips.length - dropped.length + i]?.id
        : null
      setTimeout(() => {
        const newClip = document.querySelector(`[data-analyzing="true"]`)
        if (newClip) return
      }, 100)
    })
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    addClips(files)
  }

  function formatSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function formatDuration(secs: number) {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function getStatusColor(status: string) {
    if (status === 'ready') return styles.statusReady
    if (status === 'analyzing') return styles.statusAnalyzing
    if (status === 'error') return styles.statusError
    return styles.statusPending
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <p className={styles.label}>Your footage</p>
        <span className={styles.count}>{state.clips.length} clips</span>
      </div>

      <div
        className={styles.dropzone}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <div className={styles.dropIcon}>🎬</div>
        <p className={styles.dropTitle}>Drop footage here</p>
        <p className={styles.dropSub}>or click to browse</p>
        <p className={styles.dropHint}>MP4, MOV, AVI supported</p>
        <input
          id="fileInput"
          type="file"
          accept="video/*"
          multiple
          className={styles.hiddenInput}
          onChange={handleFileInput}
        />
      </div>

      {state.clips.length > 0 && (
        <div className={styles.fileList}>
          {state.clips.map((clip) => (
            <div key={clip.id} className={styles.fileItem}>
              <div className={styles.fileThumb}>▶</div>
              <div className={styles.fileInfo}>
                <p className={styles.fileName}>{clip.filename}</p>
                <div className={styles.fileMeta}>
                  <span>{formatSize(clip.sizeBytes)}</span>
                  {clip.metadata && (
                    <>
                      <span>·</span>
                      <span>{formatDuration(clip.metadata.duration)}</span>
                      <span>·</span>
                      <span>{clip.metadata.width}x{clip.metadata.height}</span>
                    </>
                  )}
                  {clip.fingerprint && (
                    <>
                      <span>·</span>
                      <span>{clip.fingerprint.editingStyle}</span>
                    </>
                  )}
                </div>
                <div className={styles.statusRow}>
                  <span className={`${styles.status} ${getStatusColor(clip.status)}`}>
                    {clip.status === 'analyzing' ? '⟳ analyzing...' :
                     clip.status === 'ready' ? '✓ ready' :
                     clip.status === 'error' ? '✕ error' : '○ pending'}
                  </span>
                  {clip.status === 'pending' && (
                    <button
                      className={styles.analyzeBtn}
                      onClick={() => analyzeClip(clip.id, clip.file)}
                    >
                      Analyze
                    </button>
                  )}
                </div>
              </div>
              <button
                className={styles.fileRemove}
                onClick={() => removeClip(clip.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}