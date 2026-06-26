import styles from './HowItWorks.module.css'

const steps = [
  {
    number: '01',
    icon: '📁',
    title: 'Upload your footage',
    desc: 'Drag in everything — even 200GB from a 3-week trip. We organize clips automatically by date, location, and scene.',
  },
  {
    number: '02',
    icon: '🔗',
    title: 'Drop inspiration links',
    desc: 'Paste any YouTube or TikTok URL. Add multiple and blend them. We extract pacing, cut rhythm, and energy level.',
  },
  {
    number: '03',
    icon: '✂️',
    title: 'Get your first cut',
    desc: 'AI assembles a full edit in your chosen style. Then refine anything through natural conversation.',
  },
  {
    number: '04',
    icon: '⬆️',
    title: 'Export anywhere',
    desc: 'Export to Premiere Pro, Final Cut, or DaVinci Resolve. Or render and download straight from CutLike.',
  },
]

export default function HowItWorks() {
  return (
    <section className={styles.section} id="how">
      <div className={styles.header}>
        <p className={styles.eyebrow}>How it works</p>
        <h2 className={styles.title}>From raw footage<br />to final cut — fast.</h2>
        <p className={styles.sub}>Three steps is all it takes. No timelines to scrub, no keyframes to set.</p>
      </div>
      <div className={styles.grid}>
        {steps.map((step) => (
          <div key={step.number} className={styles.step}>
            <span className={styles.number}>{step.number}</span>
            <div className={styles.icon}>{step.icon}</div>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepDesc}>{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}