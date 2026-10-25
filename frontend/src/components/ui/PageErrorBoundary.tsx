import { Component, type ErrorInfo, type ReactNode } from 'react';

export class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { /* Keep customer data out of browser logs. */ }
  render() {
    if (this.state.failed) return <main className="container" style={{ paddingBlock: '4rem' }}><h1>We couldn’t open this page</h1><p>Your saved account and store data are still available. Reload to try again.</p><button type="button" onClick={() => window.location.reload()}>Reload page</button></main>;
    return this.props.children;
  }
}
