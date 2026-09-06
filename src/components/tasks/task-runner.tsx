"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  revealTextExplanation,
  submitChoice,
  submitTextSelfMark,
} from "@/features/tasks/actions";
import type { SubmitResult } from "@/features/tasks/actions";
import type { TaskData } from "@/features/tasks/queries";
import type { Difficulty } from "@/generated/prisma/enums";
import { AI_ASSIST_LABELS, AI_ASSIST_LEVELS } from "@/features/learning-engine";
import type { AiAssistLevel } from "@/features/learning-engine";

const CONFIDENCE_OPTIONS = [1, 2, 3, 4, 5] as const;
const EXPLANATION_FALLBACK =
  "No explanation was provided for this question yet. Review the topic material and try a related task.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) return error.message;
  return "Something went wrong. Try again.";
}

export function TaskRunner({ task }: { task: TaskData }) {
  const [confidence, setConfidence] = useState<number | null>(null);
  const [aiLevel, setAiLevel] = useState<AiAssistLevel>("INDEPENDENT");
  const [canExplain, setCanExplain] = useState<boolean | null>(null);
  const [perceivedDifficulty, setPerceivedDifficulty] =
    useState<Difficulty | null>(null);
  const [mistakeNote, setMistakeNote] = useState("");
  const [whyWrong, setWhyWrong] = useState("");
  const [mentalModel, setMentalModel] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);

  // Choice flow state.
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submittedChoiceId, setSubmittedChoiceId] = useState<string | null>(
    null,
  );

  // Text flow state.
  const [textAnswer, setTextAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [revealedExplanation, setRevealedExplanation] = useState<string | null>(
    null,
  );

  const mistakeRecorded =
    result !== null && mistakeNote.trim().length > 0;

  async function handleChoiceSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (result) return;
    if (!selectedOptionId) {
      setError("Choose an answer first.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const res = await submitChoice({
        questionId: task.questionId,
        selectedOptionId,
        confidence,
        usedAi: aiLevel !== "INDEPENDENT",
        aiAssistLevel: aiLevel,
        canExplain,
        perceivedDifficulty,
        mistakeNote,
        whyWrong,
        mentalModel,
      });
      setSubmittedChoiceId(selectedOptionId);
      setResult(res);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function handleReveal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (result || revealed) return;
    if (textAnswer.trim().length === 0) {
      setError("Write your answer from memory first.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const res = await revealTextExplanation({
        questionId: task.questionId,
        textAnswer,
      });
      setRevealedExplanation(res.explanation);
      setRevealed(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function handleSelfMark(wasCorrect: boolean) {
    if (result) return;
    if (textAnswer.trim().length === 0) {
      setError("Write your answer from memory first.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const res = await submitTextSelfMark({
        questionId: task.questionId,
        textAnswer,
        wasCorrect,
        confidence,
        usedAi: aiLevel !== "INDEPENDENT",
        aiAssistLevel: aiLevel,
        canExplain,
        perceivedDifficulty,
        mistakeNote,
        whyWrong,
        mentalModel,
      });
      setResult(res);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  function renderMetaFields() {
    return (
      <div className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Confidence</legend>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="confidence"
                checked={confidence === null}
                onChange={() => setConfidence(null)}
              />
              Skip
            </label>
            {CONFIDENCE_OPTIONS.map((value) => (
              <label key={value} className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  name="confidence"
                  checked={confidence === value}
                  onChange={() => setConfidence(value)}
                />
                {value}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">How did you solve it?</span>
          <select
            className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
            value={aiLevel}
            onChange={(e) => setAiLevel(e.target.value as AiAssistLevel)}
          >
            {AI_ASSIST_LEVELS.map((level) => (
              <option key={level} value={level}>
                {AI_ASSIST_LABELS[level]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={canExplain === false}
            onChange={(e) => setCanExplain(e.target.checked ? false : true)}
          />
          I cannot explain this answer yet
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Perceived difficulty</span>
          <select
            className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
            value={perceivedDifficulty ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setPerceivedDifficulty(
                value === "BEGINNER" ||
                  value === "INTERMEDIATE" ||
                  value === "ADVANCED"
                  ? value
                  : null,
              );
            }}
          >
            <option value="">Not sure</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">
            Why was it wrong? (mistake log)
          </span>
          <textarea
            className="min-h-20 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
            placeholder="Why was the answer wrong?"
            value={whyWrong}
            onChange={(e) => setWhyWrong(e.target.value)}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">
            Mental model / rule to remember
          </span>
          <textarea
            className="min-h-20 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
            placeholder="What rule fixes it next time?"
            value={mentalModel}
            onChange={(e) => setMentalModel(e.target.value)}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">
            What should you revisit if this was wrong?
          </span>
          <textarea
            className="min-h-20 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
            placeholder="What should you revisit if this was wrong?"
            value={mistakeNote}
            onChange={(e) => setMistakeNote(e.target.value)}
          />
        </label>
      </div>
    );
  }

  function renderResult() {
    if (!result) return null;
    return (
      <div className="space-y-4">
        <div
          className={
            result.isCorrect
              ? "rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-sm"
              : "rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
          }
        >
          <p className="font-medium">{result.isCorrect ? "Correct." : "Not quite."}</p>
          <p className="mt-1 text-muted-foreground">Submitted.</p>
        </div>

        {task.hasOptions ? (
          <Card>
            <CardHeader>
              <CardTitle>Your answer</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {task.options.map((option) => {
                  const isCorrect = option.id === result.correctOptionId;
                  const isPick =
                    option.id === submittedChoiceId &&
                    option.id !== result.correctOptionId;
                  return (
                    <li
                      key={option.id}
                      className={
                        isCorrect
                          ? "rounded-lg border border-green-500/50 bg-green-500/10 px-3 py-2 text-sm"
                          : isPick
                            ? "rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm"
                            : "rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
                      }
                    >
                      {option.label}
                      {isCorrect ? " — correct answer" : null}
                      {isPick ? " — your pick" : null}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Explanation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">
              {result.explanation ?? EXPLANATION_FALLBACK}
            </p>
          </CardContent>
        </Card>

        {mistakeRecorded ? (
          <p className="text-sm text-muted-foreground">
            Your mistake note was recorded.
          </p>
        ) : null}

        <Button type="button" render={<Link href="/dashboard" />}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{task.skillName}</Badge>
            <Badge variant="secondary">{task.topicName}</Badge>
            <Badge variant="outline">{task.difficulty}</Badge>
            <span className="text-xs text-muted-foreground">
              ~{task.estimatedMinutes} min
            </span>
            {task.reviewDue ? (
              <Badge variant="destructive">review due</Badge>
            ) : null}
          </div>
          <CardDescription>{task.objective}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {task.prompt}
          </p>
          <p className="text-xs text-muted-foreground">
            Attempt {task.attempts + 1}
            {task.lastWasCorrect !== null
              ? ` · last: ${task.lastWasCorrect ? "correct" : "incorrect"}`
              : null}
          </p>
        </CardContent>
      </Card>

      {result ? (
        renderResult()
      ) : task.hasOptions ? (
        <Card>
          <CardHeader>
            <CardTitle>Your attempt</CardTitle>
            <CardDescription>
              Choose the correct answer without guessing, then submit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleChoiceSubmit}>
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Options</legend>
                <div className="space-y-2">
                  {task.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-start gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <input
                        type="radio"
                        name="choice"
                        value={option.id}
                        required
                        className="mt-1"
                        checked={selectedOptionId === option.id}
                        onChange={() => setSelectedOptionId(option.id)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {renderMetaFields()}

              {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}

              <Button type="submit" disabled={pending}>
                {pending ? "Submitting…" : "Submit answer"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : !revealed ? (
        <Card>
          <CardHeader>
            <CardTitle>Your attempt</CardTitle>
            <CardDescription>
              Write your answer from memory before checking the explanation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleReveal}>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">
                  Write your answer from memory
                </span>
                <textarea
                  className="min-h-32 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
                  placeholder="Write your answer from memory"
                  required
                  minLength={1}
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                />
              </label>

              {renderMetaFields()}

              {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}

              <Button type="submit" disabled={pending}>
                {pending ? "Submitting…" : "Submit answer"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Explanation</CardTitle>
              <CardDescription>
                Compare your answer with the explanation, then mark yourself.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">
                {revealedExplanation ?? EXPLANATION_FALLBACK}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Self-mark</CardTitle>
              <CardDescription>
                Be honest — this drives your review schedule.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderMetaFields()}
              {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() => handleSelfMark(true)}
                >
                  {pending ? "Submitting…" : "I got it right"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => handleSelfMark(false)}
                >
                  {pending ? "Submitting…" : "I got it wrong"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
