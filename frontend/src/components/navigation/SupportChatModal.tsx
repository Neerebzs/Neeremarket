import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useMe, useMessageThreads, useThread, useSendMessage } from '@/api/hooks';
import { getErrorMessage } from '@/api/client';
import { useModalFocus } from '@/components/ui/useModalFocus';
import styles from './SupportChatModal.module.css';

export function SupportChatModal({ open, onClose, returnTo = '/?support=1' }: { open: boolean; onClose: () => void; returnTo?: string }) {
  const dialog = useRef<HTMLElement>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);
  useModalFocus(dialog, open, onClose);
  const { data: user, isPending: checkingUser } = useMe();
  const threads = useMessageThreads(false, open && !!user);
  const [createdThread, setCreatedThread] = useState<{ userId: string; id: string } | null>(null);
  const threadId = (createdThread?.userId === user?.id ? createdThread?.id : undefined)
    || threads.data?.items.find(thread => thread.isSupport)?.id || '';
  const chat = useThread(open && user ? threadId : '', false, open);
  const send = useSendMessage();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { setDraft(''); setError(''); }, [user?.id]);
  useEffect(() => { if (open) messagesEnd.current?.scrollIntoView({ block: 'nearest' }); }, [chat.data?.messages.length, open]);
  const loading = checkingUser || (!!user && (threads.isLoading || threads.isFetching)) || (!!threadId && chat.isLoading);
  const loadError = threads.isError || chat.isError;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !draft.trim() || send.isPending || loading || loadError) return;
    setError('');
    try {
      const result = await send.mutateAsync({ ...(threadId ? { threadId } : { support: true }), body: draft.trim() });
      setCreatedThread({ userId: user.id, id: result.threadId });
      setDraft('');
    } catch (err) { setError(getErrorMessage(err, 'Message could not be sent. Please try again.')); }
  }

  if (!open) return null;
  return createPortal(<div className={styles.backdrop} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="support-chat-title" className={styles.dialog} tabIndex={-1}>
      <header className={styles.header}>
        <span className={styles.avatar} aria-hidden="true">N</span>
        <div><h2 id="support-chat-title">NeereMarket support</h2><p>Orders, payments, or a little help shopping.</p></div>
        <button type="button" onClick={onClose} className={styles.close} aria-label="Close support chat">×</button>
      </header>
      <div className={styles.conversation} role="log" aria-label="Support conversation" aria-live="polite" aria-relevant="additions text">
        <div className={styles.greeting}><strong>Welcome to NeereMarket 👋</strong><p>How can we help? Send a message and our support team can reply here.</p><span>Keep passwords and payment PINs private.</span></div>
        {loading ? <p className={styles.status}>Loading your conversation…</p> : null}
        {loadError ? <div className={styles.error} role="alert"><p>We couldn’t load your conversation.</p><button type="button" onClick={() => { void threads.refetch(); if (threadId) void chat.refetch(); }}>Try again</button></div> : null}
        {user && chat.data?.thread.customerId === user.id ? chat.data.messages.map(message => <div key={message.id} className={message.senderId === user.id ? styles.outgoing : styles.incoming}>
          <span className={styles.author}>{message.senderId === user.id ? 'You' : 'NeereMarket support'}</span>
          <p>{message.body}</p><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
        </div>) : null}
        {!checkingUser && !user ? <div className={styles.signIn}><p>Sign in to send a private message and keep track of replies.</p><Link to={`/login?next=${encodeURIComponent(returnTo)}`}>Sign in to chat →</Link></div> : null}
        <div ref={messagesEnd} />
      </div>
      {error ? <p className={styles.sendError} role="alert">{error}</p> : null}
      <form className={styles.composer} onSubmit={submit}>
        <label htmlFor="support-message">Your message</label>
        <div className={styles.inputRow}><textarea id="support-message" value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000} rows={2} placeholder="Type your message…" disabled={!user || loading || loadError || send.isPending} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
          <button type="submit" disabled={!user || !draft.trim() || send.isPending || loading || loadError} aria-label="Send support message">{send.isPending ? 'Sending…' : 'Send'} <span aria-hidden="true">↗</span></button>
        </div><span className={styles.hint}>Replies appear here. You can also continue in your Messages inbox.</span>
      </form>
    </section>
  </div>, document.body);
}
