import Link from 'next/link'
import styles from './Navbar.module.css'

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <a href="/" className={styles.logo}>
        <span className={styles.logoDot} />
        CutLike
      </a>
      <ul className={styles.links}>
        <li><a href="#how">How it works</a></li>
        <li><a href="#features">Features</a></li>
        <li><a href="#pricing">Pricing</a></li>
      </ul>
      <Link href="/sign-up" className={styles.cta}>
        Start editing free
      </Link>
    </nav>
  )
}