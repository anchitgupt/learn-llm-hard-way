import { TokenFlow } from "@/viz";
import type { TokenItem } from "@/viz/data/types";
import { TraceStep } from "./TraceStep";

interface TokenStepProps {
  tokens: string[];
  tokenIds: number[];
}

const MAX_TOKENS_RENDERED = 80;

export function TokenStep({ tokens, tokenIds }: TokenStepProps) {
  const items: TokenItem[] = tokens.slice(0, MAX_TOKENS_RENDERED).map((text, i) => ({
    id: tokenIds[i] ?? i,
    text
  }));
  return (
    <TraceStep
      number={3}
      total={8}
      name="Tokenization"
      hint="Text becomes tokens, then ids."
    >
      <TokenFlow tokens={items} stages={["text", "tokens", "ids"]} />
      {tokens.length > MAX_TOKENS_RENDERED ? (
        <p className="text-[12px] text-text-muted mt-2 font-mono">
          Showing first {MAX_TOKENS_RENDERED} of {tokens.length} tokens.
        </p>
      ) : null}
    </TraceStep>
  );
}
