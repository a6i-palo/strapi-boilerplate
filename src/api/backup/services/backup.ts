/**
 * backup service
 */
import axios from "axios";
import fs from "fs";
import path from "path";
import tar from "tar";
import {
  getPodImage,
  traverse,
  generateImageVersions,
  getCollectionSearchParams,
} from "./utils";

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
  async backupCollection(
    collectionName,
    savefolder,
    filename,
    uuids,
    packageVersion
  ) {
    if (!fs.existsSync(savefolder)) {
      fs.mkdirSync(savefolder);
    }

    const backupTree = {
      manifest: {
        version: packageVersion,
        collection: collectionName,
        timestamp: new Date().toISOString(),
        image: await getPodImage(),
      },
      data: null,
      files: null,
      folders: null,
    };

    const contentType: any = `api::${collectionName}.${collectionName}`;

    backupTree.data = await strapi.entityService.findMany(
      contentType,
      getCollectionSearchParams(collectionName, uuids)
    );

    const referencedFileIds = new Set();

    // Traverse the data to collect referenced file IDs
    const collectReferencedFileIds = (obj) => {
      for (const key in obj) {
        if (obj[key] && typeof obj[key] === "object") {
          if (obj[key].id && obj[key].mime && obj[key].url) {
            referencedFileIds.add(obj[key].id);
          } else {
            collectReferencedFileIds(obj[key]);
          }
        }
      }
    };

    backupTree.data.forEach((item) => collectReferencedFileIds(item));

    // Filter files to include only those that are referenced
    backupTree.files = (
      await strapi.db.query(`plugin::upload.file`).findMany()
    ).filter((file) => referencedFileIds.has(file.id));

    const referencedFolderPaths = new Set();

    // Collect referenced folder IDs
    backupTree.files.forEach((file) => {
      if (file.folderPath) {
        referencedFolderPaths.add(file.folderPath);
      }
    });

    // Filter folders to include only those that are referenced
    backupTree.folders = (
      await strapi.db.query(`plugin::upload.folder`).findMany()
    ).filter((folder) => referencedFolderPaths.has(folder.path));

    // Save the collection JSON to disk
    fs.writeFileSync(
      path.join(savefolder, `${collectionName}.json`),
      JSON.stringify(backupTree)
    );

    // Traverse the data to find and save media physical files
    const mediaFiles = [];
    backupTree.data.forEach((item) => traverse(item, mediaFiles));

    const baseUrl = strapi.config.server.url || "http://0.0.0.0:1337";

    for (const file of mediaFiles) {
      const url = file.url.startsWith("http")
        ? file.url
        : `${baseUrl}${file.url}`;

      try {
        const response = await axios.get(url, { responseType: "stream" });
        const writer = fs.createWriteStream(
          path.join(savefolder, path.basename(file.url))
        );
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });
      } catch (error) {
        console.error(`Error fetching URL: ${url}`, error.message);
      }
    }

    const tarballName = `${filename}.tar.gz`;
    const tarballPath = path.join(savefolder, tarballName);

    await tar.c(
      {
        gzip: true,
        file: tarballPath,
        cwd: savefolder,
      },
      fs.readdirSync(savefolder)
    );

    console.log(`Backup tarball created successfully: ${tarballPath}`);
    return tarballName;
  },
  async importCollection(collectionName, savefolder, filename) {
    const tarballPath = path.join(savefolder, `${filename}`);
    const extractPath = path.join(savefolder, "extracted");

    // Ensure the extraction folder exists
    if (!fs.existsSync(extractPath)) {
      fs.mkdirSync(extractPath);
    }

    // Extract the tarball
    await tar.x({
      file: tarballPath,
      cwd: extractPath,
    });

    // Read the collection JSON file
    const collectionFilePath = path.join(extractPath, `${collectionName}.json`);
    const backupTree = JSON.parse(fs.readFileSync(collectionFilePath, "utf-8"));

    // Read the latest entry from backup-version collection
    const backupVersions = await strapi.entityService.findMany(
      "api::backup-version.backup-version",
      {
        sort: { createdAt: "desc" },
        limit: 1,
      }
    );
    const currentBackupVersion = backupVersions[0];

    // Validate manifest
    if (currentBackupVersion.current > backupTree.manifest.version) {
      throw new Error("Backup version is older than the current version");
    }

    const podImage = await getPodImage();

    if (podImage !== backupTree.manifest.image) {
      console.warn("The backup was created from an pod image");
    }

    // Import folders
    for (const folder of backupTree.folders) {
      const existingFolder = await strapi.db
        .query(`plugin::upload.folder`)
        .findOne({
          where: { pathId: folder.pathId },
        });

      if (!existingFolder) {
        const { id, ...folderData } = folder;
        await strapi.db.query(`plugin::upload.folder`).create({
          data: folderData,
        });
      } else {
        // Update the folder path in files
        for (let i = 0; i < backupTree.files.length; i++) {
          if (backupTree.files[i].folderPath === folder.path) {
            backupTree.files[i].folderPath = existingFolder.path;
          }
        }
      }
    }

    // Copy media files to the upload directory and generate versions
    const uploadDir = path.join(strapi.dirs.static.public, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    const mediaFiles = fs.readdirSync(extractPath).filter((file) => {
      return file !== `${collectionName}.json`;
    });

    for (const file of mediaFiles) {
      const filePath = path.join(extractPath, file);
      const destPath = path.join(uploadDir, file);
      fs.copyFileSync(filePath, destPath);
      await generateImageVersions(destPath, uploadDir);
    }

    // Import files
    for (const file of backupTree.files) {
      const existingFile = await strapi.db
        .query(`plugin::upload.file`)
        .findOne({
          where: { hash: file.hash },
        });

      if (!existingFile) {
        await strapi.db.query(`plugin::upload.file`).create({
          data: file,
        });
      }
    }

    // Import data into the collection
    const contentType: any = `api::${collectionName}.${collectionName}`;
    for (const item of backupTree.data) {
      const existingEntity = await strapi.entityService.findMany(contentType, {
        filters: { uuid: item.uuid },
        limit: 1,
      });

      // Ensure all related files exist before creating/updating the entity
      // Update imported item file id with file ID from database
      // This code block only works for content-bundle collection with the singleImage component
      if (item.content && item.content.singleImage) {
        const relatedFile = await strapi.db
          .query(`plugin::upload.file`)
          .findOne({
            where: { name: item.content.singleImage.name },
          });

        if (!relatedFile) {
          const uploadFile = await strapi.db
            .query(`plugin::upload.file`)
            .create({
              data: item.content.singleImage,
            });
          item.content.singleImage.id = uploadFile.id;
        } else {
          item.content.singleImage.id = relatedFile.id;
        }
      }

      // delete before creation if existing entity found
      if (existingEntity.length > 0) {
        await strapi.entityService.delete(contentType, existingEntity[0].id);
      }
      await strapi.entityService.create(contentType, {
        data: item,
      });
    }

    // Create a new backup version entry if it doesn't exist, else update the existing entry
    if (!currentBackupVersion) {
      await strapi.entityService.create("api::backup-version.backup-version", {
        data: {
          current: backupTree.manifest.version,
          publishedAt: Date.now(),
        },
      });
    } else {
      await strapi.entityService.update(
        "api::backup-version.backup-version",
        currentBackupVersion.id,
        {
          data: {
            current: backupTree.manifest.version,
            publishedAt: Date.now(),
          },
        }
      );
    }

    console.log(`Collection imported successfully from ${tarballPath}`);
  },
};
