import { useState, type FormEvent } from 'react';
import { useAdminSettings, useUpsertSetting } from '@/api/hooks';
import {
  Alert,
  Button,
  Input,
  TableSkeleton,
} from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import styles from '@/pages/workspace/workspace.module.css';

export function SettingsTab() {
  const { data, isLoading, isError, error } = useAdminSettings();
  const upsert = useUpsertSetting();
  const [key, setKey] = useState('return_window_days');
  const [value, setValue] = useState('7');
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      let parsed: unknown = value;
      try {
        parsed = JSON.parse(value);
      } catch {
        const n = Number(value);
        parsed = Number.isNaN(n) ? value : n;
      }
      await upsert.mutateAsync({ key, value: parsed });
      setMsg('Setting saved');
    } catch (err) {
      setMsg(getErrorMessage(err));
    }
  }

  return (
    <>

      <div className={styles.split}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Current settings</h2>
        </div>
        {msg ? (
          <div className={styles.panelBody}>
            <Alert tone="success">{msg}</Alert>
          </div>
        ) : null}
        {isLoading ? <TableSkeleton rows={4} /> : null}
        {isError ? <Alert tone="error">{getErrorMessage(error)}</Alert> : null}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.key}</strong>
                  </td>
                  <td>
                    <small>{JSON.stringify(s.value)}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Update setting</h2>
        </div>
        <div className={styles.panelBody}>
          <form className={styles.form} onSubmit={onSubmit}>
            <Input label="Key" value={key} onChange={(e) => setKey(e.target.value)} required />
            <Input label="Value (JSON or number)" value={value} onChange={(e) => setValue(e.target.value)} required />
            <Button type="submit" disabled={upsert.isPending}>
              Save setting
            </Button>
          </form>
        </div>
      </section>
    </div>
    </>
  );
}
