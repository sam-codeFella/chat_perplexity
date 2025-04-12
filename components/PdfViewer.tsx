import { useState, useEffect } from 'react';

const PdfViewer = ({ pdfUrl }: { pdfUrl: string }) => (
  <iframe src={pdfUrl} width="100%" height="500px" />
);

export default PdfViewer; 