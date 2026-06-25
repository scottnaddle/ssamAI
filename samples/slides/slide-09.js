// slide-08.js — 실험 관찰
const pptxgen = require("pptxgenjs");

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("실험 관찰 기록", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: 0.95, w: 9, h: 0,
    line: { color: theme.accent, width: 2 },
  });

  // 비교 표
  slide.addTable([
    [
      { text: "관찰일", options: { bold: true, color: "FFFFFF", fill: { color: theme.primary }, align: "center", fontFace: "Microsoft YaHei" } },
      { text: "A 컵 (빛 O)", options: { bold: true, color: "FFFFFF", fill: { color: theme.primary }, align: "center", fontFace: "Microsoft YaHei" } },
      { text: "B 컵 (빛 X)", options: { bold: true, color: "FFFFFF", fill: { color: theme.primary }, align: "center", fontFace: "Microsoft YaHei" } },
    ],
    [
      { text: "1일차", options: { align: "center", fontFace: "Microsoft YaHei" } },
      { text: "변화 없음", options: { align: "center", fontFace: "Microsoft YaHei" } },
      { text: "변화 없음", options: { align: "center", fontFace: "Microsoft YaHei" } },
    ],
    [
      { text: "3일차", options: { align: "center", fontFace: "Microsoft YaHei" } },
      { text: "잎이 초록, 곧음", options: { align: "center", fontFace: "Microsoft YaHei" } },
      { text: "잎이 연해짐", options: { align: "center", fontFace: "Microsoft YaHei" } },
    ],
    [
      { text: "5일차", options: { align: "center", fontFace: "Microsoft YaHei" } },
      { text: "줄기가 자람", options: { align: "center", fontFace: "Microsoft YaHei" } },
      { text: "줄기가 길고 가늘어짐", options: { align: "center", fontFace: "Microsoft YaHei" } },
    ],
    [
      { text: "7일차", options: { align: "center", fontFace: "Microsoft YaHei" } },
      { text: "건강하게 성장", options: { align: "center", fontFace: "Microsoft YaHei", bold: true, color: theme.primary } },
      { text: "엽록소가 사라짐", options: { align: "center", fontFace: "Microsoft YaHei", bold: true, color: theme.secondary } },
    ],
  ], {
    x: 0.5, y: 1.3, w: 9, h: 3.0,
    fontSize: 15,
    border: { type: "solid", color: theme.accent, pt: 1 },
  });

  slide.addText("관찰 포인트: 잎의 색, 줄기 굵기, 키의 차이", {
    x: 0.5, y: 4.6, w: 9, h: 0.4,
    fontSize: 14, fontFace: "Microsoft YaHei",
    color: theme.secondary, align: "center", italic: true,
  });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent } });
  slide.addText("08", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 11, color: "FFFFFF", bold: true, align: "center", valign: "middle" });

  return slide;
}

module.exports = { createSlide };