import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service here
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left', marginTop: '1rem', background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#0c4a6e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
