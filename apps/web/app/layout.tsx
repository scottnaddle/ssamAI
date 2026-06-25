import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ssamAI · AI 교원 조교",
  description:
    "한국 교원을 위한 AI 에이전트 하네스 — 수업 자료 생성, 행정 문서 작성, 교원 페르소나 장기 기억.",
  authors: [{ name: "UBION Co., Ltd." }],
  applicationName: "ssamAI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
