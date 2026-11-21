import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ZEBRO Runtime Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/overview';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-black text-chalk flex items-center justify-center p-6 select-none">
          <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/20" />
              <h1 className="font-condensed text-base uppercase font-bold tracking-wider text-chalk">
                Telemetry Console Interruption
              </h1>
            </div>

            <p className="text-xs text-chalk-dim mb-4 leading-relaxed">
              A runtime anomaly occurred while rendering orbital projections or evaluating conjunction state.
              Underlying telemetry feeds and calculation modules remain secure.
            </p>

            {this.state.error && (
              <div className="bg-black/60 border border-white/10 rounded-lg p-3 mb-5 font-mono text-[11px] text-rose-300 break-all leading-normal">
                {this.state.error.message || 'Unknown orbital rendering error'}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2 px-3 rounded-lg bg-sky text-navy-950 font-bold text-xs hover:bg-sky-light transition-colors"
              >
                Reload Console
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2 px-3 rounded-lg bg-white/10 text-chalk font-semibold text-xs hover:bg-white/15 transition-colors border border-white/10"
              >
                Return to Overview
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
