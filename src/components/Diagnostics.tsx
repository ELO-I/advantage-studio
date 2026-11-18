import { Check } from 'lucide-react';
import type { Diagnostic } from '../domain/smartset';
import { useI18n } from '../i18n/context';

export function Diagnostics({ issues }: { issues: Diagnostic[] }) {
  const { t, diagnostic } = useI18n();
  if (!issues.length)
    return (
      <p className="inline-success">
        <Check size={15} />
        {t.diagnostics.valid}
      </p>
    );
  return (
    <div className="diagnostics" role="status">
      {issues.map((issue, index) => (
        <p
          className={
            issue.severity === 'error' ? 'inline-error' : 'inline-warning'
          }
          key={`${issue.line}-${index}`}
        >
          <strong>
            {issue.line ? t.diagnostics.line(issue.line) : t.diagnostics.file}
          </strong>{' '}
          · {diagnostic(issue)}
        </p>
      ))}
    </div>
  );
}
