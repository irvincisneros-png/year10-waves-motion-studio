import { useState } from "react";
import { Page } from "../../components/Page";
import { useAnnouncer } from "../../accessibility/LiveRegion";
import { useProgressStore } from "../../store/progressStore";
import {
  nextLevelAfterAttempt,
  nextLevelAfterSuccess,
} from "../../store/evidenceHelpers";
import {
  diagramVectors,
  evaluateMotionDiagram,
  motionDiagram,
  type MotionPattern,
} from "../../science/motion";
import { formatSigFigs } from "../../science/units";

export default function MotionDiagramsPage() {
  const [pattern, setPattern] = useState<MotionPattern>("constant");
  const [interval, setInterval] = useState(0.2);
  const [positions, setPositions] = useState(() => motionDiagram("constant"));
  const [velocityOverlay, setVelocityOverlay] = useState(false);
  const [accelerationOverlay, setAccelerationOverlay] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    feedback: string;
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);
  const vectors = diagramVectors(positions, interval);
  const loadPattern = (next: MotionPattern) => {
    setPattern(next);
    setPositions(motionDiagram(next, interval, positions.length));
    setFeedback(null);
    setSaved(false);
  };
  const check = () => {
    const result = evaluateMotionDiagram(pattern, positions);
    setFeedback(result);
    setOutcomeLevel(
      "7.4.2",
      result.correct
        ? nextLevelAfterSuccess(outcomes["7.4.2"] ?? "not-attempted")
        : nextLevelAfterAttempt(outcomes["7.4.2"] ?? "not-attempted"),
    );
    announce(result.feedback);
  };
  const save = () => {
    const result = evaluateMotionDiagram(pattern, positions);
    if (!result.correct || explanation.trim() === "") {
      setFeedback({
        correct: false,
        feedback:
          explanation.trim() === ""
            ? "Explain how the equal-time gaps support your pattern before saving."
            : result.feedback,
      });
      announce("A correct checked pattern and explanation are required.");
      return;
    }
    addEvidence({
      outcomeCode: "7.4.2",
      kind: "diagram",
      summary: `${pattern} motion diagram at Δt=${interval}s; positions ${positions.map((value) => formatSigFigs(value)).join(", ")} m. ${explanation.trim()}`,
    });
    setOutcomeLevel(
      "7.4.2",
      nextLevelAfterSuccess(outcomes["7.4.2"] ?? "not-attempted"),
    );
    setSaved(true);
    announce("Motion diagram saved as evidence.");
  };
  const min = Math.min(...positions, -1);
  const max = Math.max(...positions, 1);
  const span = Math.max(1, max - min);
  return (
    <Page
      title="Construct equal-time motion diagrams"
      lead="Each dot is a position sample. The time interval labels the gaps; changing it never moves dots you already placed."
    >
      <section className="card stack">
        <h2>Pattern and sampling controls</h2>
        <div className="mf-controls">
          <label className="field">
            <span className="field__label">Target pattern</span>
            <select
              value={pattern}
              onChange={(event) =>
                loadPattern(event.target.value as MotionPattern)
              }
              data-testid="motion-pattern"
              data-control-id="motion.diagram-pattern-select"
            >
              <option value="constant">Constant velocity</option>
              <option value="acceleration">Speeding up</option>
              <option value="deceleration">Slowing without reversal</option>
              <option value="reversal">Reversal</option>
              <option value="rest">Rest</option>
            </select>
          </label>
          <label className="field">
            <span className="field__label">Equal time interval</span>
            <select
              value={interval}
              onChange={(event) => setInterval(Number(event.target.value))}
              data-testid="motion-interval"
              data-control-id="motion.time-interval-select"
            >
              <option value={0.1}>0.1 s</option>
              <option value={0.2}>0.2 s</option>
              <option value={0.5}>0.5 s</option>
              <option value={1}>1.0 s</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={velocityOverlay}
              onChange={(event) => setVelocityOverlay(event.target.checked)}
              data-control-id="motion.velocity-arrow-overlay-toggle"
            />{" "}
            Velocity values
          </label>
          <label>
            <input
              type="checkbox"
              checked={accelerationOverlay}
              onChange={(event) => setAccelerationOverlay(event.target.checked)}
              data-control-id="motion.acceleration-arrow-overlay-toggle"
            />{" "}
            Acceleration values
          </label>
        </div>
        <div
          className="mf-diagram"
          role="img"
          aria-label={`${pattern} diagram with positions ${positions.map((value) => `${formatSigFigs(value)} metres`).join(", ")}`}
        >
          <div className="mf-diagram__line" />
          {positions.map((position, index) => (
            <span
              key={index}
              className="mf-diagram__dot"
              style={{ left: `${10 + ((position - min) / span) * 80}%` }}
            >
              <span>{index}</span>
            </span>
          ))}
        </div>
        <div
          className="mf-table-wrap"
          tabIndex={0}
          role="region"
          aria-label="Scrollable motion-diagram table"
        >
          <table data-testid="motion-diagram-table">
            <caption>Numeric equivalent of the motion diagram</caption>
            <thead>
              <tr>
                <th scope="col">Dot</th>
                <th scope="col">Time (s)</th>
                <th scope="col">Position (m)</th>
                <th scope="col">Following velocity (m/s)</th>
                <th scope="col">Following acceleration (m/s²)</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{formatSigFigs(index * interval)}</td>
                  <td>
                    <input
                      aria-label={`Dot ${index + 1} position in metres`}
                      type="number"
                      step="0.1"
                      value={position}
                      onChange={(event) =>
                        setPositions((current) =>
                          current.map((value, item) =>
                            item === index ? Number(event.target.value) : value,
                          ),
                        )
                      }
                      data-control-id="motion.strobe-dot-editor"
                    />
                  </td>
                  <td>
                    {velocityOverlay &&
                    vectors.velocitiesMps[index] !== undefined
                      ? formatSigFigs(vectors.velocitiesMps[index])
                      : "hidden"}
                  </td>
                  <td>
                    {accelerationOverlay &&
                    vectors.accelerationsMps2[index] !== undefined
                      ? formatSigFigs(vectors.accelerationsMps2[index])
                      : "hidden"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="seg-control__options">
          <button
            type="button"
            className="btn"
            disabled={positions.length >= 8}
            onClick={() =>
              setPositions((current) => [...current, current.at(-1) ?? 0])
            }
            data-control-id="motion.strobe-add-dot-button"
          >
            Add dot
          </button>
          <button
            type="button"
            className="btn"
            disabled={positions.length <= 2}
            onClick={() => setPositions((current) => current.slice(0, -1))}
            data-control-id="motion.strobe-remove-dot-button"
          >
            Remove last dot
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={check}
            data-testid="motion-diagram-check"
            data-control-id="motion.diagram-check-button"
          >
            Check pattern
          </button>
        </div>
        {positions.length >= 8 ? (
          <p role="status">Eight-dot maximum reached.</p>
        ) : null}
        {feedback ? (
          <p
            className={`feedback ${feedback.correct ? "feedback--correct" : "feedback--invalid"}`}
            role="status"
            data-testid="motion-diagram-feedback"
          >
            {feedback.feedback}
          </p>
        ) : null}
        <label className="notice-capture__label">
          Explain what the equal-time gaps and directions show
          <textarea
            rows={3}
            value={explanation}
            className="notice-capture__input"
            onChange={(event) => {
              setExplanation(event.target.value);
              setSaved(false);
            }}
            data-testid="motion-diagram-explanation"
            data-control-id="motion.diagram-explanation-input"
          />
        </label>
        <button
          type="button"
          className="btn btn--primary"
          onClick={save}
          data-testid="motion-diagram-save"
          data-control-id="motion.save-diagram-evidence-button"
        >
          Save diagram as evidence
        </button>
        {saved ? (
          <p className="notice-capture__status" role="status">
            ✓ Saved for 7.4.2.
          </p>
        ) : null}
      </section>
    </Page>
  );
}
