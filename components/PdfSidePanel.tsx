'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePdfDisplay } from '@/hooks/use-pdf-display';
import { Button } from './ui/button';
import { X } from 'lucide-react';

const PdfSidePanel = () => {
  const { pdfUrl, isPdfVisible, hidePdf } = usePdfDisplay();
  
  return (
    <AnimatePresence>
      {isPdfVisible && pdfUrl && (
        <motion.div
          className="fixed right-0 top-0 bottom-0 w-[40%] h-dvh shadow-lg bg-background z-40 border-l"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium">Source Document</h3>
              <Button variant="ghost" size="icon" onClick={hidePdf}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe 
                src={pdfUrl} 
                width="100%" 
                height="100%" 
                className="border-0"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PdfSidePanel; 