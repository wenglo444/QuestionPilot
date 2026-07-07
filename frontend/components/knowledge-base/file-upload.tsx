"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  File,
} from "lucide-react";

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "text/csv": [".csv"],
  "text/markdown": [".md"],
  "text/plain": [".txt"],
};

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".xlsx", ".csv", ".md", ".txt"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadedFile {
  file: File;
  id: string;
  status: UploadStatus;
  progress: number;
  error?: string;
}

interface FileUploadProps {
  projectId?: string;
  onUploadComplete?: (files: { id: string; name: string }[]) => void;
  maxFiles?: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type === "application/pdf") return FileText;
  if (type.includes("word")) return FileText;
  if (type.includes("sheet") || type.includes("csv")) return FileText;
  return File;
}

export function FileUpload({
  projectId,
  onUploadComplete,
  maxFiles = 20,
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileIdCounter = useRef(0);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
        file,
        id: `file-${++fileIdCounter.current}`,
        status: "idle" as UploadStatus,
        progress: 0,
      }));

      setUploadedFiles((prev) => {
        const combined = [...prev, ...newFiles];
        // Enforce maxFiles
        if (combined.length > maxFiles) {
          return combined.slice(0, maxFiles);
        }
        return combined;
      });

      // Start upload simulation (will be replaced with real API call)
      if (acceptedFiles.length > 0) {
        simulateUpload(newFiles);
      }
    },
    [maxFiles]
  );

  const simulateUpload = (files: UploadedFile[]) => {
    setUploading(true);
    files.forEach((file) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? { ...f, status: "success", progress: 100 }
                : f
            )
          );
          // Check if all done
          setUploadedFiles((prev) => {
            const allDone = prev.every(
              (f) => f.status === "success" || f.status === "error"
            );
            if (allDone) {
              setUploading(false);
              onUploadComplete?.(
                prev
                  .filter((f) => f.status === "success")
                  .map((f) => ({ id: f.id, name: f.file.name }))
              );
            }
            return prev;
          });
        } else {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, progress: Math.round(progress) } : f
            )
          );
        }
      }, 200);
    });
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAll = () => {
    setUploadedFiles([]);
  };

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_TYPES,
      maxSize: MAX_FILE_SIZE,
      maxFiles,
      validator: (file) => {
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (!ACCEPTED_EXTENSIONS.includes(ext)) {
          return {
            code: "invalid-type",
            message: `File type ${ext} is not supported.`,
          };
        }
        return null;
      },
    });

  const isFull = uploadedFiles.length >= maxFiles;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        {...getRootProps()}
        className={cn(
          "relative cursor-pointer border-2 border-dashed transition-all",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/5",
          isFull && "pointer-events-none opacity-50"
        )}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <input {...getInputProps()} />
          <div
            className={cn(
              "mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary transition-colors",
              isDragActive && !isDragReject && "bg-primary/10"
            )}
          >
            <Upload
              className={cn(
                "h-5 w-5 text-muted-foreground transition-colors",
                isDragActive && !isDragReject && "text-primary"
              )}
            />
          </div>
          {isDragActive ? (
            <p className="text-sm font-medium text-primary">
              Drop files here to upload
            </p>
          ) : (
            <>
              <p className="mb-1 text-sm font-medium">
                {isFull
                  ? "Maximum files reached"
                  : "Drag & drop files here"}
              </p>
              <p className="mb-4 text-xs text-muted-foreground">
                or click to browse
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {ACCEPTED_EXTENSIONS.map((ext) => (
                  <Badge key={ext} variant="secondary" className="text-[10px]">
                    {ext}
                  </Badge>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Max file size: {formatFileSize(MAX_FILE_SIZE)} · Up to{" "}
                {maxFiles} files
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""}
            </p>
            {!uploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-7 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            {uploadedFiles.map((file) => {
              const Icon = getFileIcon(file.file.type);
              const fileExt = file.file.name.split(".").pop()?.toLowerCase();
              const isImage = file.file.type.startsWith("image/");

              return (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-border p-3 transition-all",
                    file.status === "success" && "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/20",
                    file.status === "error" && "border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/20"
                  )}
                >
                  {/* Icon */}
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-secondary">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* File Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {file.file.name}
                      </p>
                      {file.status === "success" && (
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.file.size)}</span>
                      <span>·</span>
                      <span>.{fileExt}</span>
                    </div>

                    {/* Progress Bar */}
                    {file.status === "uploading" && (
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}
                    {file.status === "uploading" && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Processing... {file.progress}%
                      </p>
                    )}
                  </div>

                  {/* Remove Button */}
                  {file.status !== "uploading" && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {file.status === "uploading" && (
                    <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}