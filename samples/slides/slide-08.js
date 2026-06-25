// slide-07.js — 실험 설계 1: 가설
const pptxgen = require("pptxgenjs");

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("실험 가설 세우기", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: 0.95, w: 9, h: 0,
    line: { color: theme.accent, width: 2 },
  });

  // 가설 박스
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 1, y: 1.4, w: 8, h: 1.4,
    fill: { color: theme.light },
    line: { color: theme.primary, width: 2 },
    rectRadius: 0.15,
  });
  slide.addText("가설", {
    x: 1.2, y: 1.5, w: 7.6, h: 0.4,
    fontSize: 18, fontFace: "Microsoft YaHei",
    color: theme.secondary, bold: true,
  });
  slide.addText("빛이 있는 곳에서 키운 식물은\n빛이 없는 곳에서 키운 식물보다 잘 자랄 것이다.", {
    x: 1.2, y: 1.9, w: 7.6, h: 0.9,
    fontSize: 18, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true, align: "center",
  });

  // 실험 재료
  slide.addText("준비물", {
    x: 0.5, y: 3.1, w: 4, h: 0.4,
    fontSize: 18, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addText([
    { text: "물에 적신 콩나물 20개", options: { bullet: true, breakLine: true } },
    { text: "두 개의 투명한 컵", options: { bullet: true, breakLine: true } },
    { text: "물", options: { bullet: true } },
  ], {
    x: 0.8, y: 3.5, w: 4, h: 1.5,
    fontSize: 15, fontFace: "Microsoft YaHei",
    color: theme.secondary, paraSpaceAfter: 4,
  });

  // 실험 조건
  slide.addText("실험 조건", {
    x: 5.2, y: 3.1, w: 4, h: 0.4,
    fontSize: 18, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addText([
    { text: "A 컵: 밝은 곳에 둠", options: { bullet: true, breakLine: true } },
    { text: "B 컵: 어두운 상자 안", options: { bullet: true, breakLine: true } },
    { text: "매일 관찰, 기록", options: { bullet: true } },
  ], {
    x: 5.5, y: 3.5, w: 4, h: 1.5,
    fontSize: 15, fontFace: "Microsoft YaHei",
    color: theme.secondary, paraSpaceAfter: 4,
  });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent } });
  slide.addText("07", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 11, color: "FFFFFF", bold: true, align: "center", valign: "middle" });

  return slide;
}

module.exports = { createSlide };