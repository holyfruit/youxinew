"use client";

import { useRef, useEffect, useState, useCallback } from 'react';
import { getEnemyBehaviorAction, getVictoryMessageAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Heart, Swords } from 'lucide-react';

// Game constants
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.6;
const PLAYER_SPEED = 5;
const PLAYER_JUMP = -15;
const PLAYER_HEALTH = 100;
const ENEMY_HEALTH = 50;
const ATTACK_WIDTH = 60;
const ATTACK_HEIGHT = 60;
const ATTACK_DURATION = 15; // in frames
const AI_UPDATE_INTERVAL = 120; // in frames (2 seconds at 60fps)

// Interfaces for game objects
interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
}

interface Character extends GameObject {
  health: number;
  maxHealth: number;
  isJumping: boolean;
  isOnGround: boolean;
  attackTimer: number;
  attackBox: { x: number; y: number; width: number; height: number } | null;
  isAttacking: boolean;
  facing: 'left' | 'right';
  isHit: number; // timer for hit flash
}

interface Player extends Character {}

interface Enemy extends Character {
  behavior: 'patrol' | 'chase' | 'attack' | 'defend';
  patrolRange: { start: number; end: number };
  aiUpdateTimer: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Initial game state
const initialPlayerState: Player = {
  x: 100,
  y: 400,
  width: 40,
  height: 80,
  vx: 0,
  vy: 0,
  health: PLAYER_HEALTH,
  maxHealth: PLAYER_HEALTH,
  isJumping: false,
  isOnGround: false,
  attackTimer: 0,
  attackBox: null,
  isAttacking: false,
  facing: 'right',
  isHit: 0,
};

const initialEnemies: Enemy[] = [
  {
    x: 700, y: 400, width: 40, height: 80, vx: 1, vy: 0, health: ENEMY_HEALTH, maxHealth: ENEMY_HEALTH, isJumping: false, isOnGround: false, attackTimer: 0, attackBox: null, isAttacking: false, facing: 'left', behavior: 'patrol', patrolRange: { start: 600, end: 850 }, aiUpdateTimer: 0, isHit: 0,
  },
  {
    x: 400, y: 200, width: 40, height: 80, vx: 1, vy: 0, health: ENEMY_HEALTH, maxHealth: ENEMY_HEALTH, isJumping: false, isOnGround: false, attackTimer: 0, attackBox: null, isAttacking: false, facing: 'left', behavior: 'patrol', patrolRange: { start: 350, end: 550 }, aiUpdateTimer: 60, isHit: 0,
  },
];

const platforms: Platform[] = [
  { x: 0, y: 550, width: CANVAS_WIDTH, height: 50 }, // Ground
  { x: 300, y: 400, width: 300, height: 20 },
  { x: 100, y: 300, width: 150, height: 20 },
  { x: 650, y: 250, width: 200, height: 20 },
];

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<{ [key: string]: boolean }>({});

  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'victory' | 'defeat'>('playing');
  const [victoryMessage, setVictoryMessage] = useState('');

