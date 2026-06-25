// slide-02.js — 도입 & 탐구 질문
const pptxgen = require("pptxgenjs");

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // 헤더
  slide.addText("도입 · 생각 열기", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: 0.95, w: 9, h: 0,
    line: { color: theme.accent, width: 2 },
  });

  // 탐구 질문 박스
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 1, y: 1.5, w: 8, h: 1.4,
    fill: { color: theme.light },
    line: { color: theme.accent, width: 1 },
    rectRadius: 0.15,
  });
  slide.addText("나무는 어떻게 자라날까요?", {
    x: 1.2, y: 1.65, w: 7.6, h: 0.6,
    fontSize: 24, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true, align: "center",
  });
  slide.addText("사람은 밥을 먹고 자라지만, 식물은 어떻게 크는 걸까?", {
    x: 1.2, y: 2.25, w: 7.6, h: 0.5,
    fontSize: 16, fontFace: "Microsoft YaHei",
    color: theme.secondary, align: "center",
  });

  // 생각해볼 점
  slide.addText("생각해 볼 점", {
    x: 0.5, y: 3.3, w: 9, h: 0.4,
    fontSize: 18, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addText([
    { text: "1. 식물이 자라려면 무엇이 필요할까요?", options: { bullet: true, breakLine: true } },
    { text: "2. 잎이 초록색인 이유는 무엇일까요?", options: { bullet: true, breakLine: true } },
    { text: "3. 어두운 곳에서도 식물이 자랄 수 있을까요?", options: { bullet: true } },
  ], {
    x: 0.8, y: 3.8, w: 8.5, h: 1.2,
    fontSize: 16, fontFace: "Microsoft YaHei",
    color: theme.secondary, paraSpaceAfter: 6,
  });

  // 페이지 번호
  slide.addShape(pres.shapes.OVAL, {
    x: 9.3, y: 5.1, w: 0.4, h: 0.4,
    fill: { color: theme.accent },
  });
  slide.addText("02", {
    x: 9.3, y: 5.1, w: 0.4, h: 0.4,
    fontSize: 11, color: "FFFFFF", bold: true,
    align: "center", valign: "middle",
  });

  return slide;
}

module.exports = { createSlide };