import React from "react";

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // You can log this to a monitoring service
    // eslint-disable-next-line no-console
    console.error("UI ErrorBoundary caught: ", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div className="max-w-lg">
            <h1 className="text-2xl font-bold mb-3">Đã có lỗi hiển thị</h1>
            <p className="mb-4 text-muted-foreground">Có lỗi xảy ra khi render giao diện. Hãy thử tải lại trang hoặc quay lại trang trước.</p>
            {this.state.error && (
              <pre className="text-left text-xs bg-black/20 rounded p-3 overflow-auto">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-4">
              <button
                className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90"
                onClick={() => this.setState({ hasError: false, error: undefined })}
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
