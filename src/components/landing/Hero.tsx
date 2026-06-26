import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.glow} />
      <div className={styles.badge}>
        <span className={styles.badgeDot} />
        Now in beta
      </div>
      <h1 className={styles.heading}>
        Edit like your<br />
        <em className={styles.accent}>inspiration.</em>
      </h1>
      <p className={styles.sub}>
        Upload your raw footage, drop a YouTube or TikTok link,
        and watch your video get cut in the style you love.
        Then refine it through chat.
      </p>
      <div className={styles.actions}>
        <button className={styles.btnPrimary}>Try it free →</button>
        <button className={styles.btnGhost}>See how it works</button>
      </div>
    </section>
  )
}