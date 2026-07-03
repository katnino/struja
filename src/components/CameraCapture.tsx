"use client";

import { useState, useRef, useCallback } from "react";

export interface PhotoData {
  base64: string;
  mediaType: string;
  preview: string;
  file: File;
}

export function CameraCapture({
  onPhotosChange,
}: {
  onPhotosChange: (photos: PhotoData[]) => void;
}) {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [dropOver, setDropOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: FileList) => {
    const list = Array.from(files).slice(0, 1).map(
      (file) =>
        new Promise<PhotoData>((resolve) => {
          const preview = URL.createObjectURL(file);
          const reader = new FileReader();
          reader.onload = (e) => {
            const b64full = e.target?.result as string;
            const base64 = b64full.split(",")[1];
            resolve({ base64, mediaType: file.type, preview, file });
          };
          reader.readAsDataURL(file);
        })
    );
    const result = await Promise.all(list);
    setPhotos(result);
    onPhotosChange(result);
  }, [onPhotosChange]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDropOver(false);
      if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  return (
    <div>
      <div
        style={{
          border: `2px dashed ${dropOver ? "var(--accent-strong)" : "var(--border-strong)"}`,
          borderRadius: 8,
          padding: "28px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: dropOver ? "var(--surface-2)" : "transparent",
          transition: "all 0.15s",
          marginBottom: 14,
        }}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDropOver(true); }}
        onDragLeave={() => setDropOver(false)}
        onClick={() => fileRef.current?.click()}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
        <div style={{ fontSize: 13, color: "var(--fg-dim)" }}>
          {photos.length > 0
            ? "Kliknite za zamjenu fotografije"
            : "Prevucite fotografiju ili kliknite za odabir"}
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-faint)", marginTop: 4 }}>
          JPG, PNG, WEBP
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
      </div>

      {photos.map((p, i) => (
        <div
          key={i}
          style={{
            borderRadius: 6,
            overflow: "hidden",
            border: "1px solid var(--border-strong)",
            marginBottom: 14,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.preview}
            alt="meter photo"
            style={{ width: "100%", display: "block", maxHeight: 200, objectFit: "cover" }}
            onLoad={() => URL.revokeObjectURL(p.preview)}
          />
        </div>
      ))}
    </div>
  );
}