  const playerRef = useRef<Player>({ ...initialPlayerState });
  const enemiesRef = useRef<Enemy[]>(initialEnemies.map(e => ({...e})));

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key.toLowerCase()] = true;
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key.toLowerCase()] = false;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
  
  const resetGame = () => {
    playerRef.current = { ...initialPlayerState };
    enemiesRef.current = initialEnemies.map(e => ({...e}));
    setScore(0);
    setGameState('playing');
    setVictoryMessage('');
  };


  const drawCharacter = (ctx: CanvasRenderingContext2D, char: Character, color: string) => {
    if (char.isHit > 0) {
      ctx.fillStyle = '#FF4500'; // Accent color for hit flash
    } else {
      ctx.fillStyle = color;
    }
    // Body
    ctx.fillRect(char.x, char.y, char.width, char.height);
    // Head
    ctx.beginPath();
    ctx.arc(char.x + char.width / 2, char.y - 10, char.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Health bar
    if (char.health < char.maxHealth) {
      ctx.fillStyle = '#555';
      ctx.fillRect(char.x, char.y - 30, char.width, 5);
      ctx.fillStyle = '#FF4500'; // Accent color
      ctx.fillRect(char.x, char.y - 30, char.width * (char.health / char.maxHealth), 5);
    }

    if (char.isAttacking && char.attackBox) {
      ctx.fillStyle = 'rgba(255, 69, 0, 0.5)';
      ctx.fillRect(char.attackBox.x, char.attackBox.y, char.attackBox.width, char.attackBox.height);
    }
  };

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#F0F0F0'; // Light gray background
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const darkGray = '#333333';
    
    // Draw platforms
    ctx.fillStyle = darkGray;
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

    const player = playerRef.current;
    const enemies = enemiesRef.current;

    // Update and draw player
    player.vx = 0;
    if (keysRef.current['arrowleft'] || keysRef.current['a']) {
      player.vx = -PLAYER_SPEED;
      player.facing = 'left';
    }
    if (keysRef.current['arrowright'] || keysRef.current['d']) {
      player.vx = PLAYER_SPEED;
      player.facing = 'right';
    }
    if ((keysRef.current[' '] || keysRef.current['arrowup'] || keysRef.current['w']) && player.isOnGround) {
      player.vy = PLAYER_JUMP;
      player.isJumping = true;
      player.isOnGround = false;
    }
    if ((keysRef.current['j']) && !player.isAttacking) {
      player.isAttacking = true;
      player.attackTimer = ATTACK_DURATION;
    }
    
    // Physics for player
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;
    player.isOnGround = false;

    // Platform collision for player
    platforms.forEach(p => {
      if (player.x < p.x + p.width && player.x + player.width > p.x && player.y + player.height > p.y && player.y + player.height < p.y + p.height + player.vy) {
        player.y = p.y - player.height;
        player.vy = 0;
        player.isOnGround = true;
        player.isJumping = false;
      }
    });

    // World bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > CANVAS_WIDTH) player.x = CANVAS_WIDTH - player.width;
    if (player.y > CANVAS_HEIGHT) { // Player fell off
        player.health = 0;
    }

    // Player attack logic
    if (player.isAttacking) {
      if (player.attackTimer > 0) {
        const attackX = player.facing === 'right' ? player.x + player.width : player.x - ATTACK_WIDTH;
        player.attackBox = { x: attackX, y: player.y, width: ATTACK_WIDTH, height: ATTACK_HEIGHT };
        player.attackTimer--;

        enemies.forEach(enemy => {
          if (enemy.health > 0 && player.attackBox &&
              player.attackBox.x < enemy.x + enemy.width &&
              player.attackBox.x + player.attackBox.width > enemy.x &&
              player.attackBox.y < enemy.y + enemy.height &&
              player.attackBox.y + player.attackBox.height > enemy.y) {
            if (!enemy.isHit) {
              enemy.health -= 25;
              enemy.isHit = 10;
              if (enemy.health <= 0) {
                setScore(s => s + 100);
              }
            }
          }
        });
      } else {
        player.isAttacking = false;
        player.attackBox = null;
      }
    }
    
    if (player.isHit > 0) player.isHit--;

    // Update and draw enemies
    enemies.forEach(enemy => {
        if(enemy.health <= 0) return;
        // AI Update
        if (enemy.aiUpdateTimer <= 0) {
            enemy.aiUpdateTimer = AI_UPDATE_INTERVAL;
            const playerProximity = Math.abs(player.x - enemy.x) < 200 ? 'close' : Math.abs(player.x - enemy.x) < 500 ? 'medium' : 'far';
            getEnemyBehaviorAction({
                playerProximity: playerProximity,
                playerAction: player.isAttacking ? 'attacking' : (player.vx !== 0 ? 'moving' : 'idle'),
                enemyHealth: enemy.health,
            }).then(res => {
                enemy.behavior = res.behavior as Enemy['behavior'];
            });
        } else {
            enemy.aiUpdateTimer--;
        }

        // Behavior logic
        switch (enemy.behavior) {
            case 'patrol':
                if (enemy.x <= enemy.patrolRange.start) enemy.vx = 1;
                if (enemy.x >= enemy.patrolRange.end) enemy.vx = -1;
                break;
            case 'chase':
                enemy.vx = player.x < enemy.x ? -2 : 2;
                break;
            case 'attack':
                enemy.vx = 0;
                if (!enemy.isAttacking && Math.abs(player.x - enemy.x) < 80) {
                    enemy.isAttacking = true;
                    enemy.attackTimer = ATTACK_DURATION;
                }
                break;
            case 'defend':
                enemy.vx = 0;
                break;
        }
        enemy.facing = enemy.vx > 0 ? 'right' : 'left';
        
        // Enemy physics
        enemy.vy += GRAVITY;
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        enemy.isOnGround = false;

        platforms.forEach(p => {
            if (enemy.x < p.x + p.width && enemy.x + enemy.width > p.x && enemy.y + enemy.height > p.y && enemy.y + enemy.height < p.y + p.height + enemy.vy) {
                enemy.y = p.y - enemy.height;
                enemy.vy = 0;
                enemy.isOnGround = true;
            }
        });
        
        // Enemy attack logic
        if (enemy.isAttacking) {
            if (enemy.attackTimer > 0) {
                const attackX = enemy.facing === 'right' ? enemy.x + enemy.width : enemy.x - ATTACK_WIDTH;
                enemy.attackBox = { x: attackX, y: enemy.y, width: ATTACK_WIDTH, height: ATTACK_HEIGHT };
                enemy.attackTimer--;

                if (player.health > 0 && enemy.attackBox &&
                    enemy.attackBox.x < player.x + player.width &&
                    enemy.attackBox.x + enemy.attackBox.width > player.x &&
                    enemy.attackBox.y < player.y + player.height &&
                    enemy.attackBox.y + enemy.attackBox.height > player.y) {
                  if (!player.isHit) {
                    player.health -= 10;
                    player.isHit = 10;
                  }
                }
            } else {
                enemy.isAttacking = false;
                enemy.attackBox = null;
            }
        }
        if(enemy.isHit > 0) enemy.isHit--;
        drawCharacter(ctx, enemy, darkGray);
    });

    // Draw player last to be on top
    drawCharacter(ctx, player, darkGray);

    // Check game state
    if (player.health <= 0) {
        setGameState('defeat');
    } else if (enemies.every(e => e.health <= 0)) {
        setGameState('victory');
        getVictoryMessageAction({ playerName: 'Chen Zhiyan' }).then(res => {
            setVictoryMessage(res.message);
        });
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <div className="w-full max-w-[1000px] bg-card border rounded-lg shadow-lg p-2">
        <div className="flex justify-between items-center mb-2 px-2">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Heart className="text-accent" />
                <Progress value={playerRef.current.health} className="w-40 h-3" />
              </div>
              <div className="font-bold text-lg">分数: {score}</div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Swords size={16} /> 剩余敌人: {enemiesRef.current.filter(e => e.health > 0).length}
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-md"
        />
      </div>

      <AlertDialog open={gameState === 'victory' || gameState === 'defeat'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{gameState === 'victory' ? '胜利!' : '失败!'}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {gameState === 'victory' ? (
                  <>
                    <p className="text-lg mb-4">你的最终分数: {score}</p>
                    <p className="text-accent font-semibold">{victoryMessage || '正在生成您的个性化消息...'}</p>
                  </>
                ) : '你被击败了。祝你下次好运！'}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction asChild>
                <Button onClick={resetGame}>再玩一次</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
