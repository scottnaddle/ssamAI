// slide-14.js — 심화 토론
const pptxgen = require("pptxgenjs");

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("심화 토론", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: 0.95, w: 9, h: 0,
    line: { color: theme.accent, width: 2 },
  });

  slide.addText("모둠별로 생각해 봅시다", {
    x: 0.5, y: 1.2, w: 9, h: 0.4,
    fontSize: 18, fontFace: "Microsoft YaHei",
    color: theme.secondary, align: "center", italic: true,
  });

  // 토론 주제 박스들
  const topics = [
    { q: "왜 가을에 나뭇잎이 노랗게 변할까요?", hint: "엽록소가 사라지면?" },
    { q: "집 안 화분이 창가 쪽으로 기울어져 있다면?", hint: "빛을 찾아 식물도 움직여요" },
    { q: "바다 속 해조류도 광합성을 할까요?", hint: "빛이 닿는 얕은 바다에서" },
  ];

  topics.forEach((t, i) => {
    const y = 1.8 + i * 1.15;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.5, y, w: 9, h: 0.95,
      fill: { color: i % 2 === 0 ? theme.light : "FFFFFF" },
      line: { color: theme.accent, width: 1 },
      rectRadius: 0.1,
    });
    slide.addText(`Q${i + 1}. ${t.q}`, {
      x: 0.7, y: y + 0.1, w: 8.6, h: 0.4,
      fontSize: 16, fontFace: "Microsoft YaHei",
      color: theme.primary, bold: true,
    });
    slide.addText(`힌트: ${t.hint}`, {
      x: 0.7, y: y + 0.5, w: 8.6, h: 0.4,
      fontSize: 13, fontFace: "Microsoft YaHei",
      color: theme.secondary, italic: true,
    });
  });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent } });
  slide.addText("14", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 11, color: "FFFFFF", bold: true, align: "center", valign: "middle" });

  return slide;
}

module.exports = { createSlide };