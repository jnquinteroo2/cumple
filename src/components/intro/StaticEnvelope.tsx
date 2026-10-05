export function StaticEnvelope() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-[14dvh] wide:items-center wide:justify-end wide:pt-0 wide:pr-[14vw]">
      <div className="relative grid size-56 place-items-center rounded-full bg-coral/15 sm:size-72">
        <span className="text-[7.5rem] leading-none sm:text-[9.5rem]" role="img" aria-label="Sobre cerrado">
          ✉️
        </span>
      </div>
    </div>
  )
}
