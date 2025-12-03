const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");


// ✅ Initialize AWS S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ✅ Upload Function
exports.uploadFileToS3 = async (fileBuffer, fileName, fileType) => {
  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: fileType,
  };

  await s3.send(new PutObjectCommand(uploadParams));

  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
};
