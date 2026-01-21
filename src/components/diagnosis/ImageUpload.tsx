import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Camera, X, Loader2, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  isUploading?: boolean;
  previewUrl?: string | null;
  onClear?: () => void;
}

export function ImageUpload({
  onImageSelect,
  isUploading = false,
  previewUrl,
  onClear,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onImageSelect(acceptedFiles[0]);
      }
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    noClick: !!previewUrl,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
    onDropRejected: () => setDragActive(false),
  });

  if (previewUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden border-2 border-primary/20 bg-muted/50">
        <img
          src={previewUrl}
          alt="Plant preview"
          className="w-full h-64 md:h-80 object-cover"
        />
        {!isUploading && onClear && (
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-3 right-3"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">Analyzing image...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer",
        dragActive
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
      )}
    >
      <input {...getInputProps()} />
      <div className="p-8 md:p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Image className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">Upload Plant Image</h3>
        <p className="mb-6 text-sm text-muted-foreground max-w-sm mx-auto">
          Drag and drop a clear photo of your plant, or click to browse. 
          Supports JPG, PNG, WebP up to 10MB.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button type="button" onClick={open}>
            <Upload className="mr-2 h-4 w-4" />
            Choose File
          </Button>
          <Button type="button" variant="outline" onClick={open}>
            <Camera className="mr-2 h-4 w-4" />
            Take Photo
          </Button>
        </div>
      </div>
    </div>
  );
}