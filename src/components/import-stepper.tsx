const STEPS = [
  { n: 1, label: 'Upload' },
  { n: 2, label: 'Map columns' },
  { n: 3, label: 'Validate rows' },
  { n: 4, label: 'Resolve matches' },
  { n: 5, label: 'Import summary' },
];

export function ImportStepper({ current }: { current: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => (
        <div key={step.n} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-medium ${
                step.n < current
                  ? 'bg-primary text-on-primary'
                  : step.n === current
                    ? 'border-2 border-ink text-ink'
                    : 'border border-hairline-strong text-muted'
              }`}
            >
              {step.n < current ? '✓' : step.n}
            </div>
            <span className={`text-[11px] ${step.n <= current ? 'text-ink' : 'text-muted'}`}>{step.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`mx-2 h-px w-10 sm:w-16 ${step.n < current ? 'bg-primary' : 'bg-hairline-strong'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
