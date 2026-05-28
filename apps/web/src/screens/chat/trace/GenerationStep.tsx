import { TraceStep } from "./TraceStep";

export function GenerationStep() {
  return (
    <TraceStep
      number={5}
      total={8}
      name="Generation"
      hint="The model produces logits for the next token."
    >
      <p className="text-[14px] leading-[22px] text-text-primary">
        <span className="font-mono">model.generate(context)</span> — the model produces
        next-token logits over the vocabulary. These become probabilities in the next step.
      </p>
    </TraceStep>
  );
}
