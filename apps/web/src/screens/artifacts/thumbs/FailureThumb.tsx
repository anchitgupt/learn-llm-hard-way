interface FailureThumbProps {
  expectedFact?: string;
  explanation?: string;
}

export function FailureThumb({ expectedFact, explanation }: FailureThumbProps) {
  return (
    <div className="space-y-1 text-[12px]" data-testid="thumb-failure">
      {expectedFact ? <p><span className="text-text-muted">expected:</span> {expectedFact}</p> : null}
      {explanation ? <p className="text-text-muted">{explanation}</p> : null}
    </div>
  );
}
