import React from 'react';
import {
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileArchive,
  FaFileImage,
  FaFilePowerpoint,
  FaFileCode,
  FaFileVideo,
  FaFileAudio,
} from 'react-icons/fa';

export const getFileIcon = (fileName = '', size = 16) => {
  const ext = (fileName || '').split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf':
      return <FaFilePdf className="text-rose-500 shrink-0" size={size} />;
    case 'doc':
    case 'docx':
      return <FaFileWord className="text-blue-500 shrink-0" size={size} />;
    case 'xls':
    case 'xlsx':
    case 'csv':
      return <FaFileExcel className="text-emerald-500 shrink-0" size={size} />;
    case 'ppt':
    case 'pptx':
      return <FaFilePowerpoint className="text-orange-500 shrink-0" size={size} />;
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return <FaFileArchive className="text-amber-500 shrink-0" size={size} />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'svg':
    case 'bmp':
      return <FaFileImage className="text-purple-500 shrink-0" size={size} />;
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'html':
    case 'css':
    case 'json':
      return <FaFileCode className="text-cyan-500 shrink-0" size={size} />;
    case 'mp4':
    case 'mov':
    case 'webm':
      return <FaFileVideo className="text-red-500 shrink-0" size={size} />;
    case 'mp3':
    case 'wav':
    case 'ogg':
      return <FaFileAudio className="text-indigo-500 shrink-0" size={size} />;
    default:
      return <FaFileAlt className="text-muted shrink-0" size={size} />;
  }
};

export const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};
