import React, { lazy, Suspense } from 'react';

/**
 * Lazily-loaded heavy tab components. Each export is a drop-in replacement for the
 * original named export (same props), wrapped in its own Suspense boundary with a
 * small spinner, so App.tsx only needs its import lines changed.
 */

const TabSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
    <div className="h-8 w-8 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
    <span className="sr-only">Đang tải...</span>
  </div>
);

function lazyWithSuspense<T extends React.ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  const LazyComponent = lazy(factory);
  const Wrapped = (props: React.ComponentProps<T>) => (
    <Suspense fallback={<TabSpinner />}>
      <LazyComponent {...(props as any)} />
    </Suspense>
  );
  return Wrapped;
}

export const MktProcessManager = lazyWithSuspense(() =>
  import('./MktProcessManager').then((m) => ({ default: m.MktProcessManager })));
export const DoiUngProcessManager = lazyWithSuspense(() =>
  import('./DoiUngProcessManager').then((m) => ({ default: m.DoiUngProcessManager })));
export const AcceptanceManager = lazyWithSuspense(() =>
  import('./AcceptanceManager').then((m) => ({ default: m.AcceptanceManager })));
export const BlockReciprocalRegistration = lazyWithSuspense(() =>
  import('./BlockReciprocalRegistration').then((m) => ({ default: m.BlockReciprocalRegistration })));
export const AdminReciprocalBudgets = lazyWithSuspense(() =>
  import('./AdminReciprocalBudgets').then((m) => ({ default: m.AdminReciprocalBudgets })));
export const BanKdManager = lazyWithSuspense(() =>
  import('./BanKdManager').then((m) => ({ default: m.BanKdManager })));
export const BanKdManagementView = lazyWithSuspense(() =>
  import('./BanKdManagementView').then((m) => ({ default: m.BanKdManagementView })));
export const GitHubBackupManager = lazyWithSuspense(() =>
  import('./GitHubBackupManager').then((m) => ({ default: m.GitHubBackupManager })));
