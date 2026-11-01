export function PageHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div>
        <h1 className="text-[32px] leading-[1.1] font-medium tracking-[-0.015em] text-ink sm:text-[36px]">{title}</h1>
        <p className="mt-1.5 max-w-[62ch] text-[14.5px] text-body">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
