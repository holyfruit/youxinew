"use client";

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Rocket, Shield, Star } from 'lucide-react';

// 游戏常量
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 80;
const PLAYER_HEIGHT = 50;
const PLAYER_SPEED = 7;
const BULLET_SPEED = 10;
const BULLET_WIDTH = 5;
const BULLET_HEIGHT = 15;
const ENEMY_SPEED = 2;
const ENEMY_SPAWN_RATE = 40;
const BULLET_FIRE_RATE = 10; // 每 10 帧发射一颗子弹

// 游戏对象接口
interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Player extends GameObject {
  lives: number;
}

interface Bullet extends GameObject {}

interface Enemy extends GameObject {
  speed: number;
  color: string;
}

// 初始游戏状态
const initialPlayerState: Player = {
  x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
  y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  lives: 3,
};

const ENEMY_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');
  const [isDragging, setIsDragging] = useState(false);

  const playerRef = useRef<Player>({ ...initialPlayerState });
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const frameCountRef = useRef(0);

  const shoot = useCallback(() => {
    if (gameState !== 'playing') return;
    const player = playerRef.current;
    bulletsRef.current.push({
      x: player.x + player.width / 2 - BULLET_WIDTH / 2,
      y: player.y,
      width: BULLET_WIDTH,
      height: BULLET_HEIGHT,
    });
  }, [gameState]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key.toLowerCase()] = true;
    if (e.key === ' ' && gameState === 'playing') {
      e.preventDefault();
      shoot();
    }
  }, [gameState, shoot]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key.toLowerCase()] = false;
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 触摸事件 (手机)
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const touchX = (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const touchY = (touch.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
      const player = playerRef.current;

      if (
        touchX > player.x &&
        touchX < player.x + player.width &&
        touchY > player.y &&
        touchY < player.y + player.height
      ) {
        setIsDragging(true);
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (!isDragging || gameState !== 'playing') return;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const touchX = (touch.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
        playerRef.current.x = touchX - playerRef.current.width / 2;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    // 鼠标事件 (电脑)
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const mouseY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
      const player = playerRef.current;
      if (
        mouseX > player.x &&
        mouseX < player.x + player.width &&
        mouseY > player.y &&
        mouseY < player.y + player.height
      ) {
        setIsDragging(true);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || gameState !== 'playing') return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      playerRef.current.x = mouseX - playerRef.current.width / 2;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    const handleMouseLeave = () => {
        setIsDragging(false);
    };


    // 添加触摸事件监听
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);
    
    // 添加鼠标事件监听
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);


    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (canvas) {
        // 移除触摸事件监听
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
        canvas.removeEventListener('touchcancel', handleTouchEnd);
        // 移除鼠标事件监听
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [handleKeyDown, handleKeyUp, gameState, isDragging]);


  const resetGame = () => {
    playerRef.current = { ...initialPlayerState };
    bulletsRef.current = [];
    enemiesRef.current = [];
    setScore(0);
    setGameState('playing');
    frameCountRef.current = 0;
    setIsDragging(false);
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player) => {
    // 绘制更逼真的飞机
    // 机身
    ctx.fillStyle = '#C0C0C0'; // 银色
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y); // 机头
    ctx.lineTo(player.x, player.y + player.height * 0.8); // 左后方
    ctx.lineTo(player.x + player.width, player.y + player.height * 0.8); // 右后方
    ctx.closePath();
    ctx.fill();

    // 机翼
    ctx.fillStyle = '#A9A9A9'; // 深灰色
    ctx.fillRect(player.x - 10, player.y + player.height * 0.5, player.width + 20, 10);

    // 驾驶舱
    ctx.fillStyle = '#87CEEB'; // 天蓝色
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height * 0.3, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // 尾翼
    ctx.fillStyle = '#A9A9A9';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2 - 5, player.y + player.height * 0.8);
    ctx.lineTo(player.x + player.width / 2 + 5, player.y + player.height * 0.8);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height);
    ctx.closePath();
    ctx.fill();
  };
  
  const drawBullet = (ctx: CanvasRenderingContext2D, bullet: Bullet) => {
    ctx.fillStyle = 'hsl(var(--accent))';
    ctx.shadowColor = 'hsl(var(--accent))';
    ctx.shadowBlur = 10;
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    ctx.shadowBlur = 0; // 重置阴影
  };
  
  const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  };

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    frameCountRef.current++;

    // 清空画布
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 玩家移动 (键盘)
    const player = playerRef.current;
    if (keysRef.current['arrowleft'] || keysRef.current['a']) {
      player.x -= PLAYER_SPEED;
    }
    if (keysRef.current['arrowright'] || keysRef.current['d']) {
      player.x += PLAYER_SPEED;
    }
    
    // 触摸或鼠标拖动时自动开火
    if (isDragging && frameCountRef.current % BULLET_FIRE_RATE === 0) {
      shoot();
    }


    // 保持玩家在边界内
    if (player.x < 10) player.x = 10;
    if (player.x + player.width > CANVAS_WIDTH - 10) player.x = CANVAS_WIDTH - player.width - 10;
    
    // 移动和绘制子弹
    bulletsRef.current.forEach((bullet, index) => {
      bullet.y -= BULLET_SPEED;
      if (bullet.y < 0) {
        bulletsRef.current.splice(index, 1);
      }
      drawBullet(ctx, bullet);
    });

    // 生成敌人
    if (frameCountRef.current % ENEMY_SPAWN_RATE === 0) {
      const enemyWidth = Math.random() * 40 + 20;
      const enemyHeight = Math.random() * 40 + 20;
      enemiesRef.current.push({
        x: Math.random() * (CANVAS_WIDTH - enemyWidth),
        y: -enemyHeight,
        width: enemyWidth,
        height: enemyHeight,
        speed: Math.random() * 2 + ENEMY_SPEED,
        color: ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)]
      });
    }

    // 移动和绘制敌人 & 碰撞检测
    enemiesRef.current.forEach((enemy, enemyIndex) => {
      enemy.y += enemy.speed;
      if (enemy.y > CANVAS_HEIGHT) {
        enemiesRef.current.splice(enemyIndex, 1);
      }
      drawEnemy(ctx, enemy);

      // 子弹与敌人碰撞
      bulletsRef.current.forEach((bullet, bulletIndex) => {
        if (
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        ) {
          // 使用 try-catch 避免在快速循环中因 splice 导致引用错误
          try {
            enemiesRef.current.splice(enemyIndex, 1);
            bulletsRef.current.splice(bulletIndex, 1);
            setScore(s => s + 10);
          } catch(e) {
            console.error(e);
          }
        }
      });
      
      // 敌人与玩家碰撞
      if (
        player.x < enemy.x + enemy.width &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.height > enemy.y
      ) {
        // 使用 try-catch 避免在快速循环中因 splice 导致引用错误
        try {
            enemiesRef.current.splice(enemyIndex, 1);
            player.lives--;
            if (player.lives <= 0) {
              setGameState('gameover');
            }
        } catch(e) {
            console.error(e);
        }
      }
    });

    // 绘制玩家
    drawPlayer(ctx, player);

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, isDragging, shoot]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);


  return (
    <div className="flex flex-col items-center gap-4 mt-8 w-full max-w-[1000px]">
      <div className="w-full bg-card border-4 border-primary rounded-lg shadow-2xl p-2">
        <div className="flex justify-between items-center mb-2 px-4 text-primary">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Star className="text-accent"/>
            分数: {score}
          </div>
          <div className="flex items-center gap-2 font-bold text-xl">
             <Shield className="text-accent" />
             生命: {playerRef.current.lives}
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-md bg-gray-800 w-full cursor-move"
        />
      </div>

      <AlertDialog open={gameState === 'gameover'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>游戏结束！</AlertDialogTitle>
            <AlertDialogDescription>
              你的最终得分是: {score}。想再试一次吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction asChild>
                <Button onClick={resetGame}><Rocket className="mr-2"/>再玩一次</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
