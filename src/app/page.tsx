import { UserButton } from '@clerk/nextjs'
import { EditorProvider } from '@/context/EditorContext'
import UploadPanel from '@/components/editor/UploadPanel'
import InspoPanel from '@/components/editor/InspoPanel'
import ChatPanel from '@/components/editor/ChatPanel'
import styles from './page.module.css'

export default function EditorPage() {
  return (
    <EditorProvider>
      <div className={styles.layout}>
        <header className={styles.topbar}>
          <span className={styles.logo}>
            <span className={styles.logoDot} />
            CutLike
          </span>
          <div className={styles.topbarRight}>
            <span className={styles.projectName}>Untitled project</span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        <div className={styles.body}>
          <UploadPanel />
          <InspoPanel />
          <ChatPanel />
        </div>
      </div>
    </EditorProvider>
  )
}