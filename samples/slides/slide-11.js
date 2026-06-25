// slide-10.js — 워크시트 1: 관찰 기록표
const pptxgen = require("pptxgenjs");

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("관찰 기록 워크시트", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 26, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: 0.95, w: 9, h: 0,
    line: { color: theme.accent, width: 2 },
  });

  slide.addText("이름: ____________  모둠: ______  날짜: ______", {
    x: 0.5, y: 1.2, w: 9, h: 0.4,
    fontSize: 14, fontFace: "Microsoft YaHei",
    color: theme.secondary,
  });

  // 기록 표
  slide.addTable([
    [
      { text: "날짜", options: { bold: true, color: "FFFFFF", fill: { color: theme.primary }, align: "center" } },
      { text: "A 컵 그림", options: { bold: true, color: "FFFFFF", fill: { color: theme.primary }, align: "center" } },
      { text: "B 컵 그림", options: { bold: true, color: "FFFFFF", fill: { color: theme.primary }, align: "center" } },
      { text: "차이점 메모", options: { bold: true, color: "FFFFFF", fill: { color: theme.primary }, align: "center" } },
    ],
    [{ text: "1일차", options: { align: "center", fontFace: "Microsoft YaHei" } }, { text: "", options: {} }, { text: "", options: {} }, { text: "", options: {} }],
    [{ text: "3일차", options: { align: "center", fontFace: "Microsoft YaHei" } }, { text: "", options: {} }, { text: "", options: {} }, { text: "", options: {} }],
    [{ text: "5일차", options: { align: "center", fontFace: "Microsoft YaHei" } }, { text: "", options: {} }, { text: "", options: {} }, { text: "", options: {} }],
    [{ text: "7일차", options: { align: "center", fontFace: "Microsoft YaHei" } }, { text: "", options: {} }, { text: "", options: {} }, { text: "", options: {} }],
  ], {
    x: 0.5, y: 1.8, w: 9, h: 3.0,
    fontSize: 14,
    border: { type: "solid", color: theme.accent, pt: 1 },
    rowH: [0.4, 0.65, 0.65, 0.65, 0.65],
  });

  slide.addText("그림을 그리고 차이점을 자세히 적어 봅시다.", {
    x: 0.5, y: 4.95, w: 9, h: 0.3,
    fontSize: 13, fontFace: "Microsoft YaHei",
    color: theme.secondary, align: "center", italic: true,
  });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent } });
  slide.addText("10", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 11, color: "FFFFFF", bold: true, align: "center", valign: "middle" });

  return slide;
}

module.exports = { createSlide };