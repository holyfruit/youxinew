import Game from '@/components/game/Game';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8 md:p-12 lg:p-24">
      <div className="w-full max-w-6xl text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary font-headline">
          火柴人冠军
        </h1>
        <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
          使用方向键或 WASD 移动，空格键跳跃，'J' 键攻击。击败所有敌人以获胜！
        </p>
      </div>
      <Game />
    </main>
  );
}
