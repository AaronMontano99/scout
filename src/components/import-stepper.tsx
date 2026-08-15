const STEPS = [
  { n: 1, label: 'Upload' },
  { n: 2, label: 'Map columns' },
  { n: 3, label: 'Validate rows' },
  { n: 4, label: 'Resolve matches' },
  { n: 5, label: 'Import summary' },
];

export function ImportStepper({ current }: { current: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="flex items-center rounded-lg border border-hairline-strong bg-surface-card p-4">
      {STEPS.map((step, i) => (
        <div key={step.n} className="flex flex-1 items-center">
          <div className="flex items-center gap-2.5 whitespace-nowrap">
            <div
              className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border font-mono text-[10px] ${
                step.n < current
                  ? 'border-ink bg-ink text-canvas'
                  : step.n === current
                    ? 'border-ink text-ink'
                    : 'border-hairline-strong text-muted'
              }`}
            >
              {step.n < current ? '✓' : step.n}
            </div>
            <span className={`text-[12.5px] font-medium ${step.n <= current ? 'text-ink' : 'text-muted'}`}>{step.label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`mx-3 h-px flex-1 ${step.n < current ? 'bg-ink' : 'bg-hairline-strong'}`} />}
        </div>
      ))}
    </div>
  );
}
