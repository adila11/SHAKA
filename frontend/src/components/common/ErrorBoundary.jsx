import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI exception in ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0e0e10] text-[#e8e8ea]">
          <div className="max-w-md w-full p-8 rounded-3xl border border-[#26262b] bg-[#17171a] shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#d97070]/15 text-[#d97070] flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#e8e8ea]">
                Something unexpected happened
              </h2>
              <p className="text-xs text-[#8a8a93] mt-2 leading-relaxed">
                An unexpected interface issue occurred. Your financial records and data remain safe.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-[#c9b27c] to-[#a68d55] text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#c9b27c]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

