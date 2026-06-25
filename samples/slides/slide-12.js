// slide-11.js — 워크시트 2: 데이터 정리
const pptxgen = require("pptxgenjs");

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  slide.addText("데이터 정리 & 그래프", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 26, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addShape(pres.shapes.LINE, {
    x: 0.5, y: 0.95, w: 9, h: 0,
    line: { color: theme.accent, width: 2 },
  });

  // 막대 그래프 (A 컵 vs B 컵 키)
  const chartData = [
    {
      name: "A 컵 (빛 O)",
      labels: ["1일", "3일", "5일", "7일"],
      values: [2.0, 3.5, 5.2, 7.8],
    },
    {
      name: "B 컵 (빛 X)",
      labels: ["1일", "3일", "5일", "7일"],
      values: [2.0, 4.8, 7.5, 9.2],
    },
  ];

  slide.addChart(pres.charts.BAR, chartData, {
    x: 0.5, y: 1.3, w: 5.5, h: 3.5,
    barDir: "col",
    chartColors: [theme.primary, theme.secondary],
    showTitle: true,
    title: "콩나물 키 변화 (cm)",
    titleFontFace: "Microsoft YaHei",
    titleFontSize: 14,
    showLegend: true,
    legendPos: "b",
    catAxisLabelFontSize: 10,
    valAxisLabelFontSize: 10,
    catAxisLabelFontFace: "Microsoft YaHei",
  });

  // 오른쪽: 결과 해석
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 6.2, y: 1.3, w: 3.3, h: 3.5,
    fill: { color: theme.light },
    line: { color: theme.accent, width: 1 },
    rectRadius: 0.15,
  });
  slide.addText("결과 해석", {
    x: 6.3, y: 1.4, w: 3.1, h: 0.4,
    fontSize: 16, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true, align: "center",
  });
  slide.addText([
    { text: "B 컵이 더 빨리 자랐지만", options: { breakLine: true, fontSize: 13 } },
    { text: "줄기가 가늘고 연합니다.", options: { breakLine: true, fontSize: 13 } },
    { text: "", options: { breakLine: true, fontSize: 6 } },
    { text: "A 컵은 건강하고", options: { breakLine: true, fontSize: 13 } },
    { text: "초록색을 유지했습니다.", options: { fontSize: 13 } },
  ], {
    x: 6.4, y: 1.9, w: 3.0, h: 2.8,
    fontFace: "Microsoft YaHei",
    color: theme.secondary, align: "center",
  });

  slide.addShape(pres.shapes.OVAL, { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fill: { color: theme.accent } });
  slide.addText("11", { x: 9.3, y: 5.1, w: 0.4, h: 0.4, fontSize: 11, color: "FFFFFF", bold: true, align: "center", valign: "middle" });

  return slide;
}

module.exports = { createSlide };