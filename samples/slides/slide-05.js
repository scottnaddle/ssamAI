// slide-04.js — 광합성 개념 2 (필요한 것 & 나오는 것)
const pptxgen = require("pptxgenjs");

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("광합성에 필요한 것과 나오는 것", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 26, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: 0.95, w: 9, h: 0,
    line: { color: theme.accent, width: 2 },
  });

  // 왼쪽: 들어오는 것
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 1.4, w: 4.2, h: 3.5,
    fill: { color: "FFFFFF" },
    line: { color: theme.secondary, width: 2 },
    rectRadius: 0.15,
  });
  slide.addText("들어오는 것", {
    x: 0.5, y: 1.5, w: 4.2, h: 0.5,
    fontSize: 20, fontFace: "Microsoft YaHei",
    color: theme.secondary, bold: true, align: "center",
  });
  slide.addText([
    { text: "빛 (햇빛)", options: { bullet: true, breakLine: true, fontSize: 18 } },
    { text: "이산화탄소", options: { bullet: true, breakLine: true, fontSize: 18 } },
    { text: "물", options: { bullet: true, breakLine: true, fontSize: 18 } },
    { text: "엽록소", options: { bullet: true, fontSize: 18 } },
  ], {
    x: 0.8, y: 2.1, w: 3.8, h: 2.6,
    fontFace: "Microsoft YaHei",
    color: theme.primary, paraSpaceAfter: 8,
  });

  // 오른쪽: 나오는 것
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.3, y: 1.4, w: 4.2, h: 3.5,
    fill: { color: theme.light },
    line: { color: theme.primary, width: 2 },
    rectRadius: 0.15,
  });
  slide.addText("나오는 것", {
    x: 5.3, y: 1.5, w: 4.2, h: 0.5,
    fontSize: 20, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true, align: "center",
  });
  slide.addText([
    { text: "양분 (포도당)", options: { bullet: true, breakLine: true, fontSize: 18 } },
    { text: "산소", options: { bullet: true, fontSize: 18 } },
  ], {
    x: 5.6, y: 2.1, w: 3.8, h: 2.6,
    fontFace: "Microsoft YaHei",
    color: theme.primary, paraSpaceAfter: 8,
  });

  // 화살표
  slide.addShape(pres.shapes.RIGHT_ARROW, {
    x: 4.7, y: 2.85, w: 0.6, h: 0.5,
    fill: { color: theme.accent },
  });

  slide.addText("식물의 잎에서 이 과정이 일어납니다.", {
    x: 0.5, y: 5.05, w: 9, h: 0.4,
    fontSize: 14, fontFace: "Microsoft YaHei",
    color: theme.secondary, align: "center", italic: true,
  });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent } });
  slide.addText("04", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 11, color: "FFFFFF", bold: true, align: "center", valign: "middle" });

  return slide;
}

module.exports = { createSlide };