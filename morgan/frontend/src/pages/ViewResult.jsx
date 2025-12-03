import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { isAuthenticated, getAuthCookie } from '../utils/Cookie';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaRegCheckCircle, FaRegLightbulb, FaChartLine, FaMedal, FaFileAlt } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

function ViewResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const authenticated = isAuthenticated();

  useEffect(() => {
    if (!authenticated) {
      toast.error("Please sign in to view results");
      navigate('/auth');
      return;
    }

    const fetchResult = async () => {
      setLoading(true);
      try {
        const token = getAuthCookie("authToken");
        const response = await fetch(`${backendUrl}/api/students/results/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch evaluation result");
        }

        const data = await response.json();
        const {
          evaluation_category,
          improvement,
          actionable_steps,
          strengths,
          overall_reason,
          summary,
        } = data;

        setResult({
          evaluation_category,
          improvement,
          actionable_steps,
          strengths,
          overall_reason,
          summary,
        });
      } catch (error) {
        console.error("Error fetching result:", error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  const categoryStyles = {
    shortlisted: "from-green-500 to-emerald-600",
    rejected: "from-red-500 to-rose-600"
  };

  const SectionCard = ({ title, icon, children }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl p-6 shadow-lg"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-gray-700 rounded-lg text-cyan-400">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-gray-100">{title}</h3>
      </div>
      {children}
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex justify-center items-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <ClipLoader color="#00BFFF" size={50} />
        </motion.div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-gray-800 rounded-2xl shadow-xl">
          <div className="mb-6 text-6xl">😞</div>
          <h1 className="text-3xl font-bold text-gray-100 mb-4">Result Not Found</h1>
          <p className="text-gray-400 mb-8">The requested evaluation result could not be found.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl font-medium transition-all"
          >
            Return to Hackathon
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl transition-all"
          >
            <FaArrowLeft />
            <span>Back</span>
          </motion.button>

          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Evaluation Results
          </h1>

        </div>

        <div className="space-y-8">

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`bg-gradient-to-r ${categoryStyles[result.evaluation_category]} p-6 rounded-2xl shadow-xl`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Final Verdict</h2>
                <p className="text-gray-200 font-medium capitalize">
                  {result.evaluation_category}
                </p>
              </div>
              <FaRegCheckCircle className="text-4xl text-white opacity-50" />
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            <SectionCard title="Summary" icon={<FaFileAlt className="text-xl" />}>
              <div className="space-y-3 text-gray-300">
                {result.summary?.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-cyan-400 rounded-full"></div>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Key Strengths" icon={<FaMedal className="text-xl" />}>
              <ul className="space-y-3 text-gray-300">
                {result.strengths?.map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-400 rounded-full"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title="Improvement Areas" icon={<FaChartLine className="text-xl" />}>
              <ul className="space-y-3 text-gray-300">
                {result.improvement?.map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-yellow-400 rounded-full"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title="Action Plan" icon={<FaRegLightbulb className="text-xl" />}>
              <ul className="space-y-3 text-gray-300">
                {result.actionable_steps?.map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-purple-400 rounded-full"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>

          <SectionCard title="Detailed Feedback" icon={<FaFileAlt className="text-xl" />}>
            <p className="text-gray-300 leading-relaxed">
              {result.overall_reason}
            </p>
          </SectionCard>

        </div>
      </div>
    </div>
  );
}

export default ViewResult;