const {
  GoogleAIFileManager,
  FileState,
} = require("@google/generative-ai/server");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Hackathon = require("../models/Hackathon");

const API_KEY = process.env.GEMINI_API_KEY;
const fileManager = new GoogleAIFileManager(API_KEY);
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function analyzeAudio(problemStatement, parameters, filePath, additionalInstructions = "") {
  try {
    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType: "audio/mp3",
      displayName: "Submission Audio",
    });

    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === FileState.PROCESSING) {
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      file = await fileManager.getFile(uploadResult.file.name);
    }

    if (file.state === FileState.FAILED) {
      throw new Error("Audio processing failed.");
    }

    const fullPrompt = `
    You are an AI agent evaluating hackathon submissions. STRICTLY follow these rules:
    
    - **Be extremely strict in evaluation** as we receive over **200,000 submissions and select only 1,000.**
    - **Low-effort or very short or unclear submissions must get a score of ZERO in all parameters.**
    - **Total score must always be the sum of all parameter scores.**
    - **If a submission lacks a clear explanation, effort, or relation to the problem statement, give a total score of 0.**
    - **If it only states a vague idea without detailed steps or implementation, give 0.**
    - **Do NOT provide confirmations or explanations outside of the JSON format.**
    - Analyse the responses effectivrly please about whi is deserving to win
    **Evaluation Guidelines:**
    - **Check if the solution is related to the problem statement**. If not, score = **0**.
    - **Check if the solution is detailed and actually proposes a valid solution**. If it is just an idea without implementation, score = **0**.
    - **Check clarity**: If unclear, missing key points, or overly generic, score = **0**.
    - **Low-effort responses (short, generic, or superficial)** = **0 marks in all parameters**.
    - **A good solution should clearly describe the methodology, tools, and real-world applicability.**
 -  Analyse the skill gaps and return me an array of keywords of gaps.
     -  Give me keywords which summarize the solution in an array and return an array of it

    **Problem Statement:** ${problemStatement}
    
    **Parameters:** ${parameters.join(", ")}
    
    **Grading Basis:**  evaluation is done as 0(low) or 0.5(medium) or 1(average) or 2(perfect). These are the only categories of grading
    
    ${additionalInstructions}
    
    **Submission Data (converted from PPT/audio given to you):

    **Return Structure (strictly JSON):**
    {
      "overall_score": "",   // Total score (must be strictly sum of all parameter scores)
      "overall_reason": "",  // Detailed reasoning for the total score
      "parameter_feedback": [
        { "name": "", "score": "", "reason": "" }
      ],
      "improvement": ["", ""],
      "actionable_steps": ["", ""],
      "strengths": ["", ""],
      "summary": ["", ""]
       "skill_gap":["",""...],
      "keywords":["","",..]

    }
    IMPORTANT: THE SUM OF ALL SCORES IN DIFERENT PARAMETERS IS THE overall_score
    **Ensure the response is in pure JSON format with no extra formatting.**
  `;

    const result = await model.generateContent([
      fullPrompt,
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      },
    ]);

    const rawResponse = result.response.text();

    let cleanedResponse = rawResponse.replace(/```/g, "").trim();
    cleanedResponse = cleanedResponse.replace(/^json\s*/i, "").trim();

    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("Error in evaluation (Audio):", error);
    return null;
  }
}

async function analyzeText(problemStatement, parameters, submissionText, additionalInstructions = "") {
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  const fullPrompt = `
    You are an AI agent evaluating hackathon submissions. STRICTLY follow these rules:
    
    - *Be extremely strict in evaluation* as we receive over *200,000 submissions and select only 1,000.*
    - *Low-effort or very short or unclear submissions must get a score of ZERO in all parameters.*
    - *Total score must always be the sum of all parameter scores.*
    - *If a submission lacks a clear explanation, effort, or relation to the problem statement, give a total score of 0.*
    - *If it only states a vague idea without detailed steps or implementation, give 0.*
    - *Do NOT provide confirmations or explanations outside of the JSON format.*
    -  Analyse the skill gaps and return me an array of it.
    -  Give me keywords which summarize the solution in an array and return an array of it
    *Evaluation Guidelines:*
    GRADE THE SOLUTION EFFECTIVELY ON THE BASIS OF PARAMETERS AND GIVE DESERVING MARKS
    - evaluation is done as 0(low) or 0.5(medium) or 1(average) or 2(perfect). These are the only categories of grading
    - *Check if the solution is related to the problem statement. If not, score = **0*.
    - *Check if the solution is detailed and actually proposes a valid solution. If it is just an idea without implementation, score = **0*.
    - *Check clarity: If unclear, missing key points, or overly generic, score = **0*.
    - *Low-effort responses (short, generic, or superficial)* = *0 marks in all parameters*.
    - *A good solution should clearly describe the methodology, tools, and real-world applicability.*

    *Problem Statement:* ${problemStatement}
    
    *Parameters:* ${parameters}
    
    *Grading Basis: All parameters given to you can not get any other score than (0 or 0.5 or 1 or 2)
    
    ${additionalInstructions}
    
    *Submission Data (converted from PPT/audio):* ${submissionText}

    *Return Structure (strictly JSON):*
    {
      "overall_score": "",
      "overall_reason": "",
      "parameter_feedback": [
        { "name": "", "score": "", "reason": "" }
      ],
      "improvement": ["", ""],
      "actionable_steps": ["", ""],
      "strengths": ["", ""],
      "summary": ["", ""],
      "skill_gap":["",""...],
      "keywords":["","",..]
    }
    Ensure that the overall score is the sum of scores of all parameters in all the cases.
    *Ensure the response is in pure JSON format with no extra formatting.*
  `;

  const data = {
    contents: [{ parts: [{ text: fullPrompt }] }],
  };

  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    let contentText = response.data.candidates[0].content.parts[0].text || "{}";

    contentText = contentText.replace(/```/g, "").trim();
    contentText = contentText.replace(/^json\s*/i, "").trim();

    return JSON.parse(contentText);
  } catch (error) {
    console.error(
      "Error evaluating submission (Text):",
      error.response?.data || error.message
    );
    return null;
  }
}

async function updateHackathonData(
  hackathonId,
  newSkillGaps = [],
  newKeywords = []
) {
  try {
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      throw new Error("Hackathon not found");
    }

    let currentSkillGap = hackathon.skill_gap || new Map();
    let currentKeywords = hackathon.keywords || new Map();

    newSkillGaps.forEach((skill) => {
      currentSkillGap.set(skill, (currentSkillGap.get(skill) || 0) + 1);
    });

    newKeywords.forEach((keyword) => {
      currentKeywords.set(keyword, (currentKeywords.get(keyword) || 0) + 1);
    });

    hackathon.skill_gap = currentSkillGap;
    hackathon.keywords = currentKeywords;
    await hackathon.save();

    console.log("Hackathon data updated successfully");
  } catch (error) {
    console.error("Error updating hackathon data:", error.message);
  }
}

module.exports = { analyzeAudio, analyzeText, updateHackathonData };
