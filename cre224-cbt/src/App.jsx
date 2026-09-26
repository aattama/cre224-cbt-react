import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import BANK from './data/questions.json'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
const EXAM_SECONDS = 45
const BEST_KEY = 'cre224_best'

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuiz(pool) {
  return shuffle(pool).map((q) => {
    const optObjs = q.o.map((text, i) => ({ text, correct: i === q.a }))
    const s = shuffle(optObjs)
    return {
      cat: q.c,
      q: q.q,
      expl: q.e || '',
      opts: s.map((o) => o.text),
      correctIndex: s.findIndex((o) => o.correct),
    }
  })
}

export default function App() {
  const cats = useMemo(() => [...new Set(BANK.map((q) => q.c))], [])

  const [screen, setScreen] = useState('setup') // setup | quiz | results
  const [selectedCats, setSelectedCats] = useState(new Set(cats))
  const [length, setLength] = useState(20)
  const [mode, setMode] = useState('exam') // exam | practice
  const [quiz, setQuiz] = useState([])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState([]) // null | { picked }
  const [timeLeft, setTimeLeft] = useState(EXAM_SECONDS)
  const [confirmingEnd, setConfirmingEnd] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [best, setBest] = useState(() => {
    try {
      return localStorage.getItem(BEST_KEY)
    } catch {
      return null
    }
  })

  const timerRef = useRef(null)

  const matchingCount = useMemo(
    () => BANK.filter((q) => selectedCats.has(q.c)).length,
    [selectedCats]
  )

  function toggleCat(c) {
    setSelectedCats((prev) => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })
  }

  function startQuiz() {
    const pool = BANK.filter((q) => selectedCats.has(q.c))
    const built = buildQuiz(pool).slice(0, length === 'all' ? pool.length : length)
    if (built.length === 0) return
    setQuiz(built)
    setAnswers(new Array(built.length).fill(null))
    setIdx(0)
    setConfirmingEnd(false)
    setShowReview(false)
    setScreen('quiz')
  }

  const currentAnswer = answers[idx] ?? null
  const currentQ = quiz[idx]

  const recordAnswer = useCallback(
    (picked) => {
      setAnswers((prev) => {
        if (prev[idx] !== null) return prev // already locked
        const next = prev.slice()
        next[idx] = { picked }
        return next
      })
    },
    [idx]
  )

  // Timer: only runs in exam mode, for an unanswered question
  useEffect(() => {
    if (screen !== 'quiz' || mode !== 'exam') return
    if (currentAnswer !== null) return
    setTimeLeft(EXAM_SECONDS)
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          recordAnswer(-1)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, screen, mode, currentAnswer === null])

  function goNext() {
    setConfirmingEnd(false)
    if (idx < quiz.length - 1) {
      setIdx((i) => i + 1)
    } else {
      finishQuiz(answers)
    }
  }

  function goPrev() {
    setConfirmingEnd(false)
    if (idx > 0) setIdx((i) => i - 1)
  }

  function requestEnd() {
    setConfirmingEnd(true)
  }

  function confirmEnd() {
    finishQuiz(answers)
  }

  function finishQuiz(finalAnswers) {
    clearInterval(timerRef.current)
    setAnswers(finalAnswers)
    const total = quiz.length
    const correct = finalAnswers.filter(
      (a, i) => a && a.picked === quiz[i].correctIndex
    ).length
    const pct = total ? Math.round((correct / total) * 100) : 0
    try {
      const prevBest = parseInt(localStorage.getItem(BEST_KEY) || '0', 10)
      if (pct > prevBest) {
        localStorage.setItem(BEST_KEY, String(pct))
        setBest(String(pct))
      }
    } catch {}
    setShowReview(false)
    setScreen('results')
  }

  function backToSetup() {
    setScreen('setup')
  }

  const answeredCount = answers.filter((a) => a !== null).length

  return (
    <div className="app">
      <header className="top">
        <div className="rec-dot" />
        <h1>
          CRE 224 <b>CBT PRACTICE</b> — Multimedia Development &amp; Application
        </h1>
      </header>

      {screen === 'setup' && (
        <SetupScreen
          cats={cats}
          BANK={BANK}
          selectedCats={selectedCats}
          toggleCat={toggleCat}
          setSelectedCats={setSelectedCats}
          length={length}
          setLength={setLength}
          mode={mode}
          setMode={setMode}
          matchingCount={matchingCount}
          best={best}
          onStart={startQuiz}
        />
      )}

      {screen === 'quiz' && currentQ && (
        <QuizScreen
          quiz={quiz}
          idx={idx}
          mode={mode}
          currentAnswer={currentAnswer}
          timeLeft={timeLeft}
          confirmingEnd={confirmingEnd}
          answeredCount={answeredCount}
          onSelect={recordAnswer}
          onNext={goNext}
          onPrev={goPrev}
          onRequestEnd={requestEnd}
          onConfirmEnd={confirmEnd}
          onCancelEnd={() => setConfirmingEnd(false)}
        />
      )}

      {screen === 'results' && (
        <ResultsScreen
          quiz={quiz}
          answers={answers}
          showReview={showReview}
          setShowReview={setShowReview}
          onRetry={backToSetup}
        />
      )}

      <footer className="note">
        Built from the CRE 224 course materials for self-study. Not affiliated with any
        examination body.
      </footer>
    </div>
  )
}

