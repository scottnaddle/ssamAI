// slide-01.js — 교수학습과정안 (Lesson Plan)
const pptxgen = require("pptxgenjs");

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // 헤더
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.55,
    fill: { color: theme.primary },
  });
  slide.addText("교수학습과정안", {
    x: 0.5, y: 0, w: 9, h: 0.55,
    fontSize: 22, fontFace: "Microsoft YaHei",
    color: "FFFFFF", bold: true,
    align: "center", valign: "middle",
  });

  // 2열 메타데이터 테이블 (왼쪽)
  const leftRows = [
    { label: "교 과 명", value: "과학" },
    { label: "학 년", value: "초등 3학년" },
    { label: "학 기", value: "2학기" },
    { label: "단 원 명", value: "식물의 세계" },
    { label: "차 시", value: "2 / 5" },
  ];
  leftRows.forEach((r, i) => {
    const y = 0.85 + i * 0.42;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 1.4, h: 0.38,
      fill: { color: theme.primary },
    });
    slide.addText(r.label, {
      x: 0.55, y, w: 1.3, h: 0.38,
      fontSize: 11, fontFace: "Microsoft YaHei",
      color: "FFFFFF", bold: true,
      align: "center", valign: "middle",
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 1.95, y, w: 2.8, h: 0.38,
      fill: { color: "FFFFFF" },
      line: { color: theme.accent, width: 0.5 },
    });
    slide.addText(r.value, {
      x: 2.05, y, w: 2.7, h: 0.38,
      fontSize: 11, fontFace: "Microsoft YaHei",
      color: theme.primary,
      valign: "middle",
    });
  });

  // 2열 메타데이터 테이블 (오른쪽)
  const rightRows = [
    { label: "쪽 수", value: "과학 14~15쪽" },
    { label: "학습주제", value: "광합성이란?" },
    { label: "활동유형", value: "관찰, 실험, 토의" },
    { label: "학습환경", value: "교실, 과학실" },
    { label: "준비물", value: "콩나물, 컵, 물" },
  ];
  rightRows.forEach((r, i) => {
    const y = 0.85 + i * 0.42;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 4.95, y, w: 1.4, h: 0.38,
      fill: { color: theme.primary },
    });
    slide.addText(r.label, {
      x: 5.0, y, w: 1.3, h: 0.38,
      fontSize: 11, fontFace: "Microsoft YaHei",
      color: "FFFFFF", bold: true,
      align: "center", valign: "middle",
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 6.4, y, w: 3.1, h: 0.38,
      fill: { color: "FFFFFF" },
      line: { color: theme.accent, width: 0.5 },
    });
    slide.addText(r.value, {
      x: 6.5, y, w: 3.0, h: 0.38,
      fontSize: 11, fontFace: "Microsoft YaHei",
      color: theme.primary,
      valign: "middle",
    });
  });

  // 학습목표 박스
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 3.1, w: 9, h: 1.0,
    fill: { color: theme.light },
    line: { color: theme.primary, width: 1 },
    rectRadius: 0.1,
  });
  slide.addText("학습목표", {
    x: 0.6, y: 3.15, w: 1.5, h: 0.4,
    fontSize: 13, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  slide.addText([
    { text: "1. 식물의 잎에서 일어나는 광합성 과정을 설명할 수 있다.", options: { breakLine: true } },
    { text: "2. 빛이 있을 때와 없을 때 식물의 변화를 비교 관찰할 수 있다.", options: { breakLine: true } },
    { text: "3. 실험 결과를 표와 그래프로 정리하여 결론을 도출할 수 있다.", options: {} },
  ], {
    x: 0.6, y: 3.5, w: 8.8, h: 0.6,
    fontSize: 11, fontFace: "Microsoft YaHei",
    color: theme.secondary,
  });

  // 학습활동 흐름
  slide.addText("학습활동 흐름", {
    x: 0.5, y: 4.25, w: 9, h: 0.35,
    fontSize: 13, fontFace: "Microsoft YaHei",
    color: theme.primary, bold: true,
  });
  const flow = [
    { label: "도입", desc: "생각 열기", x: 0.5 },
    { label: "전개", desc: "개념 학습 + 실험", x: 3.7 },
    { label: "정리", desc: "결과 분석 + 형성평가", x: 6.9 },
  ];
  flow.forEach((f) => {
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: f.x, y: 4.65, w: 2.6, h: 0.6,
      fill: { color: theme.accent },
      rectRadius: 0.1,
    });
    slide.addText(f.label, {
      x: f.x, y: 4.65, w: 2.6, h: 0.32,
      fontSize: 13, fontFace: "Microsoft YaHei",
      color: theme.primary, bold: true, align: "center",
    });
    slide.addText(f.desc, {
      x: f.x, y: 4.93, w: 2.6, h: 0.3,
      fontSize: 10, fontFace: "Microsoft YaHei",
      color: theme.secondary, align: "center",
    });
  });
  // 화살표
  slide.addShape(pres.shapes.RIGHT_ARROW, {
    x: 3.15, y: 4.8, w: 0.5, h: 0.3,
    fill: { color: theme.secondary },
  });
  slide.addShape(pres.shapes.RIGHT_ARROW, {
    x: 6.35, y: 4.8, w: 0.5, h: 0.3,
    fill: { color: theme.secondary },
  });

  // 페이지 번호 (Lesson Plan은 표지처럼 처리, 작은 텍스트)
  slide.addText("교수학습과정안", {
    x: 8.5, y: 5.35, w: 1.5, h: 0.25,
    fontSize: 9, fontFace: "Microsoft YaHei",
    color: theme.secondary, align: "right", italic: true,
  });

  return slide;
}

module.exports = { createSlide };