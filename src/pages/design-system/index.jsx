import {
  ConfirmDialog,
  DataPanel,
  DatePicker,
  DateRangePicker,
  EmptyState,
  FormField,
  FormSection,
  formatCurrency,
  formatDate,
  formatDateRange,
  formatDateTime,
  PageHeader,
  RowActions,
  StatCard,
  StatusBadge,
  TablePagination,
} from '@/components/system';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

/*
 * Development-only reference for the Orbit 360 design system (DESIGN.md).
 * Everything here renders the real shared components, so it shows exactly what pages get.
 * Rows below are example data.
 */

const SWATCHES = [
  {
    group: 'Brand',
    items: [
      ['brand-600', 'bg-brand-600', '#1A66E3'],
      ['brand-700', 'bg-brand-700', '#1553BD'],
      ['brand-100', 'bg-brand-100', '#DCE8FC'],
      ['brand-50', 'bg-brand-50', '#EEF4FE'],
    ],
  },
  {
    group: 'Neutrals',
    items: [
      ['gray-0', 'bg-white', '#FFFFFF'],
      ['gray-50', 'bg-gray-50', '#F6F8FB'],
      ['gray-100', 'bg-gray-100', '#EEF1F6'],
      ['gray-200', 'bg-gray-200', '#E2E7EF'],
      ['gray-300', 'bg-gray-300', '#CBD3DF'],
      ['gray-500', 'bg-gray-500', '#6B7689'],
      ['gray-700', 'bg-gray-700', '#363F4F'],
      ['gray-900', 'bg-gray-900', '#141A26'],
    ],
  },
  {
    group: 'Status',
    items: [
      ['pending', 'bg-status-pending-bg', '#FFF4DE'],
      ['info', 'bg-status-info-bg', '#EEF4FE'],
      ['success', 'bg-status-success-bg', '#E8F6EE'],
      ['danger', 'bg-status-danger-bg', '#FDECEA'],
      ['neutral', 'bg-status-neutral-bg', '#EEF1F6'],
    ],
  },
];

const STATUS_EXAMPLES = [
  'PENDING_REVIEW',
  'PENDING_SUPERVISOR_APPROVAL',
  'PENDING_HR_APPROVAL',
  'PENDING_DISBURSEMENT',
  'ACTIVE',
  'APPROVED',
  'PAID_OFF',
  'REJECTED_BY_APPROVER',
  'CANCELLED',
  'SOMETHING_NEW',
];

const LOANS = [
  {
    id: 1,
    type: 'Salary advance',
    principal: 150000,
    monthly: 52500,
    requested: '2026-11-03',
    start: '2026-12-01',
    end: '2027-02-28',
    status: 'PENDING_REVIEW',
  },
  {
    id: 2,
    type: 'Thrift',
    principal: 500000,
    monthly: 45833.33,
    requested: '2026-08-14',
    start: '2026-09-01',
    end: '2027-08-31',
    status: 'ACTIVE',
  },
  {
    id: 3,
    type: 'Car loan',
    principal: 2400000,
    monthly: 112000,
    requested: '2026-02-02',
    start: '2026-03-01',
    end: '2028-02-28',
    status: 'REJECTED',
  },
  {
    id: 4,
    type: 'Personal loan',
    principal: 300000,
    monthly: 27500,
    requested: '2025-09-10',
    start: '2025-10-01',
    end: '2026-09-30',
    status: 'PAID_OFF',
  },
];

