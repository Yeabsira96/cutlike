import styles from "./Features.module.css"

const features = [
  { icon: "🎯", title: "Multi-inspiration blending", desc: "Mix multiple reference videos with custom weights. Your unique style, not a copy.", color: "green" },
  { icon: "💬", title: "Chat-based refinement", desc: "Tell the AI what to change in plain language. Make the intro 30 seconds shorter actually works.", color: "blue" },
  { icon: "🗺️", title: "Auto scene detection", desc: "Clips are tagged by scene, location, and energy level. Jump to footage instantly.", color: "purple" },
  { icon: "🎵", title: "Music-aware cuts", desc: "Edits sync to the beat automatically. Upload your track or let AI suggest one.", color: "orange" },
  { icon: "⬇️", title: "Pro export formats", desc: "Export as EDL, XML, or FCPXML for Premiere, Final Cut, or DaVinci.", color: "red" },
  { icon: "⚡", title: "Handles any volume", desc: "Terabytes of footage, chunked uploads, cloud processing. Size is never a limit.", color: "green" },
]

export default function Features() {
  return (
    <section className={styles.section} id="features">
      <div className={styles.header}>
        <p className={styles.eyebrow}>Features</p>
        <h2 className={styles.title}>Everything you need.<br />Nothing you don t.</h2>
      </div>
      <div className={styles.grid}>
        {features.map((f) => (
          <div key={f.title} className={styles.card}>
            <div className={styles.icon + " " + (styles[f.color] || "")}>
              {f.icon}
            </div>
            <h3 className={styles.cardTitle}>{f.title}</h3>
            <p className={styles.cardDesc}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
