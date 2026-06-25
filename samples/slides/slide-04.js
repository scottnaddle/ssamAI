// slide-03.js — 광합성 개념 1 (정의)
const pptxgen = require("pptxgenjs");

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("광합성이란?", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: 0.95, w: 9, h: 0,
    line: { color: theme.accent, width: 2 },
  });

  // 핵심 정의 박스
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 1.4, w: 8.4, h: 1.6,
    fill: { color: theme.light },
    line: { color: theme.primary, width: 2 },
    rectRadius: 0.2,
  });
  slide.addText("빛 에너지를 이용해", {
    x: 1, y: 1.6, w: 8, h: 0.5,
    fontSize: 22, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true, align: "center",
  });
  slide.addText("이산화탄소와 물로 양분(포도당)을 만들고", {
    x: 1, y: 2.1, w: 8, h: 0.4,
    fontSize: 18, fontFace: "Microsoft YaHei",
    color: theme.secondary, align: "center",
  });
  slide.addText("산소를 내보내는 과정", {
    x: 1, y: 2.5, w: 8, h: 0.4,
    fontSize: 18, fontFace: "Microsoft YaHei",
    color: theme.secondary, align: "center",
  });

  // 3가지 키워드
  slide.addText("핵심 키워드", {
    x: 0.5, y: 3.4, w: 9, h: 0.4,
    fontSize: 18, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });

  const keywords = [
    { label: "빛", desc: "햇빛" },
    { label: "엽록소", desc: "잎의 초록색 물질" },
    { label: "양분", desc: "포도당(포도당)" },
  ];
  keywords.forEach((kw, i) => {
    const x = 0.8 + i * 3;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 3.9, w: 2.6, h: 1.0,
      fill: { color: theme.accent },
      rectRadius: 0.1,
    });
    slide.addText(kw.label, {
      x, y: 3.95, w: 2.6, h: 0.5,
      fontSize: 22, fontFace: "Microsoft YaHei",
      color: theme.primary, bold: true, align: "center",
    });
    slide.addText(kw.desc, {
      x, y: 4.45, w: 2.6, h: 0.4,
      fontSize: 13, fontFace: "Microsoft YaHei",
      color: theme.secondary, align: "center",
    });
  });

  slide.addShape(pres.shapes.OVAL, {
    x: 9.3, y: 5.1, w: 0.4, h: 0.4,
    fill: { color: theme.accent },
  });
  slide.addText("03", {
    x: 9.3, y: 5.1, w: 0.4, h: 0.4,
    fontSize: 11, color: "FFFFFF", bold: true,
    align: "center", valign: "middle",
  });

  return slide;
}

module.exports = { createSlide };