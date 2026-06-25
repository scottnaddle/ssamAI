// compile.js — 16장 슬라이드를 합쳐 최종 PPTX 생성 (v2 - 개선판)
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";

const theme = {
  primary: "2d5e3e",
  secondary: "5a8c4a",
  accent: "a8d49a",
  light: "e8f4e0",
  bg: "fafdf7",
};

pres.title = "광합성이란? - 초등 3학년";
pres.subject = "초등 과학 3학년 2학기 - 식물의 세계 (2/5)";
pres.author = "ssamAI 샘플 v2";

for (let i = 1; i <= 16; i++) {
  const num = String(i).padStart(2, "0");
  const mod = require(`./slide-${num}.js`);
  mod.createSlide(pres, theme);
}

pres
  .writeFile({ fileName: "./output/광합성_실험_2026_v2.pptx" })
  .then((fn) => console.log(`✓ v2 생성 완료: ${fn}`));