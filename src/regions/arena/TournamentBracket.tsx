import { motion } from 'framer-motion'

interface Matchup {
  team1: string
  team2: string
  winner: 1 | 2
  score?: string
}

interface Round {
  name: string
  matches: Matchup[]
}

const TOURNAMENT: Round[] = [
  {
    name: 'Quarter Finals',
    matches: [
      { team1: 'Early Mornings', team2: 'Sleeping In', winner: 1, score: '5am alarm' },
      { team1: 'Coffee', team2: 'Energy Drinks', winner: 1, score: 'Black, no sugar' },
      { team1: 'Grilling Out', team2: 'Ordering In', winner: 1, score: 'Charcoal > gas' },
      { team1: 'Books', team2: 'TV Shows', winner: 1, score: 'Close one' },
    ],
  },
  {
    name: 'Semi Finals',
    matches: [
      { team1: 'Early Mornings', team2: 'Coffee', winner: 2, score: 'Powered by' },
      { team1: 'Grilling Out', team2: 'Books', winner: 1, score: 'Why not both?' },
    ],
  },
  {
    name: 'Final',
    matches: [
      { team1: 'Coffee', team2: 'Grilling Out', winner: 1, score: 'CHAMPION' },
    ],
  },
]

export function TournamentBracket() {
  return (
    <div className="tournament">
      <h2 className="tournament__title">The Grand Tournament</h2>
      <p className="tournament__subtitle text-accent">
        A bracket of life's great rivalries
      </p>

      <div className="tournament__bracket">
        {TOURNAMENT.map((round, roundIdx) => (
          <div key={round.name} className="tournament__round">
            <h3 className="tournament__round-name">{round.name}</h3>
            <div className="tournament__matches">
              {round.matches.map((match, matchIdx) => (
                <motion.div
                  key={`${roundIdx}-${matchIdx}`}
                  className="tournament__match"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: roundIdx * 0.2 + matchIdx * 0.1 }}
                >
                  <div className={`tournament__team ${match.winner === 1 ? 'tournament__team--winner' : ''}`}>
                    <span className="tournament__team-name">{match.team1}</span>
                    {match.winner === 1 && <span className="tournament__crown">♛</span>}
                  </div>
                  <div className="tournament__vs">vs</div>
                  <div className={`tournament__team ${match.winner === 2 ? 'tournament__team--winner' : ''}`}>
                    <span className="tournament__team-name">{match.team2}</span>
                    {match.winner === 2 && <span className="tournament__crown">♛</span>}
                  </div>
                  {match.score && (
                    <div className="tournament__score">{match.score}</div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Champion announcement */}
      <motion.div
        className="tournament__champion"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <span className="tournament__champion-crown">👑</span>
        <span className="tournament__champion-label">Reigning Champion</span>
        <span className="tournament__champion-name">Coffee</span>
        <span className="tournament__champion-note text-accent">
          Defeating all challengers since... always
        </span>
      </motion.div>
    </div>
  )
}
