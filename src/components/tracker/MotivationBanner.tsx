import React from 'react';

type MotivationBannerProps = {
  progressPercent: number;
  currentStreak: number;
};

export default function MotivationBanner({ progressPercent, currentStreak }: MotivationBannerProps) {
  const progressMessage =
    progressPercent >= 75
      ? '🏆 Amazing progress!'
      : progressPercent >= 50
        ? "💪 You're halfway there!"
        : progressPercent >= 25
          ? '🔥 Keep going strong!'
          : '🚀 Every journey begins with a single step!';

  const streakMessage =
    currentStreak >= 8
      ? 'Your consistency is incredible!'
      : currentStreak >= 4
        ? 'Building great habits!'
        : 'Stay consistent and results will follow!';

  return (
    <div className="bg-gradient-to-r from-[#2a2219] via-[#3c2f22] to-[#6e4f2a] text-white p-6 rounded-2xl text-center shadow-xl">
      <p className="text-2xl font-display font-semibold mb-2">{progressMessage}</p>
      <p className="text-lg opacity-90">{streakMessage}</p>
    </div>
  );
}
