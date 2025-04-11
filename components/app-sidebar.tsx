'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { PlusIcon } from '@/components/icons'; //icon for the plus button - where the new chat happens. 
import { SidebarHistory } from '@/components/sidebar-history';// component for the sidebar history. 
import { SidebarUserNav } from '@/components/sidebar-user-nav';// component for the sidebar user navigation. 
import { Button } from '@/components/ui/button';// component for the button.
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { CompanyNameDialog } from './company-name-dialog';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar(); //what does this do? 
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleNewChat = (companyName: string) => {
    setOpenMobile(false);
    // Store the company name in localStorage to be used by the chat page
    localStorage.setItem('currentChatTitle', companyName); //it's upto me how to use this currentChatTitle from localStorage.
    router.push('/');
    router.refresh();
  };

  return (
    <>
      <Sidebar className="group-data-[side=left]:border-r-0">
        <SidebarHeader>
          <SidebarMenu>
            <div className="flex flex-row justify-between items-center">
              <Link
                href="/"
                onClick={() => {
                  setOpenMobile(false);
                }}
                className="flex flex-row gap-3 items-center"
              >
                <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                  VeritaForge Research
                </span>
              </Link>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    type="button"
                    className="p-2 h-fit"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <PlusIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end">New Chat</TooltipContent>
              </Tooltip>
            </div>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarHistory user={user} />
        </SidebarContent>
        <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
      </Sidebar>
      <CompanyNameDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCompanyNameSubmit={handleNewChat}
      />
    </>
  );
}
