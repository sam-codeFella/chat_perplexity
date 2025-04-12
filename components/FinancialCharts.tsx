import React from 'react';

interface FinancialChartsProps {
  companyName: string;
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({ companyName }) => {
  return (
    <div className="p-4 mb-4 rounded-lg border bg-card text-card-foreground shadow-sm">
      <h2 className="text-lg font-semibold mb-2">Financial Charts</h2>
      <div className="min-h-[200px]">
        {/* This is where we'll render the charts */}
        <p className="text-muted-foreground">Loading financial charts for {companyName}...</p>
      </div>
    </div>
  );
}; 