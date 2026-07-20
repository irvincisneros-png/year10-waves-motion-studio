import { useState } from "react";
import { Page } from "../../components/Page";
import { useAnnouncer } from "../../accessibility/LiveRegion";
import { useProgressStore } from "../../store/progressStore";
import {
  nextLevelAfterAttempt,
  nextLevelAfterSuccess,
} from "../../store/evidenceHelpers";
import { checkAnswer } from "../../assessment/validate";
import {
  forceQuestions,
  motionQuestions,
} from "../../assessment/motionForcesQuestions";
import type { AttemptResult } from "../../assessment/types";

export function MotionForcesCheckPage({
  group,
}: {
  group: "motion" | "forces";
}) {
  const questions = group === "motion" ? motionQuestions : forceQuestions;
  const [index, setIndex] = useState(0);
  const [optionId, setOptionId] = useState<string | null>(null);
  const [raw, setRaw] = useState("");
  const [unit, setUnit] = useState("");
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [score, setScore] = useState({ correct: 0, answered: 0 });
  const { announce } = useAnnouncer();
  const addEvidence = useProgressStore((s) => s.addEvidence);
  const setOutcomeLevel = useProgressStore((s) => s.setOutcomeLevel);
  const outcomes = useProgressStore((s) => s.outcomes);
  const q = questions[index];
  const locked = result?.status === "correct" || result?.status === "incorrect";
  const prefix = group === "motion" ? "motion" : "forces";
  const clear = () => {
    setOptionId(null);
    setRaw("");
    setUnit("");
    setResult(null);
    setHintLevel(0);
  };

  const submit = () => {
    if (!q || locked) return;
    const nextResult = checkAnswer(q, { raw, optionId, unit: unit || null });
    setResult(nextResult);
    announce(nextResult.correct ? "Correct." : nextResult.feedback);
    if (nextResult.status !== "correct" && nextResult.status !== "incorrect")
      return;
    const current = outcomes[q.outcomeCode] ?? "not-attempted";
    setOutcomeLevel(
      q.outcomeCode,
      nextResult.correct
        ? nextLevelAfterSuccess(current)
        : nextLevelAfterAttempt(current),
    );
    addEvidence({
      outcomeCode: q.outcomeCode,
      kind: "check",
      summary: `${q.id}: ${nextResult.correct ? "correct" : "incorrect"}${q.misconception && !nextResult.correct ? ` — ${q.misconception}` : ""}`,
    });
    setScore((value) => ({
      correct: value.correct + Number(nextResult.correct),
      answered: value.answered + 1,
    }));
  };

  if (!q)
    return (
      <Page
        title={`${group === "motion" ? "Motion" : "Forces"} check complete`}
        lead="Your scored evidence has been added to local progress."
      >
        <div className="card stack">
          <p data-testid={`${prefix}-check-summary`}>
            You answered {score.correct} of {score.answered} questions
            correctly.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setIndex(0);
              clear();
              setScore({ correct: 0, answered: 0 });
            }}
            data-control-id={`${prefix}.check-restart-button`}
          >
            Start again
          </button>
        </div>
      </Page>
    );

  return (
    <Page
      title={`Check ${group === "motion" ? "motion" : "forces"}`}
      lead="Use three progressive hints when you need them. Empty, malformed and unit-wrong answers are never scored correct."
    >
      <div className="card stack" data-control-id={`${prefix}.check-question`}>
        <p className="seg-control__note">
          Question {index + 1} of {questions.length} · outcome {q.outcomeCode} ·{" "}
          {q.difficulty} · {q.representation}
        </p>
        <h2 data-testid={`${prefix}-check-prompt`}>{q.prompt}</h2>
        {q.kind === "mcq" ? (
          <div
            className="question-options"
            role="radiogroup"
            aria-label="Answer options"
          >
            {q.options.map((option) => (
              <label key={option.id} className="question-option">
                <input
                  type="radio"
                  name={`${prefix}-${q.id}`}
                  checked={optionId === option.id}
                  onChange={() => setOptionId(option.id)}
                  disabled={locked}
                />
                {option.text}
              </label>
            ))}
          </div>
        ) : (
          <div className="field">
            <label className="field__label" htmlFor={`${prefix}-check-answer`}>
              Your answer
            </label>
            <div className="field__row">
              <input
                id={`${prefix}-check-answer`}
                className="field__input"
                inputMode="decimal"
                value={raw}
                onChange={(event) => setRaw(event.target.value)}
                disabled={locked}
                data-testid={`${prefix}-check-answer`}
              />
              {q.kind === "numeric" ? (
                <span>{q.unit}</span>
              ) : (
                <select
                  aria-label="Answer unit"
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  disabled={locked}
                  data-testid={`${prefix}-check-unit`}
                >
                  <option value="">Select unit</option>
                  {q.unitOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}
        <div className="seg-control__options">
          {!locked ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={submit}
              data-testid={`${prefix}-check-submit`}
              data-control-id={`${prefix}.check-submit-button`}
            >
              Submit answer
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setIndex((value) => value + 1);
                clear();
              }}
              data-testid={`${prefix}-check-next`}
              data-control-id={`${prefix}.check-next-button`}
            >
              {index + 1 < questions.length ? "Next question" : "Finish"}
            </button>
          )}
          {!locked && hintLevel < 3 ? (
            <button
              type="button"
              className="btn"
              onClick={() => setHintLevel((value) => value + 1)}
              data-testid={`${prefix}-check-hint`}
              data-control-id={`${prefix}.check-hint-button`}
            >
              {hintLevel === 0
                ? "Show a hint"
                : hintLevel === 1
                  ? "Show a stronger hint"
                  : "Show worked reasoning"}
            </button>
          ) : null}
        </div>
        {hintLevel > 0 && !locked ? (
          <ol>
            {q.hints.slice(0, hintLevel).map((hint) => (
              <li key={hint.level}>
                <strong>Hint {hint.level}:</strong> {hint.text}
              </li>
            ))}
          </ol>
        ) : null}
        {result ? (
          <p
            className={`feedback ${result.status === "correct" ? "feedback--correct" : result.status === "incorrect" ? "feedback--incorrect" : "feedback--invalid"}`}
            role="status"
            data-testid={`${prefix}-check-feedback`}
          >
            <strong>
              {result.status === "correct"
                ? "Correct. "
                : result.status === "incorrect"
                  ? "Not correct. "
                  : ""}
            </strong>
            {result.feedback}
          </p>
        ) : null}
      </div>
    </Page>
  );
}
