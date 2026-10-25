import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { api, type ApiSuccess, getErrorMessage } from '@/api/client';
import { Alert, Button, EmptyState, TableSkeleton } from '@/components/ui';

export function ContentPage({ slug, title }: { slug: string; title: string }) {
  const query = useQuery({
    queryKey: ['public-page', slug], retry: false,
    queryFn: async () => (await api.get<ApiSuccess<{ page: { title: string; body: string; updatedAt: string } }>>(`/cms/pages/${slug}`)).data.data.page,
  });
  const missing = query.isError && (query.error as { response?: { status?: number } })?.response?.status === 404;
  return <article className="container" style={{ paddingBlock: '2rem 4rem', maxWidth: '56rem' }}>
    <Helmet><title>{query.data?.title || title} | NeereMarket</title></Helmet>
    <h1>{query.data?.title || title}</h1>
    {query.isLoading ? <TableSkeleton /> : null}
    {missing ? <EmptyState title={`${title} is not published yet`} description="Please contact NeereMarket for the latest information."><Link to="/contact">Contact NeereMarket</Link></EmptyState> : null}
    {query.isError && !missing ? <><Alert tone="error">{getErrorMessage(query.error)}</Alert><Button variant="secondary" onClick={() => query.refetch()}>Retry page</Button></> : null}
    {query.data ? <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.75, marginTop: '1.5rem' }}>{query.data.body}</div> : null}
  </article>;
}
