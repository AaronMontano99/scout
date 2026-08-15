// Every /app screen's top row: h1 (26px/600/-0.02em) + one-line
// subtitle + a right-aligned action cluster — matches scout-ui.html
// exactly across Today/Lists/Accounts/People/Research/Imports/
// Analytics/Settings.

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
        <p className="mt-1 text-sm text-body">{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}
