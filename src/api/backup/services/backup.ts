/**
 * backup service
 */
import axios from "axios";
import fs from "fs";
import path from "path";

export default {
  async uploadFileToArtifactory(
    artifactoryUrl,
    artifactoryUsername,
    artifactoryPassword,
    artifactoryDestination,
    savefolder,
    filename
  ) {
    const fileBuffer = fs.readFileSync(`${savefolder}/${filename}`);
    await axios.post(
      `${artifactoryUrl}/${artifactoryDestination}/${filename}`,
      fileBuffer,
      {
        auth: {
          username: artifactoryUsername,
          password: artifactoryPassword,
        },
        headers: {
          "Content-Type": "application/octet-stream",
        },
      }
    );
  },
  async downloadFileFromArtifactory(
    artifactoryUrl,
    artifactoryUsername,
    artifactoryPassword,
    artifactoryDestination,
    savefolder,
    filename
  ) {
    // Construct the full URL
    const savePath = `${savefolder}/${filename}`;
    const url = `${artifactoryUrl}/${artifactoryDestination}/${filename}`;

    // Make the GET request
    const response = await axios.get(url, {
      auth: {
        username: artifactoryUsername,
        password: artifactoryPassword,
      },
      responseType: "stream",
    });

    // Create a write stream for saving the file
    const writer = fs.createWriteStream(savePath);

    // Pipe the response data to the write stream
    response.data.pipe(writer);

    // Wait for the write stream to finish
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log(`Backup downloaded successfully: ${savePath}`);
  },
};
