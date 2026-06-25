// slide-06.js — 섹션 디바이더: 실험 설계
const pptxgen = require("pptxgenjs");

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.primary };

  slide.addText("2부", {
    x: 0.5, y: 1.5, w: 9, h: 0.8,
    fontSize: 36, fontFace: "Microsoft YaHei",
    color: theme.light, align: "center", italic: true,
  });

  slide.addText("실험으로 알아보기", {
    x: 0.5, y: 2.5, w: 9, h: 1.5,
    fontSize: 56, fontFace: "Microsoft YaHei",
    color: "FFFFFF", bold: true, align: "center",
  });

  slide.addShape(pres.shapes.LINE, {
    x: 3.5, y: 4.2, w: 3, h: 0,
    line: { color: theme.accent, width: 2 },
  });
  slide.addText("빛이 있을 때와 없을 때, 식물은 어떻게 다를까?", {
    x: 0.5, y: 4.4, w: 9, h: 0.5,
    fontSize: 18, fontFace: "Microsoft YaHei",
    color: theme.light, align: "center", italic: true,
  });

  return slide;
}

module.exports = { createSlide };