function SetupScreen({
  cats,
  BANK,
  selectedCats,
  toggleCat,
  setSelectedCats,
  length,
  setLength,
  mode,
  setMode,
  matchingCount,
  best,
  onStart,
}) {
  return (
    <section>
      <div className="hero">
        <h2>Sharpen your recall before the real exam.</h2>
        <p>
          A question bank built from the CRE 224 lecture material — animation, interactive
          UI, the web &amp; streaming, copyright &amp; licensing, WCAG accessibility, AI in
          multimedia, immersive tech, hardware/software and more. Pick a topic and a
          length, then run the test.
        </p>
      </div>

      <div className="stat-row">
        <div className="stat">
          <div className="n">{BANK.length}</div>
          <div className="l">Questions in bank</div>
        </div>
        <div className="stat">
          <div className="n">{cats.length}</div>
          <div className="l">Topics</div>
        </div>
        <div className="stat">
          <div className="n">{best ? best + '%' : '—'}</div>
          <div className="l">Best score</div>
        </div>
      </div>

      <div className="panel">
        <h3>Topics</h3>
        <div className="row-controls">
          <div className="btn-row" style={{ margin: 0 }}>
            <button
              className="btn secondary small"
              onClick={() => setSelectedCats(new Set(cats))}
            >
              Select all
            </button>
            <button className="btn secondary small" onClick={() => setSelectedCats(new Set())}>
              Clear
            </button>
          </div>
        </div>
        <div className="cat-grid">
          {cats.map((c) => {
            const count = BANK.filter((q) => q.c === c).length
            const on = selectedCats.has(c)
            return (
              <button
                key={c}
                className={'cat-chip' + (on ? ' on' : '')}
                onClick={() => toggleCat(c)}
              >
                <span>{c}</span>
                <small>{count}</small>
              </button>
            )
          })}
        </div>
      </div>

      <div className="panel">
        <h3>Test length</h3>
        <div className="seg">
          {[20, 40, 60, 'all'].map((n) => (
            <button
              key={n}
              className={length === n ? 'on' : ''}
              onClick={() => setLength(n)}
            >
              {n === 'all' ? 'All matching' : n}
            </button>
          ))}
        </div>
        <small className="hint">{matchingCount} question(s) match your topic selection.</small>
      </div>

      <div className="panel">
        <h3>Mode</h3>
        <div className="seg">
          <button className={mode === 'exam' ? 'on' : ''} onClick={() => setMode('exam')}>
            Exam (timed, no feedback)
          </button>
          <button
            className={mode === 'practice' ? 'on' : ''}
            onClick={() => setMode('practice')}
          >
            Practice (instant feedback)
          </button>
        </div>
        <small className="hint">
          Exam mode gives 45 seconds per question and only reveals answers at the end.
          Practice mode shows the correct answer and a short explanation right after you
          choose. In both modes you can move freely between questions with Previous / Next.
        </small>
      </div>

      <div className="btn-row">
        <button className="btn rec" disabled={matchingCount === 0} onClick={onStart}>
          Start test →
        </button>
      </div>
      {matchingCount === 0 && (
        <small className="hint">Select at least one topic to begin.</small>
      )}
    </section>
  )
}

