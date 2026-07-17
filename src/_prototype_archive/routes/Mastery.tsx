import { useState } from 'react';
import { useProgressStore } from '../store/useProgressStore';
import styles from './Mastery.module.css';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const masteryQuestions: Question[] = [
  {
    id: 'q1',
    text: 'A sound wave travels through air. What happens to the air particles as the wave passes?',
    options: [
      'They travel along with the wave from the source to the receiver.',
      'They oscillate back and forth parallel to the direction of wave travel.',
      'They oscillate up and down perpendicular to the direction of wave travel.',
      'They do not move at all.'
    ],
    correctIndex: 1,
    explanation: 'Sound is a longitudinal mechanical wave. Particles oscillate back and forth (parallel) to the direction of energy transfer, forming compressions and rarefactions.'
  },
  {
    id: 'q2',
    text: 'A red laser beam is pointed from air (n = 1.0) into a glass block (n = 1.5) at an angle of 30° to the normal. What happens to the light ray inside the glass?',
    options: [
      'It bends away from the normal and speeds up.',
      'It bends towards the normal and speeds up.',
      'It bends towards the normal and slows down.',
      'It travels straight through without bending.'
    ],
    correctIndex: 2,
    explanation: 'When light enters a denser medium (higher refractive index), it slows down and bends towards the normal line.'
  },
  {
    id: 'q3',
    text: 'A 1000 kg car accelerates at 3 m/s². What is the net force acting on the car?',
    options: [
      '333 N',
      '1000 N',
      '3000 N',
      '9800 N'
    ],
    correctIndex: 2,
    explanation: 'Newton\'s Second Law: F = ma. 1000 kg × 3 m/s² = 3000 N.'
  }
];

export default function Mastery() {
  const { markComplete } = useProgressStore();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [cerDraft, setCerDraft] = useState('');

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
    
    if (index === masteryQuestions[currentQuestion].correctIndex) {
      markComplete(`mastery-${masteryQuestions[currentQuestion].id}`);
    }
  };

  const nextQuestion = () => {
    setCurrentQuestion(c => Math.min(c + 1, masteryQuestions.length - 1));
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const isCompleted = currentQuestion === masteryQuestions.length - 1 && showResult;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Mastery & Application</h1>
        <p className={styles.learningIntention}>
          <strong>Learning Intention:</strong> Apply your knowledge of waves, light, sound, and motion to solve problems and construct scientific arguments.
        </p>
      </header>

      <div className={styles.content}>
        <section className={styles.quizSection}>
          <h2>Knowledge Check</h2>
          
          <div className={styles.questionCard}>
            <span className={styles.questionProgress}>Question {currentQuestion + 1} of {masteryQuestions.length}</span>
            <h3 className={styles.questionText}>{masteryQuestions[currentQuestion].text}</h3>
            
            <div className={styles.optionsList}>
              {masteryQuestions[currentQuestion].options.map((option, idx) => {
                const isCorrect = idx === masteryQuestions[currentQuestion].correctIndex;
                const isSelected = selectedAnswer === idx;
                
                let optionClass = styles.option;
                if (showResult) {
                  if (isCorrect) optionClass += ` ${styles.correct}`;
                  else if (isSelected) optionClass += ` ${styles.incorrect}`;
                  else optionClass += ` ${styles.disabled}`;
                } else if (isSelected) {
                  optionClass += ` ${styles.selected}`;
                }

                return (
                  <button 
                    key={idx} 
                    className={optionClass}
                    onClick={() => handleAnswer(idx)}
                    disabled={showResult}
                  >
                    <span className={styles.optionLetter}>{String.fromCharCode(65 + idx)}</span>
                    <span className={styles.optionText}>{option}</span>
                    {showResult && isCorrect && <CheckCircle className={styles.resultIcon} size={20} color="#51cf66" />}
                    {showResult && isSelected && !isCorrect && <AlertCircle className={styles.resultIcon} size={20} color="#ff6b6b" />}
                  </button>
                );
              })}
            </div>

            {showResult && (
              <div className={`${styles.explanation} ${selectedAnswer === masteryQuestions[currentQuestion].correctIndex ? styles.explanationSuccess : styles.explanationError}`}>
                <strong>{selectedAnswer === masteryQuestions[currentQuestion].correctIndex ? 'Correct!' : 'Incorrect.'}</strong> {masteryQuestions[currentQuestion].explanation}
              </div>
            )}

            {showResult && !isCompleted && (
              <button className={styles.nextButton} onClick={nextQuestion}>
                Next Question
              </button>
            )}
          </div>
        </section>

        {isCompleted && (
          <section className={styles.cerSection}>
            <h2>Scientific Argument (CER)</h2>
            <div className={styles.cerPrompt}>
              <strong>Scenario:</strong> You are tasked with designing a safety bumper for a new car. 
              Using Newton's Laws of Motion, explain why a crumple zone (which increases the time of collision) reduces the force on the passengers.
            </div>
            
            <div className={styles.cerEditor}>
              <label htmlFor="cerDraft">Claim, Evidence, Reasoning:</label>
              <textarea 
                id="cerDraft" 
                rows={6}
                value={cerDraft}
                onChange={e => setCerDraft(e.target.value)}
                placeholder="State your claim. Provide evidence from the simulation (F=ma or Acceleration=Δv/Δt). Explain your reasoning..."
              />
              <button className={styles.submitCer} onClick={() => {
                alert('Argument submitted to teacher dashboard!');
                markComplete('mastery-cer');
              }}>
                Submit Argument
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
