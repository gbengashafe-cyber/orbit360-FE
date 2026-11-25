import { cn } from '@/lib/utils';

/**
 * Groups related fields in a longer form (DESIGN.md §6 Forms). Sections stack with a divider between them.
 *
 * <FormSection title="Repayment" description="How the loan is paid back.">…fields…</FormSection>
 */
export function FormSection({ title, description, children, className }) {
  return (
    <section className={cn('flex flex-col gap-4 border-t pt-5 first:border-t-0 first:pt-0', className)}>
      {title || description ? (
        <div className="flex flex-col gap-0.5">
          {title ? <h2 className="text-base font-semibold text-foreground">{title}</h2> : null}
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/**
 * Label, control and hint/error text for one field. Errors appear here, never in a toast.
 *
 * <FormField label="Principal amount" htmlFor="principal" error={errors.principal?.message}>
 *   <Input id="principal" … />
 * </FormField>
 */
export function FormField({ label, htmlFor, hint, error, required, children, className }) {
  const message = error || hint;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <label htmlFor={htmlFor} className="text-[13px] font-medium leading-[18px] text-gray-700">
          {label}
          {required ? <span className="text-status-danger"> *</span> : null}
        </label>
      ) : null}
      {children}
      {message ? (
        <p className={cn('text-xs', error ? 'text-status-danger' : 'text-muted-foreground')} role={error ? 'alert' : undefined}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
