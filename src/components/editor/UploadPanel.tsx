'use client'
import { useState } from 'react'
import styles from './UploadPanel.module.css'

export default function UploadPanel() {
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(
      f => f.type.startsWith('video/')
    )
    setFiles(prev => [...prev, ...dropped])
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const selected = Array.from(e.target.files)
    setFiles(prev => [...prev, ...selected])
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  function formatSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <p className={styles.label}>Your footage</p>
        <span className={styles.count}>{files.length} clips</span>
      </div>

      {/* DROP ZONE */}
      <div
        className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
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

      {/* FILE LIST */}
      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((file, i) => (
            <div key={i} className={styles.fileItem}>
              <div className={styles.fileThumb}>▶</div>
              <div className={styles.fileInfo}>
                <p className={styles.fileName}>{file.name}</p>
                <p className={styles.fileSize}>{formatSize(file.size)}</p>
              </div>
              <button
                className={styles.fileRemove}
                onClick={() => removeFile(i)}
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