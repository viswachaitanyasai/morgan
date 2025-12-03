import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/Cookie';

const ProtectedRoute = () => {
  const location = useLocation();
  
  if (!isAuthenticated()) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;
