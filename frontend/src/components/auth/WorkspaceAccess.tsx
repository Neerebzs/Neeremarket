import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMe } from '@/api/hooks';
import { Alert, Button, EmptyState, TableSkeleton } from '@/components/ui';
import { isAdminRole, isSellerRole, loginHref } from '@/utils/auth';
import { canAccessAdminSection } from '@/utils/adminAccess';
import { getErrorMessage } from '@/api/client';

export function WorkspaceAccess({ variant, children }: { variant: 'seller' | 'admin'; children: ReactNode }) {
  const query = useMe();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  if (query.isLoading) return <TableSkeleton rows={4} />;
  if (query.isError) return <><Alert tone="error">{getErrorMessage(query.error)}</Alert><Button variant="secondary" onClick={() => query.refetch()}>Retry session</Button></>;
  if (!query.data) return <EmptyState title="Sign in to your workspace" description={`Use your ${variant} account to continue.`} actionLabel="Sign in" onAction={() => navigate(loginHref(pathname))} />;
  const allowed = variant === 'seller' ? isSellerRole(query.data.roles) : isAdminRole(query.data.roles) && canAccessAdminSection(query.data, pathname.split('/')[2] || 'overview');
  if (!allowed) return <EmptyState title="Access restricted" description="Your account does not have access to this workspace section." actionLabel="Return to marketplace" onAction={() => navigate('/')} />;
  return <>{children}</>;
}
