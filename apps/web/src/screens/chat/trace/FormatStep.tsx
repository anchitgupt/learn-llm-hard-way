import { CodeBlock } from "@/components/ui/code-block";
import { TraceStep } from "./TraceStep";

interface FormatStepProps {
  formattedPrompt: string;
}

export function FormatStep({ formattedPrompt }: FormatStepProps) {
  return (
    <TraceStep
      number={2}
      total={8}
      name="Prompt formatting"
      hint="Roles wrapped in tags before tokenization."
    >
      <CodeBlock copyable rawContent={formattedPrompt}>{formattedPrompt}</CodeBlock>
    </TraceStep>
  );
}
