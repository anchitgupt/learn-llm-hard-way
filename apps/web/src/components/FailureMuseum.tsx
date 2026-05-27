import type { FailureCase } from "../types";

interface FailureMuseumProps {
  cases: FailureCase[];
}

export function FailureMuseum({ cases }: FailureMuseumProps) {
  return (
    <section className="failure-museum">
      <h3>Failure Museum</h3>
      <div className="failure-grid">
        {cases.map((failure) => (
          <article key={failure.id} className="failure-card">
            <p className="eyebrow">{failure.category}</p>
            <h4>{failure.prompt}</h4>
            <p>{failure.modelOnlyOutput}</p>
            <p>{failure.explanation}</p>
            <p>{failure.betterStrategy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
