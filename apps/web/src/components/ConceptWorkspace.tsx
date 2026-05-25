import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { CheckpointAttempt, CheckpointAttemptInput, Concept, GlossaryEntry, LabRunArtifact } from "../types";
import { CheckpointPanel } from "./CheckpointPanel";
import { GlossaryPanel } from "./GlossaryPanel";
import { LabPanel } from "./LabPanel";
import { ProgressPanel } from "./ProgressPanel";
import { VisualExperiment } from "./VisualExperiment";

interface ConceptWorkspaceProps {
  concept: Concept;
  glossaryEntries?: GlossaryEntry[];
  onSubmitCheckpoint?: (conceptId: string, input: CheckpointAttemptInput) => Promise<CheckpointAttempt>;
  onRunLab?: (labId: string) => Promise<LabRunArtifact>;
}

const tabs = ["Lesson", "Visual", "Lab", "Checkpoint", "Notes"] as const;

export function ConceptWorkspace({
  concept,
  glossaryEntries = [],
  onSubmitCheckpoint = async (_conceptId, input) => ({
    conceptId: concept.id,
    submittedAnswer: input.submittedAnswer,
    correct: false,
    feedback: "Checkpoint submission is not connected yet.",
    confidence: input.confidence
  }),
  onRunLab = async (labId) => ({
    labId,
    conceptId: concept.id,
    artifactPath: "",
    status: "not-connected",
    error: "Lab execution is not connected yet."
  })
}: ConceptWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Lesson");

  return (
    <main className="workspace">
      <p className="eyebrow">Concept Workspace</p>
      <h2>{concept.title}</h2>
      <div className="workspace-tabs" role="tablist" aria-label="Concept workspace tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      {activeTab === "Lesson" ? (
        <section className="lesson">
          <article className="lesson-content">
            <ReactMarkdown
              components={{
                h1: () => null,
                h2: ({ children }) => <h3>{children}</h3>
              }}
            >
              {concept.lessonMarkdown}
            </ReactMarkdown>
          </article>
          <GlossaryPanel conceptGlossaryIds={concept.glossary} entries={glossaryEntries} />
        </section>
      ) : null}
      {activeTab === "Visual" ? (
        <section className="visual-panel">
          <VisualExperiment visualId={concept.visual} />
        </section>
      ) : null}
      {activeTab === "Lab" ? <LabPanel labId={concept.lab} onRun={onRunLab} /> : null}
      {activeTab === "Checkpoint" ? (
        <CheckpointPanel
          question={concept.checkpoint.question}
          onSubmit={(input) => onSubmitCheckpoint(concept.id, input)}
        />
      ) : null}
      {activeTab === "Notes" ? <ProgressPanel conceptId={concept.id} /> : null}
    </main>
  );
}
