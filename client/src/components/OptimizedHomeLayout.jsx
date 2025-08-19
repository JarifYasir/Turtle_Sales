import React, { Suspense, lazy } from "react";
import { Outlet } from "react-router-dom";
import LoadingSpinner from "../components/LoadingComponents";
import ErrorBoundary from "../components/ErrorBoundary";

const OptimizedHomeLayout = () => {
  return (
    <ErrorBoundary>
      <div className="app-layout">
        <main className="main-content">
          <Suspense
            fallback={
              <LoadingSpinner
                size="large"
                text="Loading page..."
                variant="turtle"
                fullScreen={true}
              />
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default OptimizedHomeLayout;
