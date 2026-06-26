import styles from './Pricing.module.css'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    desc: 'Forever — no credit card needed',
    featured: false,
    features: [
      { text: '3 projects per month', included: true },
      { text: 'Up to 10GB per upload', included: true },
      { text: '1 inspiration link per edit', included: true },
      { text: 'Chat refinement (10 msgs)', included: true },
      { text: 'Multi-inspo blending', included: false },
      { text: 'Pro export formats', included: false },
    ],
    cta: 'Get started free',
  },
  {
    name: 'Creator',
    price: '$18',
    period: '/mo',
    desc: 'For serious creators and editors',
    featured: true,
    features: [
      { text: 'Unlimited projects', included: true },
      { text: 'Up to 200GB per upload', included: true },
      { text: 'Multi-inspo blending', included: true },
      { text: 'Unlimited chat refinement', included: true },
      { text: 'All export formats', included: true },
      { text: 'Priority processing', included: true },
    ],
    cta: 'Start free trial',
  },
  {
    name: 'Studio',
    price: '$79',
    period: '/mo',
    desc: 'For teams and agencies',
    featured: false,
    features: [
      { text: 'Everything in Creator', included: true },
      { text: 'Unlimited storage', included: true },
      { text: 'Team collaboration', included: true },
      { text: 'Style library sharing', included: true },
      { text: 'API access', included: true },
      { text: 'Dedicated support', included: true },
    ],
    cta: 'Contact us',
  },
]

export default function Pricing() {
  return (
    <section className={styles.section} id="pricing">
      <div className={styles.header}>
        <p className={styles.eyebrow}>Pricing</p>
        <h2 className={styles.title}>Simple, honest pricing.</h2>
        <p className={styles.sub}>Start free. Scale when you're ready.</p>
      </div>

      <div className={styles.grid}>
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`${styles.card} ${plan.featured ? styles.featured : ''}`}
          >
            {plan.featured && (
              <span className={styles.badge}>Most popular</span>
            )}
            <p className={styles.planName}>{plan.name}</p>
            <div className={styles.priceRow}>
              <span className={styles.price}>{plan.price}</span>
              {plan.period && (
                <span className={styles.period}>{plan.period}</span>
              )}
            </div>
            <p className={styles.planDesc}>{plan.desc}</p>

            <ul className={styles.features}>
              {plan.features.map((f) => (
                <li key={f.text} className={styles.featureItem}>
                  <span className={f.included ? styles.check : styles.cross}>
                    {f.included ? '✓' : '–'}
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>

            <button
              className={`${styles.btn} ${plan.featured ? styles.btnFeatured : ''}`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}