function Section({ title, description, children }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-section-title text-foreground">{title}</h2>
        {description ? <p className="max-w-[72ch] text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="w-32 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export default function DesignSystemPage() {
  const [date, setDate] = useState('2026-12-02');
  const [range, setRange] = useState({ from: '2026-12-02', to: '2026-12-09' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [panelState, setPanelState] = useState('data');
  const [page, setPage] = useState(1);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background px-4 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-12">
          <PageHeader
            title="Design system"
            description="The approved Orbit 360 tokens and shared components, rendered from the real code. Development only."
            actions={<Badge variant="outline">DESIGN.md</Badge>}
          />

          <Section
            title="Colour"
            description="Brand blue for the main action, active nav, links and focus. Status tones only for status. Everything else neutral."
          >
            <div className="flex flex-col gap-5">
              {SWATCHES.map(({ group, items }) => (
                <div key={group} className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">{group}</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                    {items.map(([name, className, hex]) => (
                      <div key={name} className="overflow-hidden rounded-lg border bg-card">
                        <div className={`h-12 border-b ${className}`} />
                        <div className="px-2.5 py-2 text-xs">
                          <div className="font-semibold">{name}</div>
                          <div className="font-mono text-muted-foreground">{hex}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Typography" description="Inter, six sizes. Money, counts and dates use tabular figures.">
            <div className="flex flex-col divide-y rounded-lg border bg-card px-5">
              <div className="py-3 text-page-title">Page title · 24/32</div>
              <div className="py-3 text-section-title">Section title · 18/28</div>
              <div className="py-3 text-card-title">Card title · 16/24</div>
              <div className="py-3 text-body">Body · 14/20 · Your leave request submitted on 02/12/2026 has been approved.</div>
              <div className="py-3 text-label text-gray-700">Label · 13/18</div>
              <div className="py-3 text-caption text-muted-foreground">Caption · 12/16</div>
              <div className="py-3 text-sm tabular-nums">
                {formatDate('2026-12-02')} · {formatDateRange('2026-12-01', '2027-02-28')} · {formatDateTime(new Date())} ·{' '}
                {formatCurrency(1250000)}
              </div>
            </div>
          </Section>

          <Section
            title="Buttons"
            description="No gradients or shadows. Text buttons have no icons. Solid red only confirms inside a dialog."
          >
            <div className="flex flex-col gap-4 rounded-lg border bg-card p-5">
              <Row label="Variants">
                <Button>Submit request</Button>
                <Button variant="secondary">Save draft</Button>
                <Button variant="ghost">Cancel</Button>
                <Button variant="link">View details</Button>
              </Row>
              <Row label="Destructive">
                <Button variant="destructive">Cancel request</Button>
                <Button variant="destructive-ghost" size="sm">
                  Remove
                </Button>
              </Row>
              <Row label="Small / disabled">
                <Button size="sm">Approve</Button>
                <Button size="sm" variant="secondary">
                  Reject
                </Button>
                <Button disabled>Submitting…</Button>
              </Row>
              <Row label="Icon-only">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" size="icon" aria-label="Refresh">
                      <RefreshCw aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh</TooltipContent>
                </Tooltip>
              </Row>
            </div>
          </Section>

          <Section title="Forms" description="Labels above fields. Errors appear under the field, never in a toast.">
            <div className="flex flex-col gap-6 rounded-lg border bg-card p-5">
              <FormSection title="Loan details" description="What you're requesting and for how long.">
                <FormField label="Loan type" htmlFor="ds-type" required>
                  <Select defaultValue="salary">
                    <SelectTrigger id="ds-type">
                      <SelectValue placeholder="Select a loan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary">Salary advance</SelectItem>
                      <SelectItem value="thrift">Thrift</SelectItem>
                      <SelectItem value="car">Car loan</SelectItem>
                      <SelectItem value="personal">Personal loan</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Principal amount" htmlFor="ds-amount" hint="Maximum ₦3,000,000 for a car loan">
                  <Input id="ds-amount" defaultValue="₦250,000.00" />
                </FormField>
                <FormField label="Tenure (months)" htmlFor="ds-tenure" error="Car loans can't be longer than 36 months">
                  <Input id="ds-tenure" defaultValue="48" aria-invalid="true" />
                </FormField>
                <FormField label="Start date" htmlFor="ds-date">
                  <DatePicker id="ds-date" value={date} onChange={setDate} />
                </FormField>
                <FormField label="Leave period" htmlFor="ds-range" hint="Weekends and holidays are greyed out">
                  <DateRangePicker
                    id="ds-range"
                    value={range}
                    onChange={setRange}
                    workingDaysOnly
                    holidays={['2026-12-25', '2026-12-26']}
                  />
                </FormField>
                <FormField label="Reason" htmlFor="ds-reason" className="sm:col-span-2">
                  <Textarea id="ds-reason" placeholder="e.g. School fees for the new term" />
                </FormField>
              </FormSection>
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox defaultChecked /> Deduct from payroll
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch defaultChecked /> Email me updates
                </label>
                <Tabs defaultValue="pending">
                  <TabsList>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="processed">Processed</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </Section>

          <Section title="Status" description="One map for every module. Unknown values still read as words.">
            <div className="flex flex-wrap gap-2 rounded-lg border bg-card p-5">
              {STATUS_EXAMPLES.map((status) => (
                <StatusBadge key={status} status={status} />
              ))}
            </div>
          </Section>

          <Section
            title="Table"
            description="DataPanel shell with loading, error and empty states; one ⋯ menu per row; the whole row opens details."
          >
            <div className="flex flex-wrap gap-2">
              {['data', 'loading', 'error', 'empty'].map((state) => (
                <Button
                  key={state}
                  size="sm"
                  variant={panelState === state ? 'default' : 'secondary'}
                  onClick={() => setPanelState(state)}
                >
                  {state.charAt(0).toUpperCase() + state.slice(1)}
                </Button>
              ))}
            </div>
            <DataPanel
              title="Your requests"
              count={LOANS.length}
              toolbar={
                <Select defaultValue="all">
                  <SelectTrigger className="h-8 w-40 text-[13px]" aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              }
              loading={panelState === 'loading'}
              error={panelState === 'error' ? 'Check your connection and try again.' : null}
              onRetry={() => setPanelState('data')}
              isEmpty={panelState === 'empty'}
              empty={{
                title: 'No loan requests yet',
                description:
                  'When you request a loan or thrift, it appears here with its approval status and repayment schedule.',
                action: <Button>New loan request</Button>,
              }}
              footer={<TablePagination page={page} pageSize={4} total={9} onPageChange={setPage} />}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Principal</TableHead>
                    <TableHead className="text-right">Monthly deduction</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Repayment period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {LOANS.map((loan) => (
                    <TableRow key={loan.id} className="cursor-pointer" onClick={() => toast(`Opened ${loan.type}`)}>
                      <TableCell>{loan.type}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(loan.principal)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(loan.monthly)}</TableCell>
                      <TableCell className="tabular-nums">{formatDate(loan.requested)}</TableCell>
                      <TableCell className="tabular-nums">{formatDateRange(loan.start, loan.end)}</TableCell>
                      <TableCell>
                        <StatusBadge status={loan.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <RowActions
                          label={`Loan · ${loan.type}`}
                          items={[
                            { label: 'View details', onSelect: () => toast(`Opened ${loan.type}`) },
                            {
                              label: 'Download schedule (CSV)',
                              onSelect: () => toast.success('Schedule downloaded'),
                              hidden: loan.status !== 'ACTIVE',
                            },
                            {
                              label: 'Cancel request…',
                              onSelect: () => setConfirmOpen(true),
                              destructive: true,
                              hidden: loan.status !== 'PENDING_REVIEW',
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataPanel>
            <div className="rounded-lg border bg-card">
              <EmptyState title="No notifications" description="Updates about your requests will appear here." />
            </div>
          </Section>

          <Section title="Stat cards" description="Neutral surface, no icons. Colour only when the number is itself a status.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Leave days left" value="14" hint="of 21 for 2026" />
              <StatCard label="Requests awaiting you" value="3" tone="pending" />
              <StatCard label="Active loans" value="1" />
              <StatCard label="Next payslip" value={formatDate('2026-12-24')} />
            </div>
          </Section>

          <Section
            title="Modal and toasts"
            description="Toasts: five tones, one shape, no buttons inside. Errors stay until dismissed."
          >
            <div className="flex flex-wrap gap-2 rounded-lg border bg-card p-5">
              <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
                Open confirmation
              </Button>
              <Button
                variant="secondary"
                onClick={() => toast.success('Leave request submitted', { description: 'Your supervisor has been notified.' })}
              >
                Success toast
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  toast.error("Couldn't load your payslips", { description: 'Check your connection and refresh the page.' })
                }
              >
                Error toast
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  toast.info('Loan approved', { description: 'Your loan request submitted on 02/12/2026 has been approved.' })
                }
              >
                Info toast
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  toast.warning('Session ends in 2 minutes', { description: 'Save your work to avoid losing changes.' })
                }
              >
                Pending toast
              </Button>
              <Button
                variant="secondary"
                onClick={() => toast('Loan request cancelled', { description: 'HR will no longer review it.' })}
              >
                Neutral toast
              </Button>
            </div>
          </Section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Cancel this loan request?"
        description="HR will stop reviewing it. You can submit a new request at any time."
        cancelLabel="Keep request"
        confirmLabel="Cancel request"
        destructive
        onConfirm={() => {
          setConfirmOpen(false);
          toast('Loan request cancelled', { description: 'HR will no longer review it.' });
        }}
      >
        <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-1.5">
          <dt className="text-[13px] text-muted-foreground">Type</dt>
          <dd>Salary advance</dd>
          <dt className="text-[13px] text-muted-foreground">Principal</dt>
          <dd className="tabular-nums">{formatCurrency(150000)}</dd>
          <dt className="text-[13px] text-muted-foreground">Requested</dt>
          <dd className="tabular-nums">{formatDate('2026-11-03')}</dd>
        </dl>
      </ConfirmDialog>
    </TooltipProvider>
  );
}
