// slide-12.js — 섹션 디바이더: 정리 & 토론
const pptxgen = require("pptxgenjs");

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.primary };

  slide.addText("4부", {
    x: 0.5, y: 1.5, w: 9, h: 0.8,
    fontSize: 36, fontFace: "Microsoft YaHei",
    color: theme.light, align: "center", italic: true,
  });

  slide.addText("정리 & 심화 토론", {
    x: 0.5, y: 2.5, w: 9, h: 1.5,
    fontSize: 54, fontFace: "Microsoft YaHei",
    color: "FFFFFF", bold: true, align: "center",
  });

  slide.addShape(pres.shapes.LINE, {
    x: 3.5, y: 4.2, w: 3, h: 0,
    line: { color: theme.accent, width: 2 },
  });
  slide.addText("오늘 배운 내용을 일상생활과 연결해 봅시다.", {
    x: 0.5, y: 4.4, w: 9, h: 0.5,
    fontSize: 18, fontFace: "Microsoft YaHei",
    color: theme.light, align: "center", italic: true,
  });

  return slide;
}

module.exports = { createSlide };