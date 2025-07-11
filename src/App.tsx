import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Crown, Users, Trophy, Zap } from 'lucide-react'

const PLAYER_COLORS = [
  { name: 'Red', color: 'bg-red-500', border: 'border-red-500', text: 'text-red-500' },
  { name: 'Blue', color: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500' },
  { name: 'Green', color: 'bg-green-500', border: 'border-green-500', text: 'text-green-500' },
  { name: 'Yellow', color: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-500' },
]

const DiceIcon = ({ value }: { value: number }) => {
  const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]
  const Icon = icons[value - 1]
  return <Icon className="w-8 h-8" />
}

// Create board positions following the exact diagonal pattern described
const getBoardPositions = () => {
  const positions = []
  const BOARD_HEIGHT = 700
  const MARGIN = 80
  const STEP_SIZE = 60
  
  // Start position (🟢) - positioned at left center
  positions.push({ 
    id: 0, 
    x: MARGIN, 
    y: BOARD_HEIGHT / 2, 
    label: '🟢' 
  })
  
  // Positions 1-4: horizontal line from start (moving right)
  for (let i = 1; i <= 4; i++) {
    positions.push({ 
      id: i, 
      x: MARGIN + (i * STEP_SIZE), 
      y: BOARD_HEIGHT / 2, 
      label: i.toString() 
    })
  }
  
  // Positions 5-8: downwards diagonally towards the right
  for (let i = 5; i <= 8; i++) {
    const step = i - 4
    positions.push({ 
      id: i, 
      x: MARGIN + (4 * STEP_SIZE) + (step * STEP_SIZE), 
      y: (BOARD_HEIGHT / 2) + (step * STEP_SIZE), 
      label: i.toString() 
    })
  }
  
  // Positions 9-12: upwards diagonally towards the right
  for (let i = 9; i <= 12; i++) {
    const step = i - 8
    positions.push({ 
      id: i, 
      x: MARGIN + (8 * STEP_SIZE) + (step * STEP_SIZE), 
      y: (BOARD_HEIGHT / 2) + (4 * STEP_SIZE) - (step * STEP_SIZE), 
      label: i.toString() 
    })
  }
  
  // Positions 13-16: downwards straight towards the bottom
  for (let i = 13; i <= 16; i++) {
    const step = i - 12
    positions.push({ 
      id: i, 
      x: MARGIN + (12 * STEP_SIZE), 
      y: (BOARD_HEIGHT / 2) + (step * STEP_SIZE), 
      label: i.toString() 
    })
  }
  
  // Positions 17-20: upwards diagonally towards the left
  for (let i = 17; i <= 20; i++) {
    const step = i - 16
    positions.push({ 
      id: i, 
      x: MARGIN + (12 * STEP_SIZE) - (step * STEP_SIZE), 
      y: (BOARD_HEIGHT / 2) + (4 * STEP_SIZE) - (step * STEP_SIZE), 
      label: i.toString() 
    })
  }
  
  // Positions 21-24: downwards diagonally towards the left
  for (let i = 21; i <= 24; i++) {
    const step = i - 20
    positions.push({ 
      id: i, 
      x: MARGIN + (8 * STEP_SIZE) - (step * STEP_SIZE), 
      y: (BOARD_HEIGHT / 2) + (step * STEP_SIZE), 
      label: i.toString() 
    })
  }
  
  // Positions 25-28: upwards diagonally towards the left (ending at 🔴)
  for (let i = 25; i <= 28; i++) {
    const step = i - 24
    positions.push({ 
      id: i, 
      x: MARGIN + (4 * STEP_SIZE) - (step * STEP_SIZE), 
      y: (BOARD_HEIGHT / 2) + (4 * STEP_SIZE) - (step * STEP_SIZE), 
      label: i === 28 ? '🔴' : i.toString() 
    })
  }
  
  return positions
}

function App() {
  const [playerCount, setPlayerCount] = useState(2)
  const [isRolling, setIsRolling] = useState(false)
  const [gameState, setGameState] = useState(() => ({
    players: [],
    currentPlayerIndex: 0,
    dice: [1, 1],
    gamePhase: 'setup',
    winner: null,
    lastRoll: null,
    canSabotage: null,
  }))

  const startGame = useCallback(() => {
    const players = Array.from({ length: playerCount }, (_, i) => ({
      id: i + 1,
      name: `Player ${i + 1}`,
      position: 0, // Start at position 0 (before the board)
      color: PLAYER_COLORS[i].color,
      consecutiveDouble: null,
    }))
    setGameState({
      players,
      currentPlayerIndex: 0,
      dice: [1, 1],
      gamePhase: 'playing',
      winner: null,
      lastRoll: null,
      canSabotage: null,
    })
  }, [playerCount])

  const rollDice = useCallback(() => {
    if (isRolling || gameState.gamePhase !== 'playing') return

    setIsRolling(true)
    
    // Animate dice rolling
    setTimeout(() => {
      const dice1 = Math.floor(Math.random() * 6) + 1
      const dice2 = Math.floor(Math.random() * 6) + 1
      const sum = dice1 + dice2
      const isDouble = dice1 === dice2
      
      setGameState(prev => {
        const currentPlayer = prev.players[prev.currentPlayerIndex]
        const newPlayers = [...prev.players]
        
        let newPosition = currentPlayer.position
        let canSabotage = null
        
        if (isDouble) {
          // Move backward on doubles
          if (currentPlayer.position === 0) {
            newPosition = 0 // Can't move backward from start
          } else {
            newPosition = Math.max(0, currentPlayer.position - sum)
          }
          
          // Check for consecutive double
          if (currentPlayer.consecutiveDouble === sum) {
            canSabotage = { playerId: currentPlayer.id, value: dice1 }
          }
          
          newPlayers[prev.currentPlayerIndex] = {
            ...currentPlayer,
            position: newPosition,
            consecutiveDouble: sum
          }
        } else {
          // Move forward on non-doubles
          const targetPosition = currentPlayer.position + sum
          // Must land exactly on 28 to win
          if (targetPosition === 28) {
            newPosition = 28
          } else if (targetPosition > 28) {
            newPosition = currentPlayer.position // Stay in place if would overshoot
          } else {
            newPosition = targetPosition
          }
          
          newPlayers[prev.currentPlayerIndex] = {
            ...currentPlayer,
            position: newPosition,
            consecutiveDouble: null
          }
        }
        
        // Check for winner
        let winner = null
        if (newPosition === 28) {
          winner = currentPlayer.id
        }
        
        return {
          ...prev,
          players: newPlayers,
          dice: [dice1, dice2],
          lastRoll: { dice1, dice2, sum, isDouble },
          winner,
          canSabotage,
          currentPlayerIndex: canSabotage ? prev.currentPlayerIndex : (prev.currentPlayerIndex + 1) % prev.players.length
        }
      })
      
      setIsRolling(false)
    }, 1000)
  }, [isRolling, gameState.gamePhase])

  const executeSabotage = useCallback((targetPlayerId: number) => {
    setGameState(prev => {
      const newPlayers = [...prev.players]
      const targetPlayerIndex = newPlayers.findIndex(p => p.id === targetPlayerId)
      const targetPlayer = newPlayers[targetPlayerIndex]
      const sabotageValue = prev.canSabotage.value
      
      const newPosition = Math.max(0, targetPlayer.position - sabotageValue)
      
      newPlayers[targetPlayerIndex] = {
        ...targetPlayer,
        position: newPosition
      }
      
      return {
        ...prev,
        players: newPlayers,
        canSabotage: null,
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length
      }
    })
  }, [])

  const skipSabotage = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      canSabotage: null,
      currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length
    }))
  }, [])

  const resetGame = useCallback(() => {
    setGameState({
      players: [],
      currentPlayerIndex: 0,
      dice: [1, 1],
      gamePhase: 'setup',
      winner: null,
      lastRoll: null,
      canSabotage: null,
    })
  }, [])

  const boardPositions = getBoardPositions()

  if (gameState.gamePhase === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="flex items-center justify-center mb-4"
              >
                <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full">
                  <Crown className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Doubles Dilemma
              </CardTitle>
              <p className="text-gray-600 mt-2">Race to 28, but beware of doubles!</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="text-center">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Number of Players
                  </label>
                  <div className="flex gap-2 justify-center">
                    {[2, 3, 4].map((count) => (
                      <Button
                        key={count}
                        variant={playerCount === count ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPlayerCount(count)}
                        className="w-12 h-12"
                      >
                        {count}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Players
                  </h3>
                  <div className="grid gap-2">
                    {Array.from({ length: playerCount }, (_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <div className={`w-4 h-4 rounded-full ${PLAYER_COLORS[i].color}`} />
                        <span className="font-medium">{PLAYER_COLORS[i].name} Player</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                onClick={startGame}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-3"
              >
                Start Game
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Game Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Doubles Dilemma
          </h1>
          <p className="text-gray-600">Follow the diagonal path: 🟢→1-4→↘️5-8→↗️9-12→↓13-16→↖️17-20→↙️21-24→↖️25-28🔴</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl bg-white/90 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-2 border-purple-200 p-4" style={{ height: '750px' }}>
                  <svg width="100%" height="100%" viewBox="0 0 1100 750" className="overflow-visible">
                    {/* Draw path lines between positions */}
                    {boardPositions.slice(0, -1).map((pos, index) => {
                      const nextPos = boardPositions[index + 1]
                      return (
                        <line
                          key={`line-${pos.id}`}
                          x1={pos.x}
                          y1={pos.y}
                          x2={nextPos.x}
                          y2={nextPos.y}
                          stroke="#9333ea"
                          strokeWidth="3"
                          strokeOpacity="0.6"
                          strokeDasharray="5,5"
                        />
                      )
                    })}
                    
                    {/* Render board positions */}
                    {boardPositions.map((pos) => (
                      <g key={pos.id}>
                        {/* Board square */}
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r="28"
                          fill={pos.id === 0 ? '#22c55e' : pos.id === 28 ? '#ef4444' : '#f8fafc'}
                          stroke={pos.id === 0 ? '#16a34a' : pos.id === 28 ? '#dc2626' : '#9333ea'}
                          strokeWidth="3"
                          className="drop-shadow-md"
                        />
                        {/* Position label */}
                        <text
                          x={pos.x}
                          y={pos.y + 6}
                          textAnchor="middle"
                          className="text-sm font-bold"
                          fill={pos.id === 0 || pos.id === 28 ? '#ffffff' : '#374151'}
                          fontSize="16"
                          fontFamily="Inter, sans-serif"
                        >
                          {pos.label}
                        </text>
                        {/* Players on this position */}
                        {gameState.players
                          .filter(player => player.position === pos.id)
                          .map((player, index) => (
                            <circle
                              key={player.id}
                              cx={pos.x + (index - (gameState.players.filter(p => p.position === pos.id).length - 1) / 2) * 18}
                              cy={pos.y - 45}
                              r="12"
                              className={player.color}
                              stroke="#ffffff"
                              strokeWidth="3"
                              style={{
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                              }}
                            />
                          ))}
                      </g>
                    ))}
                    
                    {/* Direction arrows and labels */}
                    <defs>
                      <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                       refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#9333ea" opacity="0.7" />
                      </marker>
                    </defs>
                    
                    {/* Path direction labels */}
                    <text x="200" y="50" className="text-sm font-semibold" fill="#9333ea">
                      Start 🟢 → 1-4 (horizontal)
                    </text>
                    <text x="450" y="450" className="text-sm font-semibold" fill="#9333ea">
                      5-8 ↘️
                    </text>
                    <text x="650" y="250" className="text-sm font-semibold" fill="#9333ea">
                      9-12 ↗️
                    </text>
                    <text x="800" y="450" className="text-sm font-semibold" fill="#9333ea">
                      13-16 ↓
                    </text>
                    <text x="650" y="250" className="text-sm font-semibold" fill="#9333ea">
                      17-20 ↖️
                    </text>
                    <text x="350" y="450" className="text-sm font-semibold" fill="#9333ea">
                      21-24 ↙️
                    </text>
                    <text x="150" y="250" className="text-sm font-semibold" fill="#9333ea">
                      25-28 ↖️ → 🔴 End
                    </text>
                  </svg>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Controls */}
          <div className="space-y-4">
            {/* Current Player */}
            <Card className="shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Current Turn
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!gameState.winner && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-6 h-6 rounded-full ${gameState.players[gameState.currentPlayerIndex]?.color}`} />
                    <span className="font-bold text-lg">
                      {gameState.players[gameState.currentPlayerIndex]?.name}
                    </span>
                  </div>
                )}
                
                {gameState.winner && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-center mb-4"
                  >
                    <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
                    <h3 className="text-xl font-bold text-green-600">
                      Player {gameState.winner} Wins!
                    </h3>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Dice */}
            <Card className="shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Dice Roll</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <motion.div
                    animate={isRolling ? { rotate: 360 } : {}}
                    transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
                    className="p-3 bg-white rounded-lg shadow-md border-2"
                  >
                    <DiceIcon value={gameState.dice[0]} />
                  </motion.div>
                  <motion.div
                    animate={isRolling ? { rotate: -360 } : {}}
                    transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
                    className="p-3 bg-white rounded-lg shadow-md border-2"
                  >
                    <DiceIcon value={gameState.dice[1]} />
                  </motion.div>
                </div>
                
                {gameState.lastRoll && (
                  <div className="text-center mb-4">
                    <Badge variant={gameState.lastRoll.isDouble ? "destructive" : "default"} className="text-sm">
                      {gameState.lastRoll.isDouble ? `Double ${gameState.lastRoll.dice1}s!` : `Sum: ${gameState.lastRoll.sum}`}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">
                      {gameState.lastRoll.isDouble ? 'Move backward!' : 'Move forward!'}
                    </p>
                  </div>
                )}
                
                {!gameState.winner && !gameState.canSabotage && (
                  <Button
                    onClick={rollDice}
                    disabled={isRolling}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-500"
                  >
                    {isRolling ? 'Rolling...' : 'Roll Dice'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Sabotage Action */}
            {gameState.canSabotage && (
              <Card className="shadow-lg bg-red-50 border-red-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Sabotage Opportunity!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-600 mb-4">
                    You rolled the same double twice! Choose a player to move back {gameState.canSabotage.value} spaces.
                  </p>
                  <div className="space-y-2">
                    {gameState.players
                      .filter(p => p.id !== gameState.canSabotage.playerId)
                      .map(player => (
                        <Button
                          key={player.id}
                          onClick={() => executeSabotage(player.id)}
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <div className={`w-4 h-4 rounded-full ${player.color} mr-2`} />
                          Sabotage {player.name}
                        </Button>
                      ))}
                    <Button
                      onClick={skipSabotage}
                      variant="ghost"
                      className="w-full text-gray-600"
                    >
                      Skip Sabotage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Player Positions */}
            <Card className="shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Player Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gameState.players.map(player => (
                    <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${player.color}`} />
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <Badge variant="outline">
                        Position: {player.position === 0 ? 'Start' : player.position}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Game Actions */}
            <div className="space-y-2">
              <Button
                onClick={resetGame}
                variant="outline"
                className="w-full"
              >
                New Game
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App