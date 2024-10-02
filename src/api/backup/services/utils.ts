import fs from "fs";
import https from "https";
import axios from "axios";
import sharp from "sharp";
import path from "path";

// Function to read a file
const readFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (err, data) => {
      if (err) reject(err);
      else resolve(data.trim());
    });
  });
};

export const getPodImage = async (): Promise<string> => {
  try {
    // Read the necessary files
    const [token, namespace] = await Promise.all([
      readFile("/var/run/secrets/kubernetes.io/serviceaccount/token"),
      readFile("/var/run/secrets/kubernetes.io/serviceaccount/namespace"),
    ]);

    const podName = process.env.HOSTNAME;

    // Make the request to the Kubernetes API
    const response = await axios.get(
      `https://kubernetes.default.svc/api/v1/namespaces/${namespace}/pods/${podName}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }), // To handle self-signed certificates
      }
    );

    const podInfo = response.data;
    const image = podInfo.spec.containers[0].image;

    // Return the image with tag
    return image;
  } catch (error) {
    console.error("Error:", error);
    return "";
  }
};

// Function to traverse the data and collect media files
export const traverse = (obj, mediaFiles) => {
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === "object") {
      if (obj[key].mime && obj[key].url) {
        mediaFiles.push(obj[key]);
      } else if (key === "formats") {
        // Traverse formats to get all image sizes
        for (const formatKey in obj[key]) {
          if (obj[key][formatKey].mime && obj[key][formatKey].url) {
            mediaFiles.push(obj[key][formatKey]);
          }
        }
      } else {
        traverse(obj[key], mediaFiles);
      }
    }
  }
};

// Function to generate image versions
export const generateImageVersions = async (filePath, uploadDir) => {
  const sizes = {
    thumbnail: 150,
    small: 300,
    medium: 600,
    large: 1200,
  };

  const fileName = path.basename(filePath, path.extname(filePath));
  const fileExt = path.extname(filePath);

  for (const [sizeName, size] of Object.entries(sizes)) {
    const outputFilePath = path.join(
      uploadDir,
      `${sizeName}_${fileName}${fileExt}`
    );
    await sharp(filePath).resize(size).toFile(outputFilePath);
  }
};

const entityServiceParams = {
  "content-bundle": {
    populate: {
      content: {
        populate: {
          singleImage: true,
        },
      },
    },
  },
  "question-sets": {
    populate: true,
  },
};

// Function to get collection search parameters
export const getCollectionSearchParams = (collectionName, uuids) => {
  return (
    (uuids.length > 0 && {
      ...entityServiceParams[collectionName],
      filters: { uuid: { $in: uuids } },
    }) ||
    entityServiceParams[collectionName]
  );
};
