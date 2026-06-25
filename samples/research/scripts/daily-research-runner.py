#!/usr/bin/env python3
"""
daily-research-runner.py — 매일 자동 한국 교사 자료 수집
launchd가 daily-research.sh를 통해 호출하거나 수동 실행

수집 소스:
- 에듀넷 (edunet.net)
- 차시랑 (chasirang.com)
- 금성교과서 자료실 (newtext2023.kumsung.co.kr)
- 미래엔 교사 (e.m-teacher.co.kr)
- 천재교과서 (text.tsherpa.co.kr)
- 정부24 (gov.kr)
- 경기도교육청 (goe.go.kr)

방법: Jina Reader (https://r.jina.ai/) 무료 API로 URL 본문 추출
"""
import json
import os
import sys
import urllib.request
import urllib.parse
from datetime import datetime, timedelta, timezone
from pathlib import Path

# 한국 시간 (UTC+9)
KST = timezone(timedelta(hours=9))

# 설정
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent  # samples/research/scripts → ssamAI
RESEARCH_DIR = PROJECT_ROOT / "samples" / "research"
TODAY = datetime.now(KST).strftime("%Y-%m-%d_%A")
DAILY_DIR = RESEARCH_DIR / "daily" / TODAY
RAW_DIR = DAILY_DIR / "raw"
LOG_FILE = RESEARCH_DIR / "logs" / f"runner_{datetime.now(KST).strftime('%Y-%m-%d')}.log"

RAW_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

# 크롤링 대상 URL (Phase 2 — 매일 업데이트 가능)
TARGETS = [
    {
        "site": "에듀넷",
        "category": "수업자료",
        "url": "https://www.edunet.net",
        "type": "index",
    },
    {
        "site": "금성교과서 자료실",
        "category": "수업자료",
        "url": "https://newtext2023.kumsung.co.kr/reference/science/fourth",
        "type": "page",
    },
    {
        "site": "미래엔 교사",
        "category": "활동지",
        "url": "https://e.m-teacher.co.kr/pages/ele/board/specializeddata/scienceExplorationPaper.mrn",
        "type": "page",
    },
    {
        "site": "천재교과서",
        "category": "교과서",
        "url": "https://text.tsherpa.co.kr/ele/book.html?bookcode=text-ele-science-jy-02",
        "type": "page",
    },
    {
        "site": "경기도교육청",
        "category": "평가",
        "url": "https://www.goe.go.kr",
        "type": "index",
    },
    {
        "site": "정부24",
        "category": "행정문서",
        "url": "https://www.gov.kr",
        "type": "index",
    },
]


def log(msg):
    ts = datetime.now(KST).strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def fetch_jina(url):
    """Jina Reader로 URL 본문 추출 (무료, API 키 불필요)."""
    jina_url = f"https://r.jina.ai/{url}"
    try:
        req = urllib.request.Request(jina_url, headers={"User-Agent": "ssamAI-research/1.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            text = resp.read().decode("utf-8", errors="ignore")
            return text[:8000]  # 본문 8KB만
    except Exception as e:
        return f"[FETCH ERROR] {type(e).__name__}: {str(e)[:300]}"


def collect():
    log(f"========== Daily research 시작: {TODAY} ==========")
    log(f"수집 대상: {len(TARGETS)}개 사이트")

    collected = []
    for i, target in enumerate(TARGETS, 1):
        log(f"[{i}/{len(TARGETS)}] {target['site']} ({target['category']})")
        log(f"  URL: {target['url']}")
        content = fetch_jina(target["url"])
        size = len(content)

        # 메타 + 본문 마크다운 저장
        site_slug = target["site"].replace(" ", "_")
        filename = f"{i:02d}-{site_slug}.md"
        filepath = RAW_DIR / filename
        meta = (
            f"---\n"
            f"url: {target['url']}\n"
            f"site: {target['site']}\n"
            f"category: {target['category']}\n"
            f"type: {target['type']}\n"
            f"collected_at: {datetime.now(KST).isoformat()}\n"
            f"size: {size}\n"
            f"---\n\n"
        )
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(meta + content)
        log(f"  ✓ 저장: {filepath.name} ({size:,} chars)")
        collected.append({"site": target["site"], "category": target["category"], "size": size})

    # 요약 인덱스
    summary_path = DAILY_DIR / "SUMMARY.json"
    summary = {
        "date": TODAY,
        "collected_at": datetime.now(KST).isoformat(),
        "total_sources": len(TARGETS),
        "successful": len(collected),
        "total_size": sum(c["size"] for c in collected),
        "by_site": collected,
    }
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    log(f"요약: {summary_path.name}")

    log("========== 완료 ==========")
    return summary


if __name__ == "__main__":
    try:
        result = collect()
        sys.exit(0 if result["successful"] > 0 else 1)
    except Exception as e:
        log(f"ERROR: {e}")
        sys.exit(2)