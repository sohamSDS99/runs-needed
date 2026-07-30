// Five FAQ entries rendered as h2 + p (PRD §6.1 item 9). The same source array
// feeds the FAQPage JSON-LD (PRD §11.3), so the structured data can never
// disagree with the visible page.
const FAQ: { q: string; a: string }[] = [
  {
    q: "How many prompt runs do you need to measure AI visibility?",
    a: "For ±5 points at 95% confidence around a mid-range rate you need about 381 runs of a single prompt; ±10 points needs about 93. Fewer runs leave an interval too wide to act on.",
  },
  {
    q: "Why is the Wilson interval better than the standard formula?",
    a: "The textbook Wald formula can have true coverage as low as 9.6% at n = 10 and returns impossible negative bounds. The Wilson score interval stays within 0–100% and holds its coverage at small samples.",
  },
  {
    q: "What is the margin of error on a 42% visibility score?",
    a: "From 21 mentions in 50 runs the 95% Wilson interval is 29.4% to 55.8% — roughly ±13 points, not the single figure a dashboard reports.",
  },
  {
    q: "Does a higher score always mean better visibility?",
    a: "Not when the intervals overlap: 45% and 40% from 20 runs each are statistically indistinguishable, because each carries a range wider than the 5-point gap between them.",
  },
  {
    q: "Do repeated runs of one prompt count as independent samples?",
    a: "No. Runs of the same prompt are correlated, so 50 runs can carry the information of far fewer independent ones. This tool lets you inflate the interval to reflect that.",
  },
];

export function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section aria-label="Frequently asked questions" className="flex flex-col gap-4">
      {FAQ.map((item) => (
        <div key={item.q}>
          <h2 className="text-base font-semibold">{item.q}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.a}</p>
        </div>
      ))}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
