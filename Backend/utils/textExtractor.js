const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const xlsx = require("xlsx");
const pptx2json = require("pptx2json");
const Tesseract = require("tesseract.js");

// Function to determine file type and extract text accordingly
async function extractText(filePath, fileType) {
  if (!fs.existsSync(filePath)) {
    throw new Error("File not found.");
  }

  try {
    switch (fileType.toLowerCase()) {
      case "application/pdf":
        return await extractTextFromPDF(filePath);
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": // .docx
        return await extractTextFromDocx(filePath);
      case "text/plain":
        return extractTextFromTxt(filePath);
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": // .xlsx
        return extractTextFromXlsx(filePath);
      case "application/vnd.openxmlformats-officedocument.presentationml.presentation": // .pptx
        return await extractTextFromPptx(filePath);
      case "image/jpeg":
      case "image/png":
      case "image/tiff":
      case "image/bmp":
        return await extractTextFromImage(filePath);
      default:
        throw new Error("Unsupported file format.");
    }
  } catch (error) {
    throw new Error(`Error extracting text: ${error.message}`);
  }
}

// Extract text from a PDF file
async function extractTextFromPDF(filePath) {
  const data = await pdfParse(fs.readFileSync(filePath));
  return data.text.trim() || "No readable text found in the PDF.";
}

// Extract text from a DOCX file
async function extractTextFromDocx(filePath) {
  const data = await mammoth.extractRawText({ path: filePath });
  return data.value.trim() || "No text found.";
}

// Extract text from a TXT file
function extractTextFromTxt(filePath) {
  return fs.readFileSync(filePath, "utf-8").trim();
}

// Extract text from an Excel (XLSX) file
function extractTextFromXlsx(filePath) {
  const workbook = xlsx.readFile(filePath);
  let text = "";
  workbook.SheetNames.forEach((sheet) => {
    text += xlsx.utils.sheet_to_csv(workbook.Sheets[sheet]) + "\n";
  });
  return text.trim() || "No text found in the spreadsheet.";
}

// Extract text from a PowerPoint (PPTX) file
async function extractTextFromPptx(filePath) {
  const slides = await pptx2json(filePath);
  let text = slides.slides
    .flatMap((slide) => slide.texts.map((t) => t.text))
    .join("\n");
  return text.trim() || "No text found in the presentation.";
}

// Extract text from an image using OCR (Tesseract.js)
async function extractTextFromImage(filePath) {
  const { data } = await Tesseract.recognize(filePath, "eng");
  return data.text.trim() || "No readable text found in the image.";
}

// Export the extractText function
module.exports = { extractText };
