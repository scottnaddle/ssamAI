// slide-01.js — 표지 (Cover)
const pptxgen = require("pptxgenjs");

const slideConfig = {
  type: "cover",
  index: 1,
  title: "광합성이란?",
};

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // 상단 장식 띠
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.6,
    fill: { color: theme.primary },
  });

  // 학년/학기 정보
  slide.addText("초등 과학 3학년 2학기 · 4단원", {
    x: 0.5, y: 1.2, w: 9, h: 0.5,
    fontSize: 18, fontFace: "Microsoft YaHei",
    color: theme.secondary, align: "center",
  });

  // 메인 타이틀
  slide.addText("광합성이란?", {
    x: 0.5, y: 2.0, w: 9, h: 1.3,
    fontSize: 60, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true, align: "center",
  });

  // 서브 타이틀
  slide.addText("식물이 어떻게 양분을 만들까요?", {
    x: 0.5, y: 3.4, w: 9, h: 0.6,
    fontSize: 24, fontFace: "Microsoft YaHei",
    color: theme.secondary, italic: true, align: "center",
  });

  // 하단 학급 정보
  slide.addShape(pres.shapes.LINE, {
    x: 3.5, y: 4.5, w: 3, h: 0,
    line: { color: theme.accent, width: 2 },
  });
  slide.addText("3학년 2반 · 과학탐구", {
    x: 0.5, y: 4.7, w: 9, h: 0.4,
    fontSize: 16, fontFace: "Microsoft YaHei",
    color: theme.secondary, align: "center",
  });

  return slide;
}

if (require.main === module) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  const theme = { primary: "2d5e3e", secondary: "5a8c4a", accent: "a8d49a", light: "e8f4e0", bg: "fafdf7" };
  createSlide(pres, theme);
  pres.writeFile({ fileName: "slide-01-preview.pptx" });
}

module.exports = { createSlide, slideConfig };