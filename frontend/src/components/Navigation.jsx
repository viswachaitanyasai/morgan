import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, logoutUser } from '../utils/Cookie';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaBars, FaTimes } from 'react-icons/fa';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authenticated = isAuthenticated();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logoutUser();
    toast.success("Logged out successfully");
    navigate('/auth');
  };

  const NavLink = ({ to, children }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={`px-3 py-2 rounded-md text-sm font-medium ${
          isActive 
            ? 'bg-gray-700 text-white' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        } transition duration-300`}
      >
        {children}
      </Link>
    );
  };

  return (
    <nav className="bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <span className="text-cyan-400 text-xl font-bold">EduHack</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink to="/all-hackathons">All Hackathons</NavLink>
              {authenticated && <NavLink to="/my-hackathons">My Hackathons</NavLink>}
              {authenticated ? (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded-md text-sm font-medium transition duration-300"
                >
                  Logout
                </motion.button>
              ) : (
                <NavLink to="/auth">Sign In / Register</NavLink>
              )}
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              {isOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
          
        </div>
      </div>

      
      <motion.div 
        className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <NavLink to="/all-hackathons">All Hackathons</NavLink>
          {authenticated && <NavLink to="/my-hackathons">My Hackathons</NavLink>}
          {authenticated ? (
            <button 
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white bg-cyan-600 hover:bg-cyan-700 transition duration-300"
            >
              Logout
            </button>
          ) : (
            <NavLink to="/auth">Sign In / Register</NavLink>
          )}
        </div>
      </motion.div>
    </nav>
  );
};

export default Navigation;
