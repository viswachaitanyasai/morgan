import { useState, useEffect } from 'react';
import { FaCalendarAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from 'react-toastify';
import { ClipLoader } from "react-spinners";


function AllHackathonPages() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hackathons, setHackathons] = useState([]);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchHackathons = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${backendUrl}/api/students/hackathons`);
        const data = await response.json();
        if (data.hackathons) {
          setHackathons(data.hackathons.map(h => ({
            ...h,
            status: getHackathonStatus(h.start_date, h.end_date)
          })));
        }
      } catch (error) {
        toast.error("Failed to load hackathons");
      } finally {
        setLoading(false);
      }
    };
    fetchHackathons();
  }, []);

  const getHackathonStatus = (start, end) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (now < startDate) return { text: "Upcoming", color: "bg-purple-500" };
    if (now > endDate) return { text: "Completed", color: "bg-gray-500" };
    return { text: "Live Now", color: "bg-green-500" };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
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
      className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800"
    >
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-16 text-center"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-3">
            Explore Challenges
          </h1>
          <p className="text-gray-400 text-lg">Discover upcoming and ongoing competitions</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-14">
          {hackathons.map((hackathon, index) => (
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
                  <span className={`${hackathon.status.color} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                    {hackathon.status.text}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-100 mb-3">{hackathon.title}</h3>
                <div className="flex items-center space-x-4 text-gray-400">
                  <div className="flex items-center space-x-2">
                    <FaCalendarAlt className="text-cyan-400 flex-shrink-0" />
                    <span>{formatDate(hackathon.start_date)} - {formatDate(hackathon.end_date)}</span>
                  </div>
                </div>
                <p className="text-gray-400 line-clamp-3 mb-6">{hackathon.description}</p>
                <div className="flex justify-end">
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg">
                    View Details →
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default AllHackathonPages;