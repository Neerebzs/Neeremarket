import { useState, type FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  useAgakaye,
  useDeleteAgakaye,
  useSaveAgakaye,
  type AgakayeEntry,
  type AgakayeKind,
  type AgakayeStatus,
} from '@/api/hooks';
import { Alert, Badge, Button, EmptyState, Input, TableSkeleton, useConfirm, useToast } from '@/components/ui';
import { ICONS, MetricIcon } from '@/components/dashboard/metrics';
import { getErrorMessage } from '@/api/client';
import { formatRwf } from '@/utils/money';
import { normalizeRwandaPhone } from '@/utils/phone';
import styles from '@/pages/workspace/workspace.module.css';
import page from './SellerAgakayePage.module.css';

const FILTERS: Array<{ id: AgakayeStatus | 'ALL'; label: string }> = [
  { id: 'OUTSTANDING', label: 'Still out' },
  { id: 'RETURNED', label: 'Returned' },
  { id: 'ALL', label: 'All' },
];

type Form = {
  kind: AgakayeKind;
  borrowerName: string;
  borrowerPhone: string;
  itemName: string;
  quantity: string;
  amount: string;
  lentAt: string;
  dueAt: string;
  notes: string;
};

// Local calendar date (toISOString would give the UTC date, i.e. yesterday just after midnight in Kigali).
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const emptyForm = (): Form => ({
  kind: 'ITEM',
  borrowerName: '',
  borrowerPhone: '',
  itemName: '',
  quantity: '1',
  amount: '',
  lentAt: today(),
  dueAt: '',
  notes: '',
});

