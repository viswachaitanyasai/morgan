import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import AuthPages from './pages/AuthPages';
import AllHackathonPages from './pages/AllHackathon';
import MyHackathonPage from './pages/MyHackathon';
import ViewHackathonPage from './pages/ViewHackthon';
import ViewResultPage from './pages/ViewResult';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Navigation />
      <Routes>
        <Route path="/" element={<AllHackathonPages />} />
        <Route path="/auth" element={<AuthPages />} />
        <Route path="/all-hackathons" element={<AllHackathonPages />} />
        <Route path="/view-hackathon/:id" element={<ViewHackathonPage />} />
        
      
        <Route element={<ProtectedRoute />}>
          <Route path="/my-hackathons" element={<MyHackathonPage />} />
          <Route path="/view-result/:id" element={<ViewResultPage />} />
        </Route>
        
      
        <Route path="*" element={<div className="flex justify-center items-center h-screen bg-gray-900 text-white text-2xl">Page not found</div>} />
      </Routes>
    </Router>
  );
}


export default App;