// slide-15.js — 마무리
const pptxgen = require("pptxgenjs");

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // 상단 헤더
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.6,
    fill: { color: theme.primary },
  });
  slide.addText("수업 마무리", {
    x: 0.5, y: 0, w: 9, h: 0.6,
    fontSize: 20, fontFace: "Microsoft YaHei",
    color: "FFFFFF", bold: true,
    align: "center", valign: "middle",
  });

  // 핵심 메시지
  slide.addText("식물은 우리 친구!", {
    x: 0.5, y: 1.3, w: 9, h: 0.8,
    fontSize: 40, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true, align: "center",
  });

  slide.addText("광합성으로 산소를 만들어 주는 고마운 존재", {
    x: 0.5, y: 2.1, w: 9, h: 0.5,
    fontSize: 18, fontFace: "Microsoft YaHei",
    color: theme.secondary, align: "center", italic: true,
  });

  // 다음 시간 예고
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 1.5, y: 3.2, w: 7, h: 1.5,
    fill: { color: theme.light },
    line: { color: theme.primary, width: 2 },
    rectRadius: 0.15,
  });
  slide.addText("다음 시간 예고", {
    x: 1.5, y: 3.3, w: 7, h: 0.4,
    fontSize: 16, fontFace: "Microsoft YaHei",
    color: theme.secondary, bold: true, align: "center",
  });
  slide.addText("식물의 뿌리와 줄기는 어떤 일을 할까요?", {
    x: 1.5, y: 3.75, w: 7, h: 0.5,
    fontSize: 22, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true, align: "center",
  });
  slide.addText("관찰 활동으로 직접 알아봅시다.", {
    x: 1.5, y: 4.25, w: 7, h: 0.4,
    fontSize: 14, fontFace: "Microsoft YaHei",
    color: theme.secondary, align: "center", italic: true,
  });

  // 마무리 인사
  slide.addText("수업에 참여해 주셔서 감사합니다.", {
    x: 0.5, y: 5.05, w: 9, h: 0.4,
    fontSize: 14, fontFace: "Microsoft YaHei",
    color: theme.primary, align: "center",
  });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent } });
  slide.addText("15", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 11, color: "FFFFFF", bold: true, align: "center", valign: "middle" });

  return slide;
}

module.exports = { createSlide };