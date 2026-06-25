// slide-16.js — 형성평가 (Formative Assessment)
const pptxgen = require("pptxgenjs");

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // 헤더
  slide.addText("형성평가", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: 0.95, w: 9, h: 0,
    line: { color: theme.accent, width: 2 },
  });

  // 문항 1
  slide.addText("1. 광합성에 대한 설명으로 옳은 것은?", {
    x: 0.5, y: 1.2, w: 9, h: 0.4,
    fontSize: 16, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addText([
    { text: "① 이산화탄소를 흡수하고 산소를 내보낸다.", options: { breakLine: true } },
    { text: "② 뿌리에서 일어나는 과정이다.", options: { breakLine: true } },
    { text: "③ 밤에만 일어난다.", options: { breakLine: true } },
    { text: "④ 양분을 만드는 과정이 아니다.", options: { breakLine: true } },
    { text: "⑤ 빛이 없어도 일어난다.", options: {} },
  ], {
    x: 0.8, y: 1.6, w: 8.5, h: 1.4,
    fontSize: 13, fontFace: "Microsoft YaHei",
    color: theme.secondary, paraSpaceAfter: 2,
  });

  // 정답 표시
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 7.5, y: 1.2, w: 1.8, h: 0.4,
    fill: { color: theme.accent },
    rectRadius: 0.05,
  });
  slide.addText("정답 ①", {
    x: 7.5, y: 1.2, w: 1.8, h: 0.4,
    fontSize: 13, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true, align: "center", valign: "middle",
  });

  // 문항 2
  slide.addText("2. 광합성에 필요한 것이 아닌 것은?", {
    x: 0.5, y: 3.1, w: 9, h: 0.4,
    fontSize: 16, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addText([
    { text: "① 빛   ② 물   ③ 이산화탄소   ④ 산소   ⑤ 엽록소", options: {} },
  ], {
    x: 0.8, y: 3.5, w: 8.5, h: 0.5,
    fontSize: 13, fontFace: "Microsoft YaHei",
    color: theme.secondary,
  });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 7.5, y: 3.1, w: 1.8, h: 0.4,
    fill: { color: theme.accent },
    rectRadius: 0.05,
  });
  slide.addText("정답 ④", {
    x: 7.5, y: 3.1, w: 1.8, h: 0.4,
    fontSize: 13, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true, align: "center", valign: "middle",
  });

  // 문항 3
  slide.addText("3. 빛이 없는 곳에서 키운 식물의 특징으로 옳은 것은?", {
    x: 0.5, y: 4.05, w: 9, h: 0.4,
    fontSize: 16, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addText([
    { text: "① 잎이 초록색이 진해진다.", options: { breakLine: true } },
    { text: "② 줄기가 굵고 단단해진다.", options: { breakLine: true } },
    { text: "③ 잎이 연하고 줄기가 가늘어진다.", options: { breakLine: true } },
    { text: "④ 뿌리가 매우 깊게 자란다.", options: { breakLine: true } },
    { text: "⑤ 꽃이 많이 핀다.", options: {} },
  ], {
    x: 0.8, y: 4.45, w: 8.5, h: 0.6,
    fontSize: 12, fontFace: "Microsoft YaHei",
    color: theme.secondary, paraSpaceAfter: 1,
  });
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 7.5, y: 4.05, w: 1.8, h: 0.4,
    fill: { color: theme.accent },
    rectRadius: 0.05,
  });
  slide.addText("정답 ③", {
    x: 7.5, y: 4.05, w: 1.8, h: 0.4,
    fontSize: 13, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true, align: "center", valign: "middle",
  });

  // 페이지 번호
  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent } });
  slide.addText("16", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 11, color: "FFFFFF", bold: true, align: "center", valign: "middle" });

  return slide;
}

module.exports = { createSlide };