function QuizScreen({
  quiz,
  idx,
  mode,
  currentAnswer,
  timeLeft,
  confirmingEnd,
  answeredCount,
  onSelect,
  onNext,
  onPrev,
  onRequestEnd,
  onConfirmEnd,
  onCancelEnd,
}) {
  const q = quiz[idx]
  const locked = currentAnswer !== null
  const isLast = idx === quiz.length - 1

  return (
    <section>
      <div className="quiz-head">
        <div className="qcount">
          {idx + 1} / {quiz.length}
        </div>
        <div className="scrub">
          <i style={{ width: (idx / quiz.length) * 100 + '%' }} />
        </div>
        {mode === 'exam' && !locked && (
          <div className="timer">
            0:{String(timeLeft).padStart(2, '0')}
          </div>
        )}
        {mode === 'exam' && locked && <div className="timer answered-tag">Answered</div>}
      </div>

      <div className="qcat">{q.cat}</div>
      <p className="qtext">{q.q}</p>

      <div className="opts">
        {q.opts.map((text, i) => {
          let cls = 'opt'
          if (mode === 'practice' && locked) {
            if (i === q.correctIndex) cls += ' correct'
            else if (i === currentAnswer.picked) cls += ' wrong'
          } else if (locked && i === currentAnswer.picked) {
            cls += ' picked'
          }
          return (
            <button
              key={i}
              className={cls}
              disabled={locked}
              onClick={() => onSelect(i)}
            >
              <span className="k">{LETTERS[i]}</span>
              <span>{text}</span>
            </button>
          )
        })}
      </div>

      {mode === 'practice' && locked && q.expl && (
        <div className="explain show">{q.expl}</div>
      )}

      {confirmingEnd && (
        <div className="confirm-banner">
          <span>
            End the test now? You've answered {answeredCount} of {quiz.length}. Unanswered
            questions will be marked as skipped.
          </span>
          <div className="btn-row" style={{ marginTop: 10 }}>
            <button className="btn rec small" onClick={onConfirmEnd}>
              Yes, end test
            </button>
            <button className="btn secondary small" onClick={onCancelEnd}>
              Keep going
            </button>
          </div>
        </div>
      )}

      <div className="footbar">
        <button className="btn secondary" onClick={onRequestEnd}>
          End test
        </button>
        <div className="btn-row" style={{ margin: 0 }}>
          <button className="btn secondary" disabled={idx === 0} onClick={onPrev}>
            ← Previous
          </button>
          <button className="btn" disabled={!locked} onClick={onNext}>
            {isLast ? 'Finish →' : 'Next →'}
          </button>
        </div>
      </div>
    </section>
  )
}

function ResultsScreen({ quiz, answers, showReview, setShowReview, onRetry }) {
  const total = quiz.length
  const correct = answers.filter((a, i) => a && a.picked === quiz[i].correctIndex).length
  const pct = total ? Math.round((correct / total) * 100) : 0
  const msg =
    pct >= 80
      ? "Strong recall — you're exam-ready."
      : pct >= 60
      ? 'Solid, but revisit the topics you missed.'
      : 'Worth another pass through the lecture notes.'

  return (
    <section>
      <div className="score-hero">
        <div className="score-big">
          {correct}
          <span>/{total}</span>
        </div>
        <div className="score-msg">
          {pct}% correct. {msg}
        </div>
      </div>

      <div className="btn-row" style={{ justifyContent: 'center', margin: '18px 0 26px' }}>
        <button className="btn" onClick={onRetry}>
          New test
        </button>
        <button className="btn secondary" onClick={() => setShowReview((s) => !s)}>
          {showReview ? 'Hide review' : 'Review answers'}
        </button>
      </div>

      {showReview && (
        <div className="panel">
          <h3>Answer review</h3>
          <div>
            {quiz.map((q, n) => {
              const a = answers[n]
              const gotIt = a && a.picked === q.correctIndex
              const pickedText = a && a.picked >= 0 ? `${LETTERS[a.picked]}. ${q.opts[a.picked]}` : '(no answer)'
              const correctText = `${LETTERS[q.correctIndex]}. ${q.opts[q.correctIndex]}`
              return (
                <div className="review-item" key={n}>
                  <div className="rq">
                    {n + 1}. {q.q}{' '}
                    {gotIt ? (
                      <span className="tag-ok">Correct</span>
                    ) : (
                      <span className="tag-bad">Missed</span>
                    )}
                  </div>
                  <div className={'ra ' + (gotIt ? 'correctline' : 'wrongline')}>
                    Your answer: {pickedText}
                  </div>
                  {!gotIt && <div className="ra correctline">Correct answer: {correctText}</div>}
                  {q.expl && <div className="ra">{q.expl}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
