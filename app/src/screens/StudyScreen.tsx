import { ScreenLayout } from "../components/ScreenLayout";
import type { RecallRating, StudyCard } from "../types/models";

interface StudyScreenProps {
  card: StudyCard | null;
  isAnswerRevealed: boolean;
  onRevealAnswer: () => void;
  onRate: (rating: RecallRating) => void;
  onGoToSettings: () => void;
}

export function StudyScreen({
  card,
  isAnswerRevealed,
  onRevealAnswer,
  onRate,
  onGoToSettings,
}: StudyScreenProps) {
  return (
    <ScreenLayout
      title="Study"
      subtitle="Recall the answer first, then reveal it and rate how well you remembered."
    >
      {!card ? (
        <div className="panel">
          <h2>No items available</h2>
          <p>
            Adjust your current level or enabled packs in Settings to build a study session from
            the current vocabulary library.
          </p>
          <div className="actions">
            <button className="button button--primary" onClick={onGoToSettings}>
              Open settings
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="panel">
            <div className="panel__row">
              <div>
                <p className="eyebrow">Prompt</p>
                <h2>{card.prompt}</h2>
              </div>
              <span className="pill pill--active">
                Card {card.position} of {card.total}
              </span>
            </div>
            <p className="screen__subtitle">
              Mode: {card.mode === "svToEn" ? "Swedish -> English" : "English -> Swedish"}
            </p>
          </div>
          <div className={`panel ${isAnswerRevealed ? "panel--muted" : ""}`}>
            <p className="eyebrow">Answer</p>
            {isAnswerRevealed ? (
              <>
                <h3>{card.answer}</h3>
                {card.exampleSv ? <p>{card.exampleSv}</p> : null}
                {card.exampleEn ? <p className="meta">{card.exampleEn}</p> : null}
              </>
            ) : (
              <p>Try to recall the answer before revealing it.</p>
            )}
          </div>
          <div className="actions">
            {!isAnswerRevealed ? (
              <button className="button button--primary" onClick={onRevealAnswer}>
                Reveal answer
              </button>
            ) : (
              <>
                <button className="button button--primary" onClick={() => onRate("easy")}>
                  Easy
                </button>
                <button className="button button--secondary" onClick={() => onRate("hard")}>
                  Hard
                </button>
                <button className="button button--secondary" onClick={() => onRate("wrong")}>
                  Wrong
                </button>
              </>
            )}
            <button className="button button--secondary" onClick={onGoToSettings}>
              Change study settings
            </button>
          </div>
        </>
      )}
    </ScreenLayout>
  );
}
