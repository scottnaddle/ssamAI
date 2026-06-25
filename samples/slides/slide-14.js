// slide-13.js — 정리: 핵심 정리
const pptxgen = require("pptxgenjs");

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("오늘 배운 내용 정리", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: 0.95, w: 9, h: 0,
    line: { color: theme.accent, width: 2 },
  });

  // 3개 핵심 정리 박스
  const items = [
    { num: "1", title: "광합성 정의", desc: "빛·이산화탄소·물 → 양분·산소" },
    { num: "2", title: "엽록소의 역할", desc: "잎의 초록색 물질, 빛 에너지를 흡수" },
    { num: "3", title: "빛의 중요성", desc: "빛이 없으면 엽록소가 사라지고 건강하지 못함" },
  ];

  items.forEach((item, i) => {
    const y = 1.4 + i * 1.2;
    slide.addShape(pres.shapes.OVAL, {
      x: 0.8, y, w: 0.8, h: 0.8,
      fill: { color: theme.primary },
    });
    slide.addText(item.num, {
      x: 0.8, y, w: 0.8, h: 0.8,
      fontSize: 28, fontFace: "Arial",
      color: "FFFFFF", bold: true,
      align: "center", valign: "middle",
    });
    slide.addText(item.title, {
      x: 1.8, y, w: 7.5, h: 0.4,
      fontSize: 20, fontFace: "Microsoft YaHei",
      color: theme.primary, bold: true,
    });
    slide.addText(item.desc, {
      x: 1.8, y: y + 0.45, w: 7.5, h: 0.4,
      fontSize: 15, fontFace: "Microsoft YaHei",
      color: theme.secondary,
    });
  });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent } });
  slide.addText("13", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 11, color: "FFFFFF", bold: true, align: "center", valign: "middle" });

  return slide;
}

module.exports = { createSlide };