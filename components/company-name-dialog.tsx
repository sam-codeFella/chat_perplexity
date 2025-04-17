'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Define company interface
interface Company {
  id: string | number;
  name: string;
  [key: string]: any; // Allow for additional properties
}

interface CompanyNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyNameSubmit: (companyName: string) => void;
}

export function CompanyNameDialog({
                                    open,
                                    onOpenChange,
                                    onCompanyNameSubmit,
                                  }: CompanyNameDialogProps) {
  const [companyName, setCompanyName] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCompanies();
    }
  }, [open]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/companies');
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (companyName.trim()) {
      onCompanyNameSubmit(companyName.trim());
      setCompanyName('');
      onOpenChange(false);
    }
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Chat</DialogTitle>
            <DialogDescription>
              Please select a company for this chat session.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select onValueChange={(value) => setCompanyName(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                    <SelectItem value="loading" disabled>
                      Loading companies...
                    </SelectItem>
                ) : (
                    companies.map((company) => (
                        <SelectItem key={company.id || `company-${company.name}`} value={company.name}>
                          {company.name}
                        </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!companyName.trim()}>
              Start Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
} 