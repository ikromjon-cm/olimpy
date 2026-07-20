'use client';

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Main ambient glow - center */}
      <div
        className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[80vw] h-[40vw] max-w-[1400px] max-h-[600px] 
                    bg-gradient-to-r from-primary-500/10 via-secondary-500/8 to-purple-500/10 
                    rounded-full blur-[120px] animate-pulse-soft opacity-60"
      />
      {/* Top-right warm glow */}
      <div
        className="absolute -top-[20%] -right-[15%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] 
                    bg-gradient-to-br from-primary-500/12 via-purple-500/8 to-transparent 
                    rounded-full blur-[150px] animate-float opacity-50"
      />
      {/* Bottom-left cool glow */}
      <div
        className="absolute -bottom-[20%] -left-[15%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] 
                    bg-gradient-to-tr from-secondary-500/12 via-cyan-500/8 to-transparent 
                    rounded-full blur-[150px] animate-float opacity-50"
        style={{ animationDelay: '-3s' }}
      />
      {/* Subtle back glow */}
      <div
        className="absolute top-[60%] right-[10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] 
                    bg-gradient-to-bl from-pink-500/6 via-primary-500/6 to-transparent 
                    rounded-full blur-[160px] animate-pulse-soft opacity-40"
        style={{ animationDelay: '-5s' }}
      />
      {/* Additional subtle gradients for depth */}
      <div
        className="absolute top-[30%] left-[5%] w-[30vw] h-[30vw] max-w-[500px] max-h-[500px] 
                    bg-gradient-to-tr from-amber-500/6 via-orange-500/4 to-transparent 
                    rounded-full blur-[120px] animate-float opacity-40"
        style={{ animationDelay: '-7s' }}
      />
    </div>
  );
}
