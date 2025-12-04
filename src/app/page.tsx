import Game from '@/components/game/Game';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8 md:p-12 lg:p-24">
      <div className="w-full max-w-6xl text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary font-headline">
          Stickman Champion
        </h1>
        <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
          Use Arrow Keys or WASD to move, Space to jump, and 'J' to attack. Defeat all enemies to win!
        </p>
      </div>
      <Game />
    </main>
  );
}
