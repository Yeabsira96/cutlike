import styles from './Footer.module.css'

export default function Footer() {
  return (
    <>
      <div className={styles.cta}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaGlow} />
          <h2 className={styles.ctaTitle}>
            Stop drowning<br />in raw footage.
          </h2>
          <p className={styles.ctaSub}>
            Upload your clips, drop your inspiration, and get a cut
            worth sharing — in minutes, not weeks.
          </p>
          <button className={styles.ctaBtn}>Start editing free →</button>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.footerLogo}>
            <span className={styles.footerDot} />
            CutLike
          </span>
          <p className={styles.footerTagline}>
            Built for creators who have more footage than time.
          </p>
        </div>
        <ul className={styles.footerLinks}>
          <li><a href="#">Privacy</a></li>
          <li><a href="#">Terms</a></li>
          <li><a href="#">Twitter</a></li>
          <li><a href="#">GitHub</a></li>
        </ul>
      </footer>
    </>
  )
}