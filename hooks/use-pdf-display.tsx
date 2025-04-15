'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface PdfDisplayContextType {
  pdfUrl: string | null;
  isPdfVisible: boolean;
  showPdf: (url: string) => void;
  hidePdf: () => void;
}

const PdfDisplayContext = createContext<PdfDisplayContextType>({
  pdfUrl: null,
  isPdfVisible: false,
  showPdf: () => {},
  hidePdf: () => {},
});

export function PdfDisplayProvider({ children }: { children: ReactNode }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfVisible, setIsPdfVisible] = useState(false);

  const showPdf = (url: string) => {
    setPdfUrl(url);
    setIsPdfVisible(true);
  };

  const hidePdf = () => {
    setIsPdfVisible(false);
  };

  return (
    <PdfDisplayContext.Provider
      value={{
        pdfUrl,
        isPdfVisible,
        showPdf,
        hidePdf,
      }}
    >
      {children}
    </PdfDisplayContext.Provider>
  );
}

export const usePdfDisplay = () => useContext(PdfDisplayContext); 