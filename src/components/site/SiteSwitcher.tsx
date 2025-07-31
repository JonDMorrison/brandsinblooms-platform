'use client';

import React from 'react';
import { Check, ChevronsUpDown, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSite } from '@/hooks/useSite';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function SiteSwitcher() {
  const { currentSite, userSites, switchSite, loading } = useSite();
  const [open, setOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="h-9 w-[200px] animate-pulse bg-muted rounded-md" />
    );
  }

  if (!currentSite || userSites.length === 0) {
    return null;
  }

  // Don't show switcher if user only has one site
  if (userSites.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={currentSite.logo_url || undefined} alt={currentSite.business_name || undefined} />
          <AvatarFallback>
            <Store className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium truncate max-w-[150px]">
          {currentSite.business_name}
        </span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <Avatar className="h-5 w-5">
              <AvatarImage src={currentSite.logo_url || undefined} alt={currentSite.business_name || undefined} />
              <AvatarFallback>
                <Store className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{currentSite.business_name}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search sites..." />
          <CommandEmpty>No site found.</CommandEmpty>
          <CommandGroup>
            {userSites.map((siteWithMembership) => (
              <CommandItem
                key={siteWithMembership.id}
                value={siteWithMembership.id}
                onSelect={() => {
                  switchSite(siteWithMembership.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    currentSite.id === siteWithMembership.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <Avatar className="h-5 w-5 mr-2">
                  <AvatarImage src={siteWithMembership.logo_url || undefined} alt={siteWithMembership.business_name || undefined} />
                  <AvatarFallback>
                    <Store className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="truncate">{siteWithMembership.business_name}</span>
                  <span className="text-xs text-muted-foreground">{siteWithMembership.membership?.role}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}