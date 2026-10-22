import api from "../axios";
import { toast } from "react-toastify";

/**
 * Triggers a programmatic download for a given URL and filename.
 * Attempts fetch to get a blob first. If blocked by CORS or network,
 * seamlessly falls back to direct anchor download with target="_blank"
 * and download attributes.
 * 
 * @param {string} url - The URL to download from (usually a SAS URL)
 * @param {string} fileName - The display filename for the download
 */
export const triggerDownload = async (url, fileName) => {
  const finalName = fileName || "downloaded_file";

  try {
    const fileResponse = await fetch(url);
    if (!fileResponse.ok) throw new Error("Failed to fetch file for download");

    const blob = await fileResponse.blob();
    const objectUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  } catch (fetchError) {
    // Graceful fallback for cross-origin / CORS restricted SAS URLs
    console.warn("Direct blob fetch encountered CORS or network issue, using direct anchor download:", fetchError.message);
    const link = document.createElement("a");
    link.href = url;
    link.download = finalName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 200);
  }
};

/**
 * Universal file downloader for Azure Blob Storage.
 * Generates a SAS URL via the backend and triggers a programmatic download.
 * 
 * @param {string} source - Either a blob name, a full Azure Blob URL, OR a specialized backend API route (starting with /)
 * @param {string} [fileName] - Optional display filename for the download
 */
export const downloadFile = async (source, fileName) => {
  if (!source) {
    toast.error("File reference is missing");
    return;
  }

  const toastId = toast.loading("Preparing download...");

  try {
    let sasUrl = "";
    let finalFileName = fileName;

    // Case 1: source is a specialized backend API route (e.g., /files/files/:id/download)
    if (source.startsWith("/")) {
      const response = await api.get(source);

      if (response.data.status === "success") {
        sasUrl = response.data.url || response.data.data?.downloadUrl;
        if (!finalFileName) {
          finalFileName = response.data.filename || response.data.data?.filename;
        }
      } else {
        throw new Error("Failed to get download URL from specialized route");
      }
    } 
    // Case 2: source is a blob name or full Azure URL (uses universal /download route)
    else {
      const response = await api.get(`/download`, {
        params: { blobName: source, fileName: finalFileName }
      });

      if (response.data.status !== "success" || !response.data.url) {
        throw new Error("Failed to get download URL");
      }

      sasUrl = response.data.url;
    }

    if (!sasUrl) throw new Error("Could not retrieve download URL");

    // Determine final filename if still missing
    if (!finalFileName) {
      try {
        const urlToParse = sasUrl.split("?")[0];
        finalFileName = decodeURIComponent(urlToParse.split("/").pop());
      } catch (e) {
        finalFileName = "downloaded_file";
      }
    }

    // Trigger the programmatic download
    await triggerDownload(sasUrl, finalFileName);

    toast.update(toastId, {
      render: "Download started!",
      type: "success",
      isLoading: false,
      autoClose: 3000
    });
  } catch (error) {
    console.error("Download error:", error);
    toast.update(toastId, {
      render: error.response?.data?.message || error.message || "Failed to download file",
      type: "error",
      isLoading: false,
      autoClose: 5000
    });
  }
};
