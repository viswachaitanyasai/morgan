const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const { extractText } = require("../utils/textExtractor");
const { analyzeText, analyzeAudio, updateHackathonData } = require("../utils/geminiAnalysis");
const { extractAudioFromVideo } = require("../utils/videoProcessor");
const { uploadFileToS3 } = require("../utils/s3Uploader");
const Submission = require("../models/Submission");
const Evaluation = require("../models/Evaluation");
const Student = require("../models/Student");
const Hackathon = require("../models/Hackathon");


const processFile = async (filePath, fileType, problemStatement, judgement_parameters, custom_prompt) => {

  if (fileType.startsWith("audio/")) {
    return {
      evaluationResult: await analyzeAudio(
        problemStatement,
        judgement_parameters,
        filePath,
        custom_prompt
      ),
    };
  }
  if (fileType.startsWith("video/")) {
    const audioPath = await extractAudioFromVideo(filePath);
    return {
      evaluationResult: await analyzeAudio(
        problemStatement,
        judgement_parameters,
        audioPath,
        custom_prompt
      ),
    };
  }

  const extractedText = await extractText(filePath, fileType);
  const evaluationResult = await analyzeText(
    problemStatement,
    judgement_parameters,
    extractedText,
    custom_prompt
  );
  // console.log(evaluationResult);
  return { evaluationResult };
};

const saveFileLocally = async (fileBuffer, fileName) => {
  const uploadDir = path.join(__dirname, "..", "uploads");

  try {
    await fsPromises.access(uploadDir);
  } catch (error) {
    await fsPromises.mkdir(uploadDir); 
  }

  const filePath = path.join(uploadDir, fileName);
  await fsPromises.writeFile(filePath, fileBuffer);
  return filePath;
};

const submitSolution = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { hackathon_id } = req.body;
    const student_id = req.student.id;

    if (!hackathon_id) {
      return res.status(400).json({ error: "Hackathon ID is required." });
    }
    const hackathon = await Hackathon.findById(hackathon_id)
      .populate("judging_parameters", "name")
      .exec();
    if (!hackathon)
      return res.status(404).json({ error: "Hackathon not found." });

    if (!student_id) {
      return res.status(400).json({ error: "Student ID is required." });
    }

    const student = await Student.findById(student_id);
    if (!student) return res.status(404).json({ error: "Student not found." });

    if (hackathon.is_result_published) {
      return res
        .status(400)
        .json({ error: "Sorry Submission deadline already over." });
    }

    const fileBuffer = req.file.buffer;
    const fileType = req.file.mimetype;
    const originalFileName = req.file.originalname;
    const fileExtension = path.extname(originalFileName);
    const fileName = `${hackathon_id}${student_id}${fileExtension}`;
    const tempFilePath = await saveFileLocally(fileBuffer, fileName);

    const fileUrl = await uploadFileToS3(
      fileBuffer,
      `uploads/${fileName}`,
      fileType
    );

    const submission = new Submission({
      hackathon_id,
      student_id,
      submission_url: fileUrl,
    });

    await submission.save();

    res.status(200).json({
      message: "Submission recorded successfully",
    });

    const problemStatement = `Title: ${hackathon.title}\nDescription: ${hackathon.description}\nProblem Statement: ${hackathon.problem_statement}\nContext: ${hackathon.context}`;
    const judgement_parameters = hackathon.judging_parameters.map(
      (param) => param.name
    );
    const custom_prompt = hackathon.custom_prompt;

    await Student.findByIdAndUpdate(student_id, {
      $push: { submissions: submission._id },
    });
 
    let evaluationResult;

  
    try {
      const result = await processFile(
        tempFilePath,
        fileType,
        problemStatement,
        judgement_parameters,
        custom_prompt
      );
      const { evaluationResult: evalRes } = result;

      evaluationResult = evalRes;
      const max = evaluationResult.parameter_feedback.length * 2 || 0;
      const score = (evaluationResult.overall_score / max) * 10;
      const evaluation = new Evaluation({
        submission_id: submission._id,
        evaluation_status: "completed",
        evaluation_category: score < 4 ? "rejected" : score < 7 ? "revisit" : "shortlisted",
        parameter_feedback: evaluationResult.parameter_feedback,
        improvement: evaluationResult.improvement,
        actionable_steps: evaluationResult.actionable_steps,
        strengths: evaluationResult.strengths,
        overall_score: score,
        overall_reason: evaluationResult.overall_reason,
        summary: evaluationResult.summary,
      });

      await evaluation.save();

      let categoryField;
      if (evaluation.evaluation_category === "shortlisted") {
        categoryField = "shortlisted_students";
      } else if (evaluation.evaluation_category === "revisit") {
        categoryField = "revisit_students";
      } else {
        categoryField = "rejected_students";
      }
      await Hackathon.findByIdAndUpdate(
        hackathon_id,
        {
          $push: { submissions: submission._id, [categoryField]: student_id },
          $addToSet: { participants: student_id },
        },
        { new: true }
      );

      await updateHackathonData(
        hackathon_id,
        evaluationResult.skill_gap,
        evaluationResult.keywords
      );
      submission.evaluation_id = evaluation._id;
      await submission.save();
    } finally {
      await fsPromises
        .unlink(tempFilePath)
        .catch((err) => console.error("File deletion error:", err));
    }

  } catch (error) {
    console.error("Submission Error:", error);
    res.status(500).json({ error: "Error processing submission" });
  }
};


module.exports = {
  submitSolution,
};
