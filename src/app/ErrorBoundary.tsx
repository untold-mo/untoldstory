import React, { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err?.message || 'خطأ غير متوقع' };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', err, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-slate-950 text-slate-100 font-sans"
          dir="rtl"
        >
          <h1 className="text-xl font-bold">تعذّر تحميل الشاشة</h1>
          <p className="text-slate-400 text-sm max-w-md text-center">
            حدث خطأ في الواجهة. جرّب تحديث الصفحة. إذا تكرّر، راجع وحدة التحكم (Console) أو سجلات الخادم.
          </p>
          {this.state.message ? (
            <pre className="text-xs text-rose-300 bg-slate-900/80 p-3 rounded-lg max-w-lg overflow-auto">
              {this.state.message}
            </pre>
          ) : null}
          <button
            type="button"
            className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium"
            onClick={() => window.location.reload()}
          >
            إعادة تحميل
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
