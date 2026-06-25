/**
 * Persona view — read-only mirror of /onboarding.
 * Editing is a Phase 2 enhancement; for now, displays current persona.
 */
export default function PersonaPage() {
  return (
    <div className="flex flex-1 items-center justify-center text-text-light">
      <div className="text-center">
        <div className="mb-2 text-4xl">🎓</div>
        <div className="text-[15px] font-semibold text-primary">내 페르소나</div>
        <div className="mt-1 text-[13px]">
          현재 등록된 교원 페르소나는 /chat 오른쪽 패널에서 확인할 수 있습니다.
          <br />
          페르소나 수정은 Phase 2에서 지원됩니다.
        </div>
      </div>
    </div>
  );
}
