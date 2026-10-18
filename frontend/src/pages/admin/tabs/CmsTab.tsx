import { useState, type FormEvent } from 'react';
import {
  useCmsBanners,
  useCmsPages,
  useUpsertBanner,
  useUpsertPage,
} from '@/api/hooks';
import {
  Alert,
  Badge,
  Button,
  Input,
} from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import styles from '@/pages/workspace/workspace.module.css';

export function CmsTab() {
  const banners = useCmsBanners();
  const pages = useCmsPages();
  const upsertBanner = useUpsertBanner();
  const upsertPage = useUpsertPage();
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerImage, setBannerImage] = useState('https://placehold.co/1200x400/2d5173/ffffff?text=Banner');
  const [pageSlug, setPageSlug] = useState('help');
  const [pageTitle, setPageTitle] = useState('Help');
  const [pageBody, setPageBody] = useState('How can we help?');
  const [msg, setMsg] = useState<string | null>(null);

  async function onBanner(e: FormEvent) {
    e.preventDefault();
    try {
      await upsertBanner.mutateAsync({
        title: bannerTitle,
        imageUrl: bannerImage,
        isActive: true,
      });
      setBannerTitle('');
      setMsg('Banner saved');
    } catch (err) {
      setMsg(getErrorMessage(err));
    }
  }

  async function onPage(e: FormEvent) {
    e.preventDefault();
    try {
      await upsertPage.mutateAsync({
        slug: pageSlug,
        title: pageTitle,
        body: pageBody,
        isPublished: true,
      });
      setMsg('Page saved');
    } catch (err) {
      setMsg(getErrorMessage(err));
    }
  }

  return (
    <>

      {msg ? <Alert tone="success">{msg}</Alert> : null}
      <div className={styles.cmsGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>New banner</h2>
          </div>
          <div className={styles.panelBody}>
            <form className={styles.form} onSubmit={onBanner}>
              <Input label="Title" value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} required />
              <Input label="Image URL" value={bannerImage} onChange={(e) => setBannerImage(e.target.value)} required />
              <Button type="submit" disabled={upsertBanner.isPending}>
                Save banner
              </Button>
            </form>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Banner</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(banners.data || []).map((b) => (
                  <tr key={b.id}>
                    <td>{b.title}</td>
                    <td>
                      <Badge tone={b.isActive ? 'success' : 'muted'}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>CMS page</h2>
          </div>
          <div className={styles.panelBody}>
            <form className={styles.form} onSubmit={onPage}>
              <Input label="Slug" value={pageSlug} onChange={(e) => setPageSlug(e.target.value)} required />
              <Input label="Title" value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} required />
              <label className={styles.select}>
                Body
                <textarea value={pageBody} onChange={(e) => setPageBody(e.target.value)} rows={4} required />
              </label>
              <Button type="submit" disabled={upsertPage.isPending}>
                Publish page
              </Button>
            </form>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(pages.data || []).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.title}</strong>
                      <small>/{p.slug}</small>
                    </td>
                    <td>
                      <Badge tone={p.isPublished ? 'success' : 'muted'}>
                        {p.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </>
  );
}
