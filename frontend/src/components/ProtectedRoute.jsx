import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "./Loader.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading, authError, restoreSession } = useAuth();
  const location = useLocation();

  if (loading) return <Loader />;

  if (authError) {
    return (
      <div className="page-narrow" role="alert">
        <p className="error-banner">{authError}</p>
        <button className="btn btn-outline" onClick={restoreSession}>
          Try again
        </button>
      </div>
    );
  }

  if (!user) {
    // Remember where the user was heading so login can send them back
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
