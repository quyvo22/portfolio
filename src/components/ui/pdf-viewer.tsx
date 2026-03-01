"use client";

import { useState, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Loader2,
  FileWarning,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const ZOOM_LEVELS = [0.75, 1, 1.5] as const;

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(1); // default 100%
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const zoom = ZOOM_LEVELS[zoomIndex];

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
    setLoadError(false);
  }

  function onDocumentLoadError() {
    setLoadError(true);
  }

  const goToPrev = useCallback(() => {
    setPageNumber((p) => Math.max(1, p - 1));
  }, []);

  const goToNext = useCallback(() => {
    setPageNumber((p) => Math.min(numPages, p + 1));
  }, [numPages]);

  function handleZoomIn() {
    setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1));
  }

  function handleZoomOut() {
    setZoomIndex((i) => Math.max(0, i - 1));
  }

  async function toggleFullscreen() {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  if (loadError) {
    return (
      <div className="card">
        <div className="aspect-[3/4] bg-surface-overlay flex flex-col items-center justify-center gap-3 text-ink-faint">
          <FileWarning size={48} strokeWidth={1} />
          <p className="text-sm font-medium">Không thể tải file PDF</p>
          <p className="text-xs">Vui lòng kiểm tra lại đường dẫn</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="card flex flex-col bg-surface-overlay">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-surface text-sm">
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrev}
            disabled={pageNumber <= 1}
            className="p-1.5 rounded-md hover:bg-surface-overlay disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Trang trước"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-ink-muted tabular-nums px-1">
            {pageNumber} / {numPages || "–"}
          </span>
          <button
            onClick={goToNext}
            disabled={pageNumber >= numPages}
            className="p-1.5 rounded-md hover:bg-surface-overlay disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Trang sau"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            disabled={zoomIndex <= 0}
            className="p-1.5 rounded-md hover:bg-surface-overlay disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Thu nhỏ"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-ink-muted tabular-nums px-1 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoomIndex >= ZOOM_LEVELS.length - 1}
            className="p-1.5 rounded-md hover:bg-surface-overlay disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Phóng to"
          >
            <ZoomIn size={16} />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md hover:bg-surface-overlay transition-colors"
            aria-label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto flex justify-center p-4 bg-surface-overlay min-h-[60vh]">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-faint">
              <Loader2 size={32} className="animate-spin" />
              <p className="text-sm">Đang tải PDF...</p>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={zoom}
            loading={
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-ink-faint" />
              </div>
            }
          />
        </Document>
      </div>
    </div>
  );
}
