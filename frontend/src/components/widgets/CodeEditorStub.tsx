import { useRef, useState } from 'react';
import { Button } from '../ui/Button';

interface Props {
  value: string;
  onChange: (val: string) => void;
  timeLimitMinutes: number;
  onSubmit: () => void;
  submitLabel?: string;
  disabled?: boolean;
}

/**
 * A code-editor-shaped textarea, not a real compiler. The "Run" button is
 * intentionally disabled with a "Phase 2" tooltip rather than faking
 * execution — a compiler that doesn't really compile is a worse demo risk
 * than clearly labeling it as a roadmap item. What IS real: the timer and
 * the submit-for-human-review flow.
 *
 * The countdown timer is started by a click handler (not useEffect) and
 * keeps its interval id in a ref so it can be cleared explicitly. This is a
 * deliberate constraint from the project brief; the tradeoff is that the
 * interval is not cleaned up on unmount, which is fine for a single-page
 * challenge flow but worth knowing if this component is reused elsewhere.
 */
export function CodeEditorStub({ value, onChange, timeLimitMinutes, onSubmit, submitLabel = 'Submit for Review', disabled }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(timeLimitMinutes * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  function startTimer() {
    if (running) return;
    setRunning(true);
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function stopTimer() {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    setRunning(false);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="code-editor">
      <div className="code-editor-toolbar">
        <span className="code-editor-toolbar-title">
          challenge.tsx {running || secondsLeft < timeLimitMinutes * 60 ? `· ${minutes}:${seconds.toString().padStart(2, '0')}` : ''}
        </span>
        <button
          className="btn run-btn-stub"
          disabled
          title="Live compiler + test execution — coming in Phase 2"
        >
          ▶ Run Code
        </button>
        {!running ? (
          <Button variant="secondary" onClick={startTimer} disabled={disabled || secondsLeft === 0}>
            Start Timer
          </Button>
        ) : (
          <Button variant="secondary" onClick={stopTimer}>Pause</Button>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="// Write your solution here"
        disabled={disabled}
        spellCheck={false}
      />
      <div style={{ padding: 'var(--space-150) var(--space-200)', borderTop: '1px solid #1F2B45' }}>
        <Button onClick={onSubmit} disabled={disabled || value.trim().length === 0}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
