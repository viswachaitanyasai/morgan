import { useState, useEffect } from 'react';
import { FaTimes, FaLock, FaUnlock, FaCalendarAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getAuthCookie } from '../utils/Cookie';
import { ClipLoader } from "react-spinners";
import { toast } from 'react-toastify';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

function MyHackathon() {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [passkey, setPasskey] = useState("");
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const fetchHackathons = async () => {
    try {
      const token = getAuthCookie("authToken");
      const response = await fetch(`${backendUrl}/api/students/myhackathons`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setHackathons(data.hackathons);
      } else {
        toast.error(data.error || "Failed to fetch hackathons");
      }
    } catch (error) {
      toast.error("An error occurred while fetching hackathons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, []);

  const handleJoinWithCode = async () => {
    if (inviteCode.trim() === "") {
      toast.error("Please enter an invite code");
      return;
    }
    setJoining(true);
    try {
      const token = getAuthCookie("authToken");
      const response = await fetch(`${backendUrl}/api/students/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ invite_code: inviteCode, passkey: "" })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success("Successfully joined the hackathon!");
        fetchHackathons();
        setInviteCode("");
      } else if (data.error && data.error.includes("Passkey is required")) {
        setShowModal(true);
      } else {
        toast.error(data.error || "Failed to join hackathon.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  
  const handleSubmitPasskey = async (e) => {
    e.preventDefault();
    setShowModal(false);
    setJoining(true);
    try {
      const token = getAuthCookie("authToken");
      const response = await fetch(`${backendUrl}/api/students/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          invite_code: inviteCode,
          passkey: passkey
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Successfully joined the hackathon!");
        fetchHackathons();
      } else {
        toast.error(data.error || "Failed to join hackathon.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setInviteCode("");
      setPasskey("");
      setJoining(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatus = (start, end) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (now < startDate) return { text: "Upcoming", color: "bg-purple-500" };
    if (now > endDate) return { text: "Completed", color: "bg-gray-500" };
    return { text: "Live Now", color: "bg-green-500" };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <ClipLoader color="#00BFFF" size={60} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800"
    >
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">

        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gray-800 rounded-2xl p-8 mb-12 shadow-xl"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                My Hackathons
              </h1>
              <p className="text-gray-400">Join new challenges or manage existing participations</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full max-w-xl">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                onClick={handleJoinWithCode}
                disabled={joining}
              >
                {joining ? (
                  <ClipLoader color="#ffffff" size={20} />
                ) : (
                  <>
                    <FaUnlock className="text-lg" />
                    Join Hackathon
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
        >
          {hackathons.length > 0 ? (
            hackathons.map((hackathon, index) => {
              const status = getStatus(hackathon.start_date, hackathon.end_date);
              return (
                <motion.div
                  key={hackathon._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/view-hackathon/${hackathon._id}`)}
                >
                  <div className="relative aspect-video overflow-hidden rounded-t-2xl">
                    <img 
                      src={hackathon.image_url} 
                      alt={hackathon.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://buildez-bucket.s3.ap-south-1.amazonaws.com/uploads/1743023195862_1.webp";
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 p-4">
                      <span className={`${status.color} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                        {status.text}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-100 mb-3">{hackathon.title}</h3>
                    <div className="flex items-center gap-2 text-gray-400">
                      <FaCalendarAlt className="text-cyan-400 flex-shrink-0" />
                      <span>{formatDate(hackathon.start_date)} - {formatDate(hackathon.end_date)}</span>
                    </div>
                    <p className="text-gray-400 line-clamp-3">{hackathon.description}</p>
                    <div className="flex justify-end">
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg">
                        View Details →
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            )
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full bg-gray-800 rounded-2xl p-8 text-center"
            >
              <div className="max-w-md mx-auto">
                <div className="mb-6 text-cyan-400 text-6xl"></div>
                <h3 className="text-2xl font-semibold text-gray-300 mb-4">No Active Hackathons</h3>
                <p className="text-gray-400 mb-6">Join hackathons using invite codes or browse public challenges</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl font-medium transition-all"
                  onClick={() => navigate('/all-hackathons')}
                >
                  Explore Hackathons
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl"
              >

                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-cyan-400">Secure Access Required</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-200"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>

                <form onSubmit={handleSubmitPasskey}>
                  <div className="mb-6">
                    <label className="block text-gray-300 mb-2">Passkey for {inviteCode}</label>
                    <input
                      type="password"
                      value={passkey}
                      onChange={(e) => setPasskey(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Enter secret passkey"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                    >
                      <FaLock />
                      Confirm Join
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}

export default MyHackathon;