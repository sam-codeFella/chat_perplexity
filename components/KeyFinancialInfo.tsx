import React from 'react';

interface KeyFinancialInfoProps {
  companyName: string;
}

export const KeyFinancialInfo: React.FC<KeyFinancialInfoProps> = ({ companyName }) => {
  return (
    <div className="p-4 mb-4 rounded-lg border bg-card text-card-foreground shadow-sm">
      <h2 className="text-lg font-semibold mb-2">Key Financial Information</h2>
      <div className="min-h-[150px]">
        {/* This is where we'll render the key financial metrics */}
        <p className="text-muted-foreground">Loading key financial information for {companyName}...</p>
      </div>
    </div>
  );
}; 