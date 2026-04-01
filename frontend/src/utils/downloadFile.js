import api from "../axios";
import { toast } from "react-toastify";

/**
 * Universal file downloader for Azure Blob Storage.
 *
 * @param {string} blobNameOrUrl - The blob name or full Azure Blob URL stored in the DB
 * @param {string} [fileName] - Optional display filename for the download. Falls back to extracted name.
 */
export const downloadFile = async (blobNameOrUrl, fileName) => {
  try {
    if (!blobNameOrUrl) {
      toast.error("File URL is invalid or missing.");
      return;
    }

    const encodedInput = encodeURIComponent(blobNameOrUrl);
    
    // Request a temporary SAS URL from the backend
    const response = await api.get(`/web/download?blobName=${encodedInput}`);
    
    if (response.data && response.data.status === "success" && response.data.url) {
      const sasUrl = response.data.url;
      
      // Attempt to intelligently fall back if fileName is absent
      let finalFileName = fileName;
      if (!finalFileName) {
        const urlWithoutQuery = sasUrl.split("?")[0];
        finalFileName = decodeURIComponent(urlWithoutQuery.split("/").pop());
      }
      
      // Fetch the file securely directly from Azure Storage (via the SAS)
      const fileResponse = await fetch(sasUrl);
      if (!fileResponse.ok) {
        throw new Error("Could not fetch file from secure storage.");
      }

      const blob = await fileResponse.blob();
      
      // Programmatically trigger a download
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = finalFileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(objectUrl);
      toast.success("Download started!");
    } else {
      throw new Error("Failed to receive a valid secure URL.");
    }
  } catch (error) {
    console.error("Download Error:", error);
    toast.error(error.response?.data?.message || error.message || "Failed to download file");
  }
};
