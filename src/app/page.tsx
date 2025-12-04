import Game from '@/components/game/Game';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-background p-4 pt-12 sm:p-8 sm:pt-16">
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary font-headline">
          飞机大战
        </h1>
        <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
          PC端: 使用方向键或 WASD 移动，按空格键射击，或者用鼠标拖动飞机。手机端: 手指在屏幕上拖动飞机来移动和自动射击。
        </p>
      </div>
      <Game />
    </main>
  );
}
