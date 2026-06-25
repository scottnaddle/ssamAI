// slide-05.js — 광합성 반응식
const pptxgen = require("pptxgenjs");

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("광합성 반응식", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: 0.95, w: 9, h: 0,
    line: { color: theme.accent, width: 2 },
  });

  // 반응식 박스
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 1.5, w: 9, h: 1.8,
    fill: { color: "FFFFFF" },
    line: { color: theme.primary, width: 2 },
    rectRadius: 0.15,
  });

  slide.addText("이산화탄소 + 물", {
    x: 0.7, y: 1.85, w: 3.3, h: 0.6,
    fontSize: 22, fontFace: "Microsoft YaHei",
    color: theme.secondary, bold: true, align: "center",
  });
  slide.addText("빛", {
    x: 4.0, y: 1.6, w: 1, h: 0.4,
    fontSize: 16, fontFace: "Microsoft YaHei",
    color: theme.accent, align: "center",
  });
  slide.addText("엽록소", {
    x: 4.0, y: 2.0, w: 1, h: 0.4,
    fontSize: 14, fontFace: "Microsoft YaHei",
    color: theme.accent, align: "center",
  });
  slide.addShape(pres.shapes.RIGHT_ARROW, {
    x: 5.0, y: 2.05, w: 0.6, h: 0.5,
    fill: { color: theme.accent },
  });
  slide.addText("포도당 + 산소", {
    x: 5.7, y: 1.85, w: 3.6, h: 0.6,
    fontSize: 22, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true, align: "center",
  });

  slide.addText("CO₂ + H₂O → C₆H₁₂O₆ + O₂", {
    x: 0.5, y: 2.7, w: 9, h: 0.5,
    fontSize: 18, fontFace: "Arial",
    color: theme.secondary, italic: true, align: "center",
  });

  // 도식
  slide.addText("이렇게 기억해요", {
    x: 0.5, y: 3.6, w: 9, h: 0.4,
    fontSize: 18, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addText([
    { text: "식물은 햇빛을 받으면", options: { breakLine: true } },
    { text: "이산화탄소와 물로 양분을 만들어", options: { breakLine: true } },
    { text: "우리에게 필요한 산소를 내어놓아요.", options: {} },
  ], {
    x: 0.8, y: 4.05, w: 8.5, h: 1.0,
    fontSize: 16, fontFace: "Microsoft YaHei",
    color: theme.secondary, align: "center",
  });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent } });
  slide.addText("05", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 11, color: "FFFFFF", bold: true, align: "center", valign: "middle" });

  return slide;
}

module.exports = { createSlide };