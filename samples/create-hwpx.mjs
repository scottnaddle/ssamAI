// create-hwpx.mjs — 광반응 활동지 HWPX 생성 (ESM)
import { HwpxWriter } from "@ssabrojs/hwpxjs";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createActivitySheet() {
  const writer = new HwpxWriter();

  const content = `광반응 활동지

초등 과학 3학년 - 4단원 식물의 세계
이름: ____________  모둠: ______  날짜: ______

[활동 목표]
1. 식물의 잎에서 일어나는 광합성을 관찰한다.
2. 빛이 있을 때와 없을 때 식물의 변화를 비교한다.
3. 실험 결과를 표와 그래프로 정리한다.

[실험 준비물]
- 물에 적신 콩나물 20개
- 두 개의 투명한 컵 (A, B)
- 물 200ml
- 일기장, 색연필

[실험 과정]
1단계. 콩나물을 A컵과 B컵에 각각 10개씩 넣는다.
2단계. A컵은 햇빛이 잘 드는 창가에 둔다.
3단계. B컵은 어두운 상자 안에 넣는다.
4단계. 매일 같은 시간에 관찰하고 기록한다.
5단계. 7일 후 변화를 비교한다.

[관찰 기록]
일차별 관찰 내용을 자세히 적어 봅시다.

1일차 관찰:
________________________________
________________________________

3일차 관찰:
________________________________
________________________________

5일차 관찰:
________________________________
________________________________

7일차 관찰:
________________________________
________________________________

[생각해 보기]
1. 빛이 있는 곳의 식물과 없는 곳의 식물은 어떻게 다른가요?
________________________________
________________________________

2. 잎의 색이 변한 이유는 무엇일까요?
________________________________
________________________________

3. 식물이 우리에게 주는 선물은 무엇인가요?
________________________________
________________________________

[다음 시간 안내]
식물의 뿌리와 줄기가 하는 일을 알아봅시다.
`;

  const buffer = await writer.createFromPlainText(content);
  const outDir = path.join(__dirname, "slides", "output");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "광반응_활동지.hwpx");
  writeFileSync(outPath, buffer);
  console.log(`✓ HWPX 생성 완료: ${outPath} (${buffer.length} bytes)`);
}

createActivitySheet().catch(console.error);