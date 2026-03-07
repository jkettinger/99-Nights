import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TransitionOverlay, usePageTransition } from '../components/PageTransition'
import { useRegionAudio } from '../hooks/useAudio'
import './Library.css'

/* ===== Data ===== */

interface BookQuote {
  title: string
  author: string
  quote: string
  color: string
  height: number
}

const BOOKS: BookQuote[] = [
  { title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', quote: '"Not all those who wander are lost."', color: '#4a2820', height: 130 },
  { title: 'Dune', author: 'Frank Herbert', quote: '"Fear is the mind-killer."', color: '#3a3520', height: 140 },
  { title: 'The Name of the Wind', author: 'Patrick Rothfuss', quote: '"Words are pale shadows of forgotten names."', color: '#1e2a3a', height: 125 },
  { title: '1984', author: 'George Orwell', quote: '"Who controls the past controls the future."', color: '#2a2a2a', height: 135 },
  { title: 'Neuromancer', author: 'William Gibson', quote: '"The sky above the port was the color of television, tuned to a dead channel."', color: '#1a2a2a', height: 120 },
  { title: 'Blood Meridian', author: 'Cormac McCarthy', quote: '"Whatever in creation exists without my knowledge exists without my consent."', color: '#3a1a1a', height: 145 },
  { title: 'The Count of Monte Cristo', author: 'Alexandre Dumas', quote: '"All human wisdom is contained in these two words: Wait and Hope."', color: '#2a2a1a', height: 150 },
  { title: 'Meditations', author: 'Marcus Aurelius', quote: '"The impediment to action advances action. What stands in the way becomes the way."', color: '#2a2018', height: 110 },
  { title: 'The Road', author: 'Cormac McCarthy', quote: '"You forget what you want to remember, and you remember what you want to forget."', color: '#252525', height: 128 },
  { title: 'Hyperion', author: 'Dan Simmons', quote: '"Words bend our thinking to infinite paths of self-delusion."', color: '#1a1a30', height: 138 },
  { title: 'East of Eden', author: 'John Steinbeck', quote: '"And now that you don\'t have to be perfect, you can be good."', color: '#2a3a20', height: 132 },
  { title: 'The Silmarillion', author: 'J.R.R. Tolkien', quote: '"From splendour he fell through arrogance to contempt for all things save himself."', color: '#3a2a1a', height: 142 },
]

interface CodexPage {
  title: string
  content: string
  quote?: { text: string; author: string }
}

const CODEX_PAGES: CodexPage[] = [
  {
    title: 'On the Nature of Stories',
    content: 'In the beginning there was the Word, and the Word was written on parchment, and the parchment was bound in leather, and the leather was shelved in the library. And the library stood at the center of all things, because all things begin and end with a story.',
    quote: { text: 'A reader lives a thousand lives before he dies. The man who never reads lives only one.', author: 'George R.R. Martin' },
  },
  {
    title: 'The Art of World-Building',
    content: 'Every great fantasy begins with a map. Not because the reader needs directions, but because the author needs to believe the world is real. The mountains must have weight, the rivers must have source, and the forests must hold secrets older than the kingdoms they border.',
    quote: { text: 'Fantasy is hardly an escape from reality. It\'s a way of understanding it.', author: 'Lloyd Alexander' },
  },
  {
    title: 'Of Characters & Consequence',
    content: 'The best characters are the ones who surprise you — not because they act randomly, but because they act truthfully. A well-written villain believes they are the hero. A well-written hero carries doubt like a second sword. The space between certainty and fear is where all great stories live.',
    quote: { text: 'We are all stories in the end. Just make it a good one.', author: 'The Doctor' },
  },
  {
    title: 'The Writer\'s Discipline',
    content: 'Writing is not waiting for inspiration. It is sitting down every day and wrestling with sentences until they stop fighting you. It is deleting the clever line because the honest one serves the story better. It is knowing that the first draft is always a map drawn from memory — close enough to find the treasure, wrong enough to keep the journey interesting.',
    quote: { text: 'Start writing, no matter what. The water does not flow until the faucet is turned on.', author: 'Louis L\'Amour' },
  },
]

const WRITING_TEXT = "In the dim light of the ancient library, where dust motes dance like tiny stars in shafts of amber light, the wanderer finds a moment of stillness. Here, among the towering shelves and whispered echoes of a thousand authors, every book is a portal — every page, a world unto itself..."

const WRITING_WORDS = WRITING_TEXT.split(' ')

/* ===== Component ===== */

export default function Library() {
  useRegionAudio('library')
  const navigate = useNavigate()
  const { transitionConfig, triggerTransition, clearTransition } = usePageTransition()
  const [currentPage, setCurrentPage] = useState(0)
  const [hoveredBook, setHoveredBook] = useState<number | null>(null)
  const [revealedChars, setRevealedChars] = useState(0)

  const handleBack = useCallback(() => {
    triggerTransition('map', () => navigate('/'))
  }, [triggerTransition, navigate])

  // Ink-bleed writing animation — reveal word by word to reduce DOM nodes
  useEffect(() => {
    if (revealedChars >= WRITING_WORDS.length) return
    const timeout = setTimeout(() => {
      setRevealedChars((c) => c + 1)
    }, 80 + Math.random() * 60)
    return () => clearTimeout(timeout)
  }, [revealedChars])

  const page = CODEX_PAGES[currentPage]

  return (
    <div className="library">
      <div className="library__bg" />

      {/* Light beams */}
      <div className="library__beams">
        <div className="light-beam light-beam--1" />
        <div className="light-beam light-beam--2" />
        <div className="light-beam light-beam--3" />
      </div>

      {/* Background bookshelves */}
      <div className="library__shelves">
        <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          {/* Left bookshelf */}
          <rect className="shelf-wood" x="0" y="0" width="80" height="800" />
          {generateShelfBooks(10, 50, 60, 20)}
          {generateShelfBooks(10, 200, 60, 18)}
          {generateShelfBooks(10, 380, 60, 22)}
          {generateShelfBooks(10, 550, 60, 19)}

          {/* Right bookshelf */}
          <rect className="shelf-wood" x="1120" y="0" width="80" height="800" />
          {generateShelfBooks(1130, 50, 60, 20)}
          {generateShelfBooks(1130, 200, 60, 18)}
          {generateShelfBooks(1130, 380, 60, 22)}
          {generateShelfBooks(1130, 550, 60, 19)}

          {/* Shelf planks */}
          {[180, 360, 530, 700].map((y) => (
            <g key={`shelf-${y}`}>
              <rect x="0" y={y} width="80" height="8" fill="#2a1f10" />
              <rect x="1120" y={y} width="80" height="8" fill="#2a1f10" />
            </g>
          ))}
        </svg>
      </div>

      {/* Dust particles */}
      <div className="library__dust">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="dust-mote" />
        ))}
      </div>

      {/* Main content */}
      <div className="library__content">
        {/* Header */}
        <motion.div
          className="library__header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1>The Ancient Library</h1>
          <p>Where stories breathe and words have weight</p>
        </motion.div>

        {/* Codex */}
        <motion.div
          className="codex"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="codex__book">
            {/* Margin decorations */}
            <div className="codex__margin">
              {[60, 160, 260].map((top, i) => (
                <svg key={i} className="codex__margin-ornament" style={{ top }} viewBox="0 0 20 20">
                  <path className="gold-leaf" d="M10,2 Q15,5 13,10 Q15,15 10,18 Q5,15 7,10 Q5,5 10,2 Z" style={{ animationDelay: `${i * 1.3}s` }} />
                </svg>
              ))}
            </div>

            {/* Page content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                className="codex__page-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                <h3>{page.title}</h3>
                <p>{page.content}</p>
                {page.quote && (
                  <blockquote>
                    {page.quote.text}
                    <cite>— {page.quote.author}</cite>
                  </blockquote>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Page navigation */}
            <div className="codex__nav">
              <button
                className="codex__nav-btn"
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 0}
              >
                Previous
              </button>
              <span className="codex__page-num">
                {currentPage + 1} / {CODEX_PAGES.length}
              </span>
              <button
                className="codex__nav-btn"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === CODEX_PAGES.length - 1}
              >
                Next
              </button>
            </div>
          </div>
        </motion.div>

        {/* Book spines shelf */}
        <motion.div
          className="bookshelf"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h4 className="bookshelf__title">Tomes of Note</h4>
          <div className="bookshelf__row">
            {BOOKS.map((book, i) => (
              <div
                key={i}
                className="book-interactive"
                style={{ backgroundColor: book.color, height: book.height }}
                onMouseEnter={() => setHoveredBook(i)}
                onMouseLeave={() => setHoveredBook(null)}
                onFocus={() => setHoveredBook(i)}
                onBlur={() => setHoveredBook(null)}
                onClick={() => setHoveredBook(hoveredBook === i ? null : i)}
                role="button"
                tabIndex={0}
                aria-label={`${book.title} by ${book.author}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setHoveredBook(hoveredBook === i ? null : i)
                  }
                }}
              >
                <span className="book-interactive__label">{book.title}</span>
                <AnimatePresence>
                  {hoveredBook === i && (
                    <motion.div
                      className="book-tooltip"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="book-tooltip__title">{book.title}</div>
                      <div className="book-tooltip__quote">{book.quote}</div>
                      <div className="book-tooltip__author">— {book.author}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Writing desk */}
        <motion.div
          className="writing-desk"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <h4 className="writing-desk__title">The Writing Desk</h4>
          <div className="writing-desk__paper">
            <div className="writing-desk__text">
              {WRITING_WORDS.slice(0, revealedChars).map((word, i) => (
                <span
                  key={i}
                  className="ink-char"
                  style={{ animationDelay: `${Math.max(0, (i - revealedChars + 3)) * 0.05}s` }}
                >
                  {word}{' '}
                </span>
              ))}
              {revealedChars < WRITING_WORDS.length && (
                <span style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '1em',
                  background: 'var(--color-gold)',
                  marginLeft: '1px',
                  animation: 'flicker 1s ease-in-out infinite alternate',
                  verticalAlign: 'text-bottom',
                }} />
              )}
            </div>
            {/* Ink blot decorations */}
            <div className="ink-blot" style={{ bottom: '10px', right: '20px', width: '30px', height: '25px' }} />
            <div className="ink-blot" style={{ bottom: '5px', right: '35px', width: '15px', height: '12px' }} />
          </div>
        </motion.div>
      </div>

      {/* Back button */}
      <button className="library__back" onClick={handleBack}>
        Return to Map
      </button>

      {/* Vignette */}
      <div className="library__vignette" />

      {/* Transition overlay */}
      <TransitionOverlay config={transitionConfig} onComplete={clearTransition} />
    </div>
  )
}

/* ===== Helpers ===== */

function generateShelfBooks(startX: number, startY: number, shelfWidth: number, count: number) {
  const books = []
  let x = startX + 2
  const bookColors = ['#3a2820', '#2a1a28', '#1a2a1a', '#2a2a1a', '#1a1a2a', '#2a1a1a', '#1a2a2a', '#2a281a']
  for (let i = 0; i < count; i++) {
    const w = 2 + Math.random() * 2
    const h = 100 + Math.random() * 40
    if (x + w > startX + shelfWidth) break
    books.push(
      <rect
        key={`bg-book-${startX}-${startY}-${i}`}
        className="book-spine"
        x={x}
        y={startY + (140 - h)}
        width={w}
        height={h}
        fill={bookColors[i % bookColors.length]}
      />
    )
    x += w + 0.5
  }
  return <g key={`shelf-books-${startX}-${startY}`}>{books}</g>
}
