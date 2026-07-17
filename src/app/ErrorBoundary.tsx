import { Component, type ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  /** Bumping this key (e.g. on route change) clears a caught error. */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors thrown inside the routed views and shows a recovery UI
 * ("Try again" clears the error in place; "Go home" navigates) WITHOUT a full
 * page reload — so unsaved settings/progress in memory survive.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props) {
    // Clear the error when the caller signals a change (route navigation).
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private handleTryAgain = () => this.setState({ error: null });

  private handleGoHome = () => {
    this.setState({ error: null });
    // Hash navigation — no full reload.
    window.location.hash = '#/';
  };

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary__card">
            <h1 tabIndex={-1} className="error-boundary__title">
              Something went wrong
            </h1>
            <p>
              This part of WaveMotion Studio hit an unexpected error. Your saved
              settings and progress are safe. You can try again or return to the
              home page.
            </p>
            <p className="error-boundary__detail">
              <code>{this.state.error.message}</code>
            </p>
            <div className="error-boundary__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={this.handleTryAgain}
              >
                Try again
              </button>
              <button
                type="button"
                className="btn"
                onClick={this.handleGoHome}
              >
                Go to home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
