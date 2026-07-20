import { useState } from "react";
import { Page } from "../../components/Page";
import { useAnnouncer } from "../../accessibility/LiveRegion";
import { useProgressStore } from "../../store/progressStore";
import {
  nextLevelAfterAttempt,
  nextLevelAfterSuccess,
} from "../../store/evidenceHelpers";

const CASES = [
  {
    id: "seatbelt",
    label: "Seatbelt",
    action: "Brake the car",
    law: "First and second laws",
    outcome:
      "The passenger tends to continue forward; the belt supplies the net backward force that changes velocity.",
    pair: "Interaction pair: belt pushes passenger backward; passenger pushes belt forward. These forces act on different objects.",
  },
  {
    id: "carts",
    label: "Pushing carts",
    action: "Push both carts",
    law: "Second law",
    outcome:
      "With the same modelled push, the lower-mass cart has the greater acceleration.",
    pair: "Interaction pair: hand pushes cart; cart pushes hand oppositely. The model is qualitative.",
  },
  {
    id: "walking",
    label: "Walking",
    action: "Push against the ground",
    law: "Third law",
    outcome:
      "The foot pushes Earth backward with 400 N; Earth pushes the foot forward with 400 N.",
    pair: "Earth-on-foot: +400 N. Foot-on-Earth: −400 N. Equal magnitude, opposite direction, different objects.",
  },
  {
    id: "balloon",
    label: "Balloon rocket",
    action: "Release the balloon",
    law: "Third and second laws",
    outcome:
      "The balloon pushes gas backward; gas pushes the balloon forward, producing acceleration.",
    pair: "The gas and balloon forces are equal/opposite and act on different objects. The model is qualitative.",
  },
  {
    id: "collision",
    label: "Collision",
    action: "Let the carts collide",
    law: "Third law",
    outcome:
      "During contact, each cart exerts an equal-magnitude opposite force on the other, even when their masses differ.",
    pair: "Cart A-on-B and Cart B-on-A are an interaction pair on different objects. The model does not simulate deformation or collision duration.",
  },
  {
    id: "spacecraft",
    label: "Spacecraft",
    action: "Fire the thruster",
    law: "Third and second laws",
    outcome:
      "The spacecraft pushes exhaust gas backward; the gas pushes the spacecraft forward. Air is not required.",
    pair: "Exhaust-on-spacecraft and spacecraft-on-exhaust act on different objects. The model is qualitative.",
  },
] as const;

export default function NewtonApplicationsPage() {
  const [caseId, setCaseId] =
    useState<(typeof CASES)[number]["id"]>("seatbelt");
  const [acted, setActed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "saved">("idle");
  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);
  const selected = CASES.find((item) => item.id === caseId)!;
  const changeCase = (id: typeof caseId) => {
    setCaseId(id);
    setActed(false);
    setRevealed(false);
    setExplanation("");
    setStatus("idle");
  };
  const save = () => {
    if (!acted || explanation.trim() === "") {
      setStatus("error");
      setOutcomeLevel(
        "7.4.5",
        nextLevelAfterAttempt(outcomes["7.4.5"] ?? "not-attempted"),
      );
      announce("Run the case and explain the relevant law first.");
      return;
    }
    addEvidence({
      outcomeCode: "7.4.5",
      kind: "explanation",
      summary: `${selected.label} — ${selected.law}: ${explanation.trim()} | Model outcome: ${selected.outcome}`,
    });
    setOutcomeLevel(
      "7.4.5",
      nextLevelAfterSuccess(outcomes["7.4.5"] ?? "not-attempted"),
    );
    setStatus("saved");
    announce("Newton case explanation saved.");
  };
  return (
    <Page
      title="Apply Newton’s laws"
      lead="Choose one of six fixed cases, identify the selected object and keep third-law pairs attached to different objects."
    >
      <section className="card stack">
        <h2>Case selector</h2>
        <label className="field">
          <span className="field__label">Newton case</span>
          <select
            value={caseId}
            onChange={(event) =>
              changeCase(event.target.value as typeof caseId)
            }
            data-testid="forces-newton-case"
            data-control-id="forces.newton-case-select"
          >
            {CASES.map((item) => (
              <option value={item.id} key={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <p>
          <strong>Law focus:</strong> {selected.law}
        </p>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            setActed(true);
            setRevealed(false);
            announce(`${selected.action}: model outcome shown.`);
          }}
          data-testid="forces-newton-action"
          data-control-id={`forces.newton-${selected.id}-action-button`}
        >
          {selected.action}
        </button>
        {acted ? (
          <div
            className="notice notice--info stack"
            role="status"
            data-testid="forces-newton-outcome"
          >
            <h3>Observed model outcome</h3>
            <p>{selected.outcome}</p>
          </div>
        ) : (
          <p className="seg-control__note">
            Run the named action to reveal the text-equivalent outcome.
          </p>
        )}
      </section>
      <section className="card stack">
        <h2>Interaction-pair check</h2>
        <button
          type="button"
          className="btn"
          disabled={!acted}
          aria-expanded={revealed}
          onClick={() => setRevealed((value) => !value)}
          data-testid="forces-third-law-reveal"
          data-control-id="forces.newton-case-feedback-reveal-button"
        >
          {revealed ? "Hide" : "Reveal"} force-pair analysis
        </button>
        {revealed ? (
          <p
            data-testid="forces-third-law-pair"
            data-control-id="forces.newton-third-law-pair-display"
          >
            {selected.pair}
          </p>
        ) : null}
        <p className="notice notice--warning">
          <strong>Guardrail:</strong> equal and opposite interaction forces do
          not cancel on one free-body diagram because they act on different
          objects. Only the walking case uses the authorised 400 N numerical
          fixture; all other cases are qualitative teaching models.
        </p>
      </section>
      <section className="card stack">
        <h2>Save an application explanation</h2>
        <label className="notice-capture__label">
          Name the law, selected object, force(s) and resulting motion
          <textarea
            rows={4}
            className="notice-capture__input"
            value={explanation}
            onChange={(event) => {
              setExplanation(event.target.value);
              setStatus("idle");
            }}
            data-testid="forces-application-explanation"
            data-control-id="forces.application-explanation-input"
          />
        </label>
        <button
          type="button"
          className="btn btn--primary"
          onClick={save}
          data-testid="forces-application-save"
          data-control-id="forces.save-application-evidence-button"
        >
          Save case explanation
        </button>
        {status === "error" ? (
          <p className="field__error" role="status">
            Run the selected case and complete the explanation.
          </p>
        ) : null}
        {status === "saved" ? (
          <p className="notice-capture__status" role="status">
            ✓ Saved for 7.4.5.
          </p>
        ) : null}
      </section>
    </Page>
  );
}
