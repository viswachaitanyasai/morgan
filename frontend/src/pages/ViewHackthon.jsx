import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaPlus, FaUpload, FaLock, FaTrophy, FaCheck, FaDownload,
    FaVideo, FaFileAudio, FaFileWord, FaFileAlt, FaSpinner,
    FaHandshake, FaExclamationCircle, FaTimes,
    FaRegClock, FaCode
} from 'react-icons/fa';
import { isAuthenticated, getAuthCookie } from '../utils/Cookie';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

function ViewHackathon() {
    const { id } = useParams();
    const navigate = useNavigate();
    const authenticated = isAuthenticated();
    const [hackathon, setHackathon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [joinLoading, setJoinLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedFileType, setSelectedFileType] = useState('');
    const [fileUploading, setFileUploading] = useState(false);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    useEffect(() => {
        const fetchHackathon = async () => {
            try {
                const headers = { "Content-Type": "application/json" };
                if (authenticated) {
                    const token = getAuthCookie("authToken");
                    headers["Authorization"] = `Bearer ${token}`;
                }
                const response = await fetch(`${backendUrl}/api/students/hackathons/${id}`, { headers });
                if (!response.ok) throw new Error("Failed to fetch hackathon details");
                const data = await response.json();
                setHackathon(data);
            } catch (error) {
                console.error(error);
                toast.error("Error fetching hackathon details");
            } finally {
                setLoading(false);
            }
        };
        fetchHackathon();
    }, [id]);

    const getCurrentStatus = (hackathondates, user, isResultPublished) => {
        const currentDate = new Date();
        const startDate = new Date(hackathondates.start_date);
        const endDate = new Date(hackathondates.end_date);
        const hasJoined = user.hasJoined;
        const submitted = user.hasSubmitted && user.hasSubmitted._id;
        const resultsOut = new Date(endDate);
        resultsOut.setDate(resultsOut.getDate() + 5);

        if (!authenticated) {
            return currentDate <= endDate
                ? { status: "login", text: "Sign In to Join", icon: <FaPlus /> }
                : { status: "closed", text: "Closed", icon: <FaLock /> };
        }

        if (currentDate < startDate) {
            return !hasJoined
                ? { status: "join", text: "Join", icon: <FaPlus /> }
                : { status: "joined", text: "Joined", icon: <FaCheck /> };
        }

        if (currentDate >= startDate && currentDate <= endDate) {
            if (!hasJoined) return { status: "join", text: "Join", icon: <FaPlus /> };
            if (!submitted) return { status: "submit", text: "Submit", icon: <FaUpload /> };
            return { status: "submitted", text: "Submitted", icon: <FaCheck /> };
        }

        if (currentDate > endDate && currentDate < resultsOut) {
            return { status: "closed", text: "Closed", icon: <FaLock /> };
        }

        if (currentDate >= resultsOut) {
            if (hasJoined && submitted) {
                return isResultPublished
                    ? { status: "submitted", text: "Submitted", icon: <FaCheck /> }
                    : { status: "closed", text: "Closed", icon: <FaLock /> };
            }
            return { status: "closed", text: "Closed", icon: <FaLock /> };
        }

        return { status: "join", text: "Join", icon: <FaPlus /> };
    };

    const handleJoinHackathon = async () => {
        setJoinLoading(true);
        try {
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAuthCookie("authToken")}`
            };
            const response = await fetch(`${backendUrl}/api/students/join`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ invite_code: hackathon.invite_code })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to join hackathon");
            toast.success(data.message || "Joined hackathon successfully!");
            setHackathon({ ...hackathon, hasJoined: true });
        } catch (error) {
            toast.error(error.message);
        } finally {
            setJoinLoading(false);
        }
    };

    const selectFile = (type) => {
        const input = document.createElement('input');
        input.type = 'file';
        const acceptMap = {
            video: 'video/*',
            audio: 'audio/*',
            file: '.pdf,.doc,.docx,.ppt,.pptx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/*',
            text: '.txt,text/plain'
        };
        input.accept = acceptMap[type] || '';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                setSelectedFile(file);
                setSelectedFileType(type);
            }
        };
        input.click();
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            toast.error('No file selected');
            return;
        }
        setFileUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('hackathon_id', id);

        try {
            const headers = { "Authorization": `Bearer ${getAuthCookie("authToken")}` };
            const response = await fetch(`${backendUrl}/api/students/submit`, {
                method: 'POST',
                headers,
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Upload failed');
            toast.success('File uploaded successfully!');
            setHackathon({ ...hackathon, hasSubmitted: { _id: data.submissionId || "submitted" } });
            setSelectedFile(null);
            setSelectedFileType('');
            setShowUploadModal(false);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setFileUploading(false);
        }
    };

    const handleButtonClick = () => {
        if (!hackathon) return;
        const hackathondates = { start_date: hackathon.start_date, end_date: hackathon.end_date };
        const user = { hasJoined: hackathon.hasJoined, hasSubmitted: hackathon.hasSubmitted };
        const { status } = getCurrentStatus(hackathondates, user, hackathon.isResultPublished);

        switch (status) {
            case "login":
                navigate('/auth', { state: { from: `/view-hackathon/${id}` } });
                toast.info("Please sign in to continue");
                break;
            case "join":
                !joinLoading && handleJoinHackathon();
                break;
            case "submit":
                setShowUploadModal(true);
                break;
            default: break;
        }
    };

    const handleDownloadAttachment = () => {
        window.open(hackathon.file_attachment_url, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex justify-center items-center">
                <div className="flex flex-col items-center space-y-4">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <FaSpinner className="text-cyan-400 text-5xl" />
                    </motion.div>
                    <p className="text-xl font-light text-gray-300">Loading Hackathon Details</p>
                </div>
            </div>
        );
    }

    if (!hackathon) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex justify-center items-center p-4">
                <div className="text-center bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full">
                    <div className="mb-6 flex justify-center">
                        <div className="bg-red-500/20 p-4 rounded-full">
                            <FaExclamationCircle className="text-red-400 text-4xl" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-100 mb-4">Hackathon Not Found</h1>
                    <p className="text-gray-400 mb-8">The requested hackathon could not be located.</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/all-hackathons')}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl font-medium transition-all w-full"
                    >
                        Explore Hackathons
                    </motion.button>
                </div>
            </div>
        );
    }

    const hasSubmitted = authenticated && hackathon.hasSubmitted?._id;
    const hackathondates = { start_date: hackathon.start_date, end_date: hackathon.end_date };
    const user = { hasJoined: hackathon.hasJoined, hasSubmitted: hackathon.hasSubmitted };
    const { status, text, icon } = getCurrentStatus(hackathondates, user, hackathon.isResultPublished);
    const showResultButton = hackathon.isResultPublished && hasSubmitted;

    const getButtonColor = () => {
        switch (status) {
            case "login":
            case "join": return "bg-cyan-600 hover:bg-cyan-700";
            case "joined": return "bg-gray-600 hover:bg-gray-700";
            case "submit": return "bg-green-600 hover:bg-green-700";
            case "closed": return "bg-gray-600 hover:bg-gray-700";
            case "submitted": return "bg-blue-600 hover:bg-blue-700";
            default: return "bg-cyan-600 hover:bg-cyan-700";
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800"
        >
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header Section */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-8 bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-2xl shadow-2xl"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                {hackathon.title}
                            </h1>
                            <div className="flex items-center space-x-2 text-gray-400">
                                <FaCode className="text-sm" />
                                <span className="text-sm font-medium">
                                    {hackathon.theme || 'General Theme'}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`flex items-center space-x-2 ${getButtonColor()} text-white px-6 py-3 rounded-xl font-medium transition-all ${status === "closed" || joinLoading ? "opacity-75 cursor-not-allowed" : ""
                                    }`}
                                onClick={handleButtonClick}
                                disabled={status === "closed" || joinLoading}
                            >
                                {status === "join" && joinLoading ? (
                                    <>
                                        <FaSpinner className="animate-spin" />
                                        <span>Joining...</span>
                                    </>
                                ) : (
                                    <>
                                        {icon}
                                        <span>{text}</span>
                                    </>
                                )}
                            </motion.button>

                            {showResultButton && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate(`/view-result/${id}`)}
                                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all"
                                >
                                    <FaTrophy />
                                    <span>View Results</span>
                                </motion.button>
                            )}
                        </div>
                    </div>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                
                    <div className="lg:col-span-1 space-y-8">
                        <motion.div
                            initial={{ x: -20 }}
                            animate={{ x: 0 }}
                            className="relative group"
                        >
                            <div className="aspect-w-16 aspect-h-9 bg-gray-700 rounded-2xl overflow-hidden shadow-2xl">
                                <img
                                    src={hackathon.image_url}
                                    alt={`${hackathon.title} poster`}
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://buildez-bucket.s3.ap-south-1.amazonaws.com/uploads/1743023195862_1.webp";
                                    }}
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-gray-800 rounded-2xl p-6 shadow-xl"
                        >
                            <h2 className="text-xl font-semibold mb-6 text-cyan-400 flex items-center space-x-2">
                                <FaRegClock className="text-lg" />
                                <span>Event Timeline</span>
                            </h2>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                                    <span className="text-gray-400 font-medium">Starts:</span>
                                    <span className="text-gray-200 font-semibold">
                                        {formatDate(hackathon.start_date)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                                    <span className="text-gray-400 font-medium">Ends:</span>
                                    <span className="text-gray-200 font-semibold">
                                        {formatDate(hackathon.end_date)}
                                    </span>
                                </div>
                            </div>

                            {hackathon.file_attachment_url && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleDownloadAttachment}
                                    className="w-full mt-6 bg-gray-700 hover:bg-gray-600/80 text-cyan-400 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center space-x-2"
                                >
                                    <FaDownload />
                                    <span>Download Resources</span>
                                </motion.button>
                            )}
                        </motion.div>

                        {hackathon.sponsors?.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-gray-800 rounded-2xl p-6 shadow-xl"
                            >
                                <h2 className="text-xl font-semibold mb-6 text-cyan-400 flex items-center space-x-2">
                                    <FaHandshake />
                                    <span>Sponsored By</span>
                                </h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {hackathon.sponsors.map((sponsor, index) => (
                                        <div
                                            key={index}
                                            className="p-3 bg-gray-700/50 rounded-lg text-center text-sm font-medium text-gray-300 hover:bg-gray-600/50 transition-colors"
                                        >
                                            {sponsor}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-800 rounded-2xl p-8 shadow-xl"
                        >
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-cyan-400 mb-4">Challenge Overview</h2>
                                <p className="text-gray-300 leading-relaxed">
                                    {hackathon.problem_statement}
                                </p>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-xl font-semibold text-cyan-400 mb-3">Detailed Brief</h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        {hackathon.description}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-cyan-400 mb-3">Technical Context</h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        {hackathon.context}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>

                <AnimatePresence>
                    {showUploadModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 z-50"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-gray-800 rounded-2xl p-8 w-full max-w-xl shadow-2xl"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-cyan-400">Submit Your Solution</h2>
                                </div>

                                {selectedFile ? (
                                    <div className="flex flex-col items-center space-y-6">
                                        <div className="bg-gray-700/50 p-4 rounded-xl w-full">
                                            <p className="text-gray-300 truncate">
                                                Selected: <span className="font-medium text-cyan-400">{selectedFile.name}</span>
                                            </p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                File type: {selectedFileType}
                                            </p>
                                        </div>

                                        <div className="flex gap-4 w-full">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleFileUpload}
                                                disabled={fileUploading}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                                            >
                                                {fileUploading ? (
                                                    <>
                                                        <FaSpinner className="animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaUpload />
                                                        Confirm Upload
                                                    </>
                                                )}
                                            </motion.button>
                                            <button
                                                onClick={() => setSelectedFile(null)}
                                                className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-6 py-3 rounded-xl font-medium transition-all"
                                            >
                                                Change File
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {['video', 'audio', 'file', 'text'].map((type) => (
                                            <motion.button
                                                key={type}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => selectFile(type)}
                                                className="bg-gray-700/50 hover:bg-gray-600/50 p-6 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors"
                                            >
                                                {type === 'video' && <FaVideo className="text-3xl text-cyan-400" />}
                                                {type === 'audio' && <FaFileAudio className="text-3xl text-cyan-400" />}
                                                {type === 'file' && <FaFileWord className="text-3xl text-cyan-400" />}
                                                {type === 'text' && <FaFileAlt className="text-3xl text-cyan-400" />}
                                                <span className="capitalize text-gray-300">
                                                    {type === 'file' ? 'Document' : type}
                                                </span>
                                                {type === 'file' && (
                                                    <span className="text-xs text-gray-400">(PDF, DOC, PPT, IMG)</span>
                                                )}
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </motion.div>
    );
}

export default ViewHackathon;