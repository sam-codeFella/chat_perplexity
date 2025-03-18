import { Message } from 'ai';
import { memo } from 'react';
import { ExternalLinkIcon } from './icons';

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface WebSearchProps {
  results: WebSearchResult[];
}

function PureWebSearch({ results }: WebSearchProps) {
  if (!results || results.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border rounded-lg p-4 bg-muted/50 mb-4">
      <div className="text-sm font-medium text-muted-foreground mb-2">Web Search Results</div>
      <div className="flex flex-col gap-3">
        {results.map((result, index) => (
          <div key={index} className="flex flex-col gap-1">
            <a 
              href={result.url}
              target="_blank"
              rel="noopener noreferrer" 
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              {result.title}
              <ExternalLinkIcon className="h-3 w-3" />
            </a>
            <p className="text-sm text-muted-foreground">{result.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export const WebSearch = memo(PureWebSearch); 