function toForm(e: AgakayeEntry): Form {
  return {
    kind: e.kind,
    borrowerName: e.borrowerName,
    borrowerPhone: e.borrowerPhone || '',
    itemName: e.itemName || '',
    quantity: String(e.quantity),
    amount: e.amount || '',
    lentAt: e.lentAt.slice(0, 10),
    dueAt: e.dueAt ? e.dueAt.slice(0, 10) : '',
    notes: e.notes || '',
  };
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function whatWasLent(e: AgakayeEntry) {
  if (e.kind === 'MONEY') return formatRwf(e.amount || 0);
  return e.quantity > 1 ? `${e.itemName} × ${e.quantity}` : e.itemName || 'Item';
}

export function SellerAgakayePage() {
  const confirm = useConfirm();
  const toast = useToast();
  const [status, setStatus] = useState<AgakayeStatus | 'ALL'>('OUTSTANDING');
  const [q, setQ] = useState('');
  const { data, isLoading, isError, error } = useAgakaye({
    ...(status === 'ALL' ? {} : { status }),
    ...(q.trim() ? { q: q.trim() } : {}),
  });
  const save = useSaveAgakaye();
  const remove = useDeleteAgakaye();
  const [form, setForm] = useState<Form>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  function startEdit(entry: AgakayeEntry) {
    setEditingId(entry.id);
    setForm(toForm(entry));
    setFormError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const phone = form.borrowerPhone.trim() ? normalizeRwandaPhone(form.borrowerPhone) : null;
    if (form.borrowerPhone.trim() && !phone) {
      setFormError('Enter a valid phone number, such as 0780 000 000, or leave it empty.');
      return;
    }
    const amount = form.amount ? Number(form.amount) : null;
    if (form.kind === 'MONEY' && (!amount || !Number.isInteger(amount) || amount <= 0)) {
      setFormError('Enter the amount lent in whole RWF.');
      return;
    }
    if (form.dueAt && form.dueAt < form.lentAt) {
      setFormError('The return date cannot be before the day it was lent.');
      return;
    }
    try {
      await save.mutateAsync({
        ...(editingId ? { id: editingId } : {}),
        kind: form.kind,
        borrowerName: form.borrowerName.trim(),
        borrowerPhone: phone,
        itemName: form.kind === 'ITEM' ? form.itemName.trim() : null,
        quantity: form.kind === 'ITEM' ? Math.max(1, Number(form.quantity) || 1) : 1,
        amount,
        lentAt: form.lentAt,
        dueAt: form.dueAt || null,
        notes: form.notes.trim() || null,
      });
      toast.success(editingId ? 'Entry updated' : 'Saved to Agakaye');
      resetForm();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  }

  async function toggleReturned(entry: AgakayeEntry) {
    const next: AgakayeStatus = entry.status === 'OUTSTANDING' ? 'RETURNED' : 'OUTSTANDING';
    try {
      await save.mutateAsync({ id: entry.id, status: next });
      toast.success(next === 'RETURNED' ? `${entry.borrowerName} returned ${whatWasLent(entry)}` : 'Marked as still out');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function onDelete(entry: AgakayeEntry) {
    const ok = await confirm({
      title: 'Delete this entry',
      message: `Delete the record of ${whatWasLent(entry)} lent to ${entry.borrowerName}? This cannot be undone.`,
      confirmText: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await remove.mutateAsync(entry.id);
      if (editingId === entry.id) resetForm();
      toast.success('Entry deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const items = data?.items || [];
  const summary = data?.summary;

  return (
    <div className={styles.stack}>
      <Helmet>
        <title>Agakaye | NeereMarket</title>
      </Helmet>

      <header className={styles.pageHead}>
        <div className={styles.pageHeadCopy}>
          <p className={styles.kicker}>Seller notebook</p>
          <h1>Agakaye</h1>
          <p className={styles.muted}>
            Note everything you lend for a short time, money or items, and who has it. Only you can see this.
          </p>
        </div>
      </header>

      <section className={styles.kpis} aria-label="Agakaye summary">
        <article className={styles.kpi}>
          <div className={styles.kpiHead}>
            <span className={styles.kpiIcon} data-tone="brand">
              <MetricIcon path={ICONS.box} />
            </span>
            <span>Still out</span>
          </div>
          <strong>{summary?.outstanding ?? 0}</strong>
          <em>Not yet returned</em>
        </article>
        <article className={styles.kpi}>
          <div className={styles.kpiHead}>
            <span className={styles.kpiIcon} data-tone="ok">
              <MetricIcon path={ICONS.wallet} />
            </span>
            <span>Money lent out</span>
          </div>
          <strong>{formatRwf(summary?.moneyOutstanding || 0)}</strong>
          <em>Waiting to be paid back</em>
        </article>
        <article className={styles.kpi}>
          <div className={styles.kpiHead}>
            <span className={styles.kpiIcon} data-tone={summary?.overdue ? 'warn' : 'accent'}>
              <MetricIcon path={ICONS.hold} />
            </span>
            <span>Overdue</span>
          </div>
          <strong>{summary?.overdue ?? 0}</strong>
          <em>Past the return date</em>
        </article>
      </section>

      <section className={styles.split}>
        <article className={styles.panel}>
          <div className={styles.toolbar}>
            <div className={styles.filters} role="group" aria-label="Show entries">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`${styles.chip} ${status === f.id ? styles.chipOn : ''}`}
                  onClick={() => setStatus(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <input
              className={page.search}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, phone, item…"
              aria-label="Search Agakaye"
            />
          </div>

          {isLoading ? <TableSkeleton rows={4} /> : null}
          {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}

          {!isLoading && !items.length ? (
            <div className={styles.panelBody}>
              <EmptyState
                compact
                title={q || status !== 'OUTSTANDING' ? 'Nothing found' : 'Nothing lent out'}
                description={q || status !== 'OUTSTANDING' ? 'Try another filter or search.' : 'When you lend something, note it here so you remember who has it.'}
              />
            </div>
          ) : (
            <ul className={page.list}>
              {items.map((entry) => (
                <li key={entry.id} className={styles.mobileCard} data-returned={entry.status === 'RETURNED' || undefined}>
                  <div className={styles.mobileCardHead}>
                    <div>
                      <h3 className={styles.mobileCardTitle}>{entry.borrowerName}</h3>
                      {entry.borrowerPhone ? (
                        <a className={styles.mobileCardSubtitle} href={`tel:${entry.borrowerPhone}`}>
                          {entry.borrowerPhone}
                        </a>
                      ) : null}
                    </div>
                    {entry.status === 'RETURNED' ? (
                      <Badge tone="success">Returned</Badge>
                    ) : entry.isOverdue ? (
                      <Badge tone="danger">Overdue</Badge>
                    ) : (
                      <Badge tone="warning">Still out</Badge>
                    )}
                  </div>

                  <div className={page.what}>
                    <span className={styles.attrChip}>{entry.kind === 'MONEY' ? 'Money' : 'Item'}</span>
                    <strong>{whatWasLent(entry)}</strong>
                    {entry.kind === 'ITEM' && entry.amount ? (
                      <span className={styles.muted}>worth about {formatRwf(entry.amount)}</span>
                    ) : null}
                  </div>

                  <dl className={page.dates}>
                    <div>
                      <dt>Lent</dt>
                      <dd>{formatDay(entry.lentAt)}</dd>
                    </div>
                    <div>
                      <dt>{entry.status === 'RETURNED' ? 'Returned' : 'Due back'}</dt>
                      <dd>
                        {entry.status === 'RETURNED' && entry.returnedAt
                          ? formatDay(entry.returnedAt)
                          : entry.dueAt
                            ? formatDay(entry.dueAt)
                            : 'No date set'}
                      </dd>
                    </div>
                  </dl>

                  {entry.notes ? <p className={page.notes}>{entry.notes}</p> : null}

                  <div className={page.actions}>
                    <Button
                      type="button"
                      size="sm"
                      variant={entry.status === 'OUTSTANDING' ? 'primary' : 'secondary'}
                      disabled={save.isPending}
                      onClick={() => void toggleReturned(entry)}
                    >
                      {entry.status === 'OUTSTANDING' ? 'Mark returned' : 'Reopen'}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => startEdit(entry)}>
                      Edit
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => void onDelete(entry)}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>{editingId ? 'Edit entry' : 'Note something lent'}</h2>
          </div>
          <div className={styles.panelBody}>
            <form className={styles.form} onSubmit={onSubmit}>
              <div className={styles.filters} role="group" aria-label="Money or an item">
                {(['ITEM', 'MONEY'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`${styles.chip} ${form.kind === k ? styles.chipOn : ''}`}
                    aria-pressed={form.kind === k}
                    onClick={() => set({ kind: k })}
                  >
                    {k === 'ITEM' ? 'An item' : 'Money'}
                  </button>
                ))}
              </div>

              <Input
                label="Who borrowed it?"
                value={form.borrowerName}
                onChange={(e) => set({ borrowerName: e.target.value })}
                maxLength={120}
                required
              />
              <Input
                label="Their phone (optional)"
                type="tel"
                inputMode="tel"
                value={form.borrowerPhone}
                onChange={(e) => set({ borrowerPhone: e.target.value })}
                placeholder="0780 000 000"
              />

              {form.kind === 'MONEY' ? (
                <Input
                  label="Amount (RWF)"
                  type="number"
                  min={1}
                  step={1}
                  value={form.amount}
                  onChange={(e) => set({ amount: e.target.value })}
                  required
                />
              ) : (
                <>
                  <Input
                    label="What did you lend?"
                    value={form.itemName}
                    onChange={(e) => set({ itemName: e.target.value })}
                    placeholder="Pen, shoes, lamp…"
                    maxLength={120}
                    required
                  />
                  <Input
                    label="How many?"
                    type="number"
                    min={1}
                    step={1}
                    value={form.quantity}
                    onChange={(e) => set({ quantity: e.target.value })}
                  />
                  <Input
                    label="Value in RWF (optional)"
                    type="number"
                    min={1}
                    step={1}
                    value={form.amount}
                    onChange={(e) => set({ amount: e.target.value })}
                  />
                </>
              )}

              <Input
                label="Lent on"
                type="date"
                value={form.lentAt}
                max={today()}
                onChange={(e) => set({ lentAt: e.target.value })}
                required
              />
              <Input
                label="Due back (optional)"
                type="date"
                value={form.dueAt}
                min={form.lentAt}
                onChange={(e) => set({ dueAt: e.target.value })}
              />
              <label className={styles.select}>
                Notes (optional)
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={form.notes}
                  onChange={(e) => set({ notes: e.target.value })}
                />
              </label>

              {formError ? <Alert tone="error">{formError}</Alert> : null}

              <div className={page.actions}>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? 'Saving…' : editingId ? 'Save changes' : 'Save to Agakaye'}
                </Button>
                {editingId ? (
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </div>
        </article>
      </section>
    </div>
  );
}
