import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useUploadPhotos } from "@/hooks/useVacationGalleryApi";
import { AsyncImage } from "@/components/async-image";
import {
  resizeImage,
  isDisplayableImage,
  isRawImageFile,
  convertDngToJpeg,
} from "@/lib/image-processing";
import {
  X,
  Upload,
  FileImage,
  MapPin,
  AlertTriangle,
  Plus,
  CheckSquare,
  Square,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingButton } from "../loading-button";
import { UploadPhotosRequestItem } from "@/api/api";
import { PhotoEditableMetadata } from "@common/types/photo";
import { extractExifData } from "@common/utils/exif";
import PhotoEditForm from "../photo-edit-form";
import { useForm } from "react-hook-form";

interface UploadFile {
  file: File;
  originalFile: File; // Keep reference to original
  id: string;
  metadata: PhotoEditableMetadata;
  title?: string;
  description?: string;
  isRaw?: boolean;
  isResized?: boolean;
  originalSize?: number;
  timestamp?: Date;
}

interface UploadDialogProps {
  files: File[] | null;
  tripId: string;
  onClose: () => void;
}

export function UploadDialog({ files, tripId, onClose }: UploadDialogProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFiles, setPreviewFiles] = useState<UploadFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showEditForm, setShowEditForm] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [useOriginalFiles, setUseOriginalFiles] = useState(false);

  // Batch metadata
  const [batchTitle, setBatchTitle] = useState("");
  const [batchDescription, setBatchDescription] = useState("");

  const { mutateAsync: uploadPhotos, isPending } = useUploadPhotos();

  const initializeFiles = async (fileList: File[]) => {
    const filesWithMetadata: UploadFile[] = await Promise.all(
      fileList.map(async (originalFile, index) => {
        const metadata = await extractExifData(originalFile);
        console.log(metadata);

        // Resize image if it's a displayable image
        let processedFile = originalFile;
        let isResized = false;

        if (isDisplayableImage(originalFile)) {
          try {
            processedFile = await resizeImage(originalFile, {
              maxWidth: 2048,
              maxHeight: 2048,
              quality: 0.85,
            });
            isResized = processedFile.size < originalFile.size;
          } catch (error) {
            console.warn("Failed to resize image:", error);
            processedFile = originalFile;
          }
        } else if (isRawImageFile(originalFile)) {
          const convertedFile = await convertDngToJpeg(originalFile);
          if (convertedFile) {
            processedFile = convertedFile;
            isResized = processedFile.size < originalFile.size;
          }
        }

        return {
          file: processedFile,
          originalFile,
          id: `file-${index}-${Date.now()}`,
          metadata: metadata,
          isRaw: isRawImageFile(originalFile),
          isResized,
          originalSize: originalFile.size,
        } satisfies UploadFile;
      })
    );
    setPreviewFiles(filesWithMetadata);
  };

  useEffect(() => {
    if (files) {
      initializeFiles(files);
    }
  }, [files]);

  const startEditing = () => {
    setShowEditForm(true);
  };

  const cancelEdit = () => {
    setShowEditForm(false);
  };

  const handleEditSubmit = async (formdata: {
    value: PhotoEditableMetadata;
  }) => {};

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<{
    value: PhotoEditableMetadata;
  }>({
    defaultValues: {
      value: {},
    },
  });

  const { value } = watch();

  const handleUpload = async () => {
    if (!previewFiles.length) return;

    try {
      // Extract the actual File objects from FileWithMetadata
      const filesToUpload = previewFiles.map(
        (fileWithMeta) =>
          ({
            file: useOriginalFiles
              ? fileWithMeta.originalFile
              : fileWithMeta.file,
            metadata: {
              ...fileWithMeta.metadata,
              fileName: fileWithMeta.file.name,
            },
          }) satisfies UploadPhotosRequestItem
      );

      await uploadPhotos({
        request: {
          tripId: tripId,
          files: filesToUpload,
        },
        onProgress: setUploadProgress,
      });

      toast.success(`Successfully uploaded ${previewFiles.length} photo(s)!`);
      onClose();
    } catch (error) {
      toast.error(
        `Failed to upload photos: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const removeFile = (fileId: string) => {
    setPreviewFiles((prev) => prev.filter((f) => f.id !== fileId));
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
  };

  const addMoreFiles = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,.dng,.raw,.cr2,.nef,.arw,.orf,.rw2";
    input.onchange = async () => {
      const newFiles = input.files;
      if (newFiles && newFiles.length > 0) {
        const additionalFiles: UploadFile[] = await Promise.all(
          Array.from(newFiles).map(async (originalFile, index) => {
            const metadata = await extractExifData(originalFile);

            // Resize image if it's a displayable image
            let processedFile = originalFile;
            let isResized = false;

            if (isDisplayableImage(originalFile)) {
              try {
                processedFile = await resizeImage(originalFile, {
                  maxWidth: 2048,
                  maxHeight: 2048,
                  quality: 0.85,
                });
                isResized = processedFile.size < originalFile.size;
              } catch (error) {
                console.warn("Failed to resize image:", error);
                processedFile = originalFile;
              }
            }

            return {
              file: processedFile,
              originalFile,
              id: `file-${previewFiles.length + index}-${Date.now()}`,
              metadata,
              isRaw: isRawImageFile(originalFile),
              isResized,
              originalSize: originalFile.size,
            } satisfies UploadFile;
          })
        );
        setPreviewFiles((prev) => [...prev, ...additionalFiles]);
      }
    };
    input.click();
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const selectAllFiles = () => {
    if (selectedFiles.size === previewFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(previewFiles.map((f) => f.id)));
    }
  };

  const applyBatchMetadata = () => {
    if (selectedFiles.size === 0) {
      toast.error("Please select files to apply batch metadata");
      return;
    }

    setPreviewFiles((prev) =>
      prev.map((file) => {
        if (selectedFiles.has(file.id)) {
          return {
            ...file,
            title: batchTitle.trim() || file.title,
            description: batchDescription.trim() || file.description,
          };
        }
        return file;
      })
    );

    toast.success(`Applied metadata to ${selectedFiles.size} file(s)`);
    setSelectedFiles(new Set());
    setShowEditForm(false);
    setBatchTitle("");
    setBatchDescription("");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  useEffect(() => {
    if (showEditForm) {
      const firstSelected = previewFiles.find(f => f.id && f.id == Array.from(selectedFiles).at(0))
      if (firstSelected) {
        reset({
          value: firstSelected.metadata
        })
      }
    }
  }, [showEditForm])

  return (
    <>
      <Dialog open={files != null} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Photos
            </DialogTitle>
            <DialogDescription>
              Upload {previewFiles.length} photo(s) to this trip
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Control Panel */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Button
                variant="outline"
                size="sm"
                onClick={addMoreFiles}
                disabled={isPending}
                className="gap-2 grow"
              >
                <Plus className="w-4 h-4" />
                Add More Files
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={selectAllFiles}
                disabled={isPending}
                className="gap-2 grow"
              >
                {selectedFiles.size === previewFiles.length ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <CheckSquare className="w-4 h-4" />
                )}
                {selectedFiles.size === previewFiles.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>

              {selectedFiles.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditForm(!showEditForm)}
                  disabled={isPending}
                  className="gap-2 grow"
                >
                  <Settings className="w-4 h-4" />
                  {showEditForm ? "Editing" : "Edit"} {selectedFiles.size} files
                </Button>
              )}

              {previewFiles.some((f) => f.isResized) && (
                <Button
                  variant={useOriginalFiles ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => setUseOriginalFiles(!useOriginalFiles)}
                  disabled={isPending}
                  className="gap-2 grow"
                >
                  {useOriginalFiles ? "📁 Original" : "⚡ Optimized"}
                </Button>
              )}
            </div>

            {/* Batch Controls */}
            {showEditForm && selectedFiles.size > 0 && (
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <h4 className="font-medium mb-3 text-sm">
                  Apply to {selectedFiles.size} selected file(s)
                </h4>
                <PhotoEditForm
                  value={value}
                  onChange={(v) => setValue("value", v)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={applyBatchMetadata}
                    disabled={isPending}
                  >
                    Apply Changes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Upload progress */}
            {isPending && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* File preview grid */}
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {previewFiles.map((file) => (
                  <div key={file.id} className="relative group">
                    <div
                      className={`aspect-square relative overflow-hidden rounded-lg border-2 transition-all ${
                        selectedFiles.has(file.id)
                          ? "border-blue-500"
                          : file.metadata.latitude && file.metadata.longitude
                            ? "border-green-300"
                            : "border-orange-300"
                      }`}
                    >
                      {/* Selection checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox
                          checked={selectedFiles.has(file.id)}
                          onCheckedChange={() => toggleFileSelection(file.id)}
                          disabled={isPending}
                          className="bg-white/90 border-gray-400"
                        />
                      </div>

                      {/* GPS status indicator */}
                      <div className="absolute top-2 right-2 z-10">
                        {file.metadata.longitude && file.metadata.latitude ? (
                          <div className="p-1 bg-green-500 text-white rounded-full">
                            <MapPin className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="p-1 bg-orange-500 text-white rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {isDisplayableImage(file.originalFile) ? (
                        <AsyncImage
                          file={file.file}
                          alt={file.originalFile.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          onLoad={(e) => {
                            const img = e.target as HTMLImageElement;
                            if (img.src.startsWith("blob:")) {
                              setTimeout(
                                () => URL.revokeObjectURL(img.src),
                                1000
                              );
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-muted relative">
                          <AsyncImage
                            file={file.originalFile}
                            alt={file.originalFile.name}
                            className="w-full h-full object-contain"
                          />
                          {file.isRaw && (
                            <div className="absolute bottom-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                              RAW
                            </div>
                          )}
                        </div>
                      )}

                      {/* File info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                        <div>
                          <div className="truncate">
                            {file.originalFile.name}
                          </div>
                          <div className="flex justify-between">
                            <span>
                              {formatFileSize(file.file.size)}
                              {file.isResized && (
                                <span className="text-green-300 ml-1">
                                  (↓
                                  {Math.round(
                                    (1 - file.file.size / file.originalSize!) *
                                      100
                                  )}
                                  %)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => removeFile(file.id)}
                            disabled={isPending}
                            className="p-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs disabled:opacity-50"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {previewFiles.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileImage className="w-12 h-12 mx-auto mb-2" />
                  <p>No files selected</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <div className="flex justify-between items-center w-full">
              <span className="text-sm text-muted-foreground">
                {previewFiles.length} file(s) • {selectedFiles.size} selected
                {previewFiles.length > 0 && (
                  <span className="ml-2">
                    Total:{" "}
                    {formatFileSize(
                      previewFiles.reduce(
                        (sum, f) =>
                          sum +
                          (useOriginalFiles ? f.originalSize! : f.file.size),
                        0
                      )
                    )}
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <LoadingButton
                  loading={isPending}
                  onClick={handleUpload}
                  disabled={previewFiles.length === 0}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload {previewFiles.length} Photo(s)
                </LoadingButton>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
