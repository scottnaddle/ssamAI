# ssamAI — Common Pitfalls

이 문서는 ssamAI 프로젝트에서 새 agent가 작업을 시작하기 전에 알아야 할 함정을 정리한다.
모든 specialist는 자신의 `agent.md` body에서 참조하므로, 새 함정이 발견되면 여기에 추가한다.

## Frontend (apps/web)

### 1. 백엔드를 직접 호출하지 말 것

**함정**: 브라우저에서 `http://localhost:3090/api/messages`를 직접 fetch하면 CORS + 인증 헤더 누락.

**올바른 방법**: Next.js의 rewrite를 통해 `/api/librechat/*`, `/api/ppt/*`, `/api/persona/*`로 호출.
`next.config.mjs`의 `rewrites()` 정의가 single source of truth.

```tsx
// BAD
fetch("http://localhost:3090/api/messages", { headers: { Authorization: `Bearer ${token}` } })

// GOOD
fetch("/api/librechat/messages", { headers: { Authorization: `Bearer ${token}` } })
```

### 2. Tailwind hex 직접 사용 금지

**함정**: 컴포넌트 안에서 `bg-[#3D6B4F]`를 쓰면 디자인 시스템 일관성이 깨짐.

**올바른 방법**: `tailwind.config.ts`의 `theme.extend.colors`에 토큰 추가 후 `bg-primary` 사용.

### 3. React 19 RC 호환성

**함정**: 일부 라이브러리가 React 19 RC와 비호환. peer dependency 충돌 시 `--legacy-peer-deps` 또는 호환 버전 확인.

## Backend (services/)

### 4. Pydantic v2 — from_attributes 잊지 말 것

**함정**: ORM/Neo4j record를 Pydantic 모델로 변환할 때 `from_attributes=True` 없으면 field 매핑 실패.

```python
# BAD
class TeacherPersona(BaseModel):
    name: str

# GOOD
class TeacherPersona(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: str
```

### 5. Neo4j 멀티테넌시 필터

**함정**: Cypher 쿼리에 `WHERE n.group_id = $group_id` 누락 시 다른 교사 데이터 노출.

**올바른 방법**: 모든 read/write 쿼리에 group_id 필터. repository.py 패턴 참고.

### 6. LLM JSON 응답 검증 부재 (기술 부채)

ppt-service의 `generate_ppt_outline()`이 LLM의 JSON 응답을 그대로 신뢰. Pydantic validation 추가 필요.
새 LLM 호출 추가 시 **반드시** schema validation 포함.

## Infra (docker / LiteLLM)

### 7. 포트 충돌

**함정**: 다른 dev 프로젝트(refly/supabase 등)가 표준 포트(3000, 4000, 5432, 6379)를 점유 중.

**완화**: `${WEB_PORT:-3000}` 패턴으로 env override 가능. 새 서비스 추가 시에도 동일 패턴 유지.

### 8. healthcheck 없는 service

**함정**: `depends_on`에 `condition: service_healthy` 쓰려면 해당 서비스에 `healthcheck:` 블록 필수. 없으면 ignore되고 race condition 발생.

### 9. .env는 절대 커밋 금지

`.gitignore`에 이미 포함. staging에 추가하지 말 것. secret 노출 시 즉시 키 회전.

## LLM (litellm config / prompts)

### 10. config.yaml에 키 하드코딩 절대 금지

```yaml
# BAD
api_key: sk-litellm-actual-key-value-12345

# GOOD
api_key: os.environ/LITELLM_MASTER_KEY
```

### 11. 한국어 직역체 프롬프트

LLM 응답이 직역체로 나오면 사용자 경험 손상. system prompt에 "자연스러운 한국어 교사용 어휘 사용" 명시.

## Cross-cutting

### 12. git은 직접 commit하지 말 것

agent가 코드 변경 후 commit은 사용자가 명시 요청 시에만. 보고만 하고 멈춤.

### 13. 작업 완료 시 검증 명령 함께 보고

"작동함"이 아니라 어떤 명령으로 검증했는지 명시. 예:
- `pnpm --filter @ssamAI/web typecheck`
- `ruff check services/ppt-service`
- `curl http://localhost:8200/health`