/**
 * gameBalance.js — 「ゲームバランス」として明示している調整可能な設定値の解決。
 * 科学的根拠ページで「調整可能な設定値です」と説明している値は、実際に
 * 「その他」→「詳細設定（ゲームバランス）」から変更できるようにするための仕組み。
 * ユーザーが変更していない値は、CONFIGのデフォルト値がそのまま使われる。
 */
const GameBalance = {
  defaults() {
    const habitW = CONFIG.HABIT.WEIGHTS;
    return {
      cardioStimulusToBpt: CONFIG.CARDIO.STIMULUS_TO_BPT,
      frequencyBonusCap: CONFIG.CARDIO.FREQUENCY_BONUS_CAP,
      strengthStimulusToBpt: CONFIG.STRENGTH.STIMULUS_TO_BPT,
      muscleGroupCoefficients: Object.fromEntries(
        EXERCISES.strength.map(e => [e.id, e.groupCoefficient != null ? e.groupCoefficient : 1.0])
      ),
      habitWeights: {
        cardioAchievement: Math.round(habitW.cardioAchievement * 100),
        strengthAchievement: Math.round(habitW.strengthAchievement * 100),
        consistency: Math.round(habitW.consistency * 100),
        exerciseDays: Math.round(habitW.exerciseDays * 100),
      },
      weeklyCardioMinutesGoal: CONFIG.HABIT.WEEKLY_CARDIO_MINUTES_GOAL,
      weeklyStrengthDaysGoal: CONFIG.HABIT.WEEKLY_STRENGTH_DAYS_GOAL,
      consistencyMaxWeeks: CONFIG.HABIT.CONSISTENCY_MAX_WEEKS,
    };
  },

  // 保存済みの上書き値とデフォルト値をマージした「現在有効な値」を返す
  current() {
    const stored = Storage.getGameBalanceSettings();
    const d = this.defaults();
    return {
      cardioStimulusToBpt: stored.cardioStimulusToBpt ?? d.cardioStimulusToBpt,
      frequencyBonusCap: stored.frequencyBonusCap ?? d.frequencyBonusCap,
      strengthStimulusToBpt: stored.strengthStimulusToBpt ?? d.strengthStimulusToBpt,
      muscleGroupCoefficients: { ...d.muscleGroupCoefficients, ...(stored.muscleGroupCoefficients || {}) },
      habitWeights: { ...d.habitWeights, ...(stored.habitWeights || {}) },
      weeklyCardioMinutesGoal: stored.weeklyCardioMinutesGoal ?? d.weeklyCardioMinutesGoal,
      weeklyStrengthDaysGoal: stored.weeklyStrengthDaysGoal ?? d.weeklyStrengthDaysGoal,
      consistencyMaxWeeks: stored.consistencyMaxWeeks ?? d.consistencyMaxWeeks,
    };
  },

  save(settings) {
    Storage.setGameBalanceSettings(settings);
  },

  resetToDefaults() {
    Storage.setGameBalanceSettings({});
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = GameBalance;
}
