/**
 * bmiCalculator.js — BMI（体格指数）の計算と、日本肥満学会の判定基準による分類。
 * [SCIENCE] BMI = 体重(kg) ÷ 身長(m)の2乗。標準体重はBMI=22を基準とする。
 */
const BmiCalculator = {
  calculate(weightKg, heightCm) {
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  },

  /** 指定した身長における「標準体重」（BMI=22となる体重） */
  idealWeight(heightCm, targetBmi = 22) {
    const heightM = heightCm / 100;
    return targetBmi * heightM * heightM;
  },

  /** 日本肥満学会の判定基準による分類 */
  category(bmi) {
    if (bmi < 18.5) return { label: "低体重", color: "#6E8FAE" };
    if (bmi < 25) return { label: "普通体重", color: "#8FA678" };
    if (bmi < 30) return { label: "肥満（1度）", color: "#C9A15A" };
    if (bmi < 35) return { label: "肥満（2度）", color: "#B5493C" };
    if (bmi < 40) return { label: "肥満（3度）", color: "#9C3B2F" };
    return { label: "肥満（4度）", color: "#7A2E24" };
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = BmiCalculator;
}
