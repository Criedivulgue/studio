"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { broadcastData } from "@/lib/data";
import type { Broadcast } from "@/lib/types";
import { MoreHorizontal, PlusCircle, Mail, Bell } from "lucide-react";
import { Icons } from "@/components/icons";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const channelIcons = {
  Email: <Mail className="w-4 h-4" />,
  WhatsApp: <Icons.whatsApp className="w-4 h-4" />,
  Push: <Bell className="w-4 h-4" />,
};

export default function BroadcastPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <header className="space-y-1.5">
          <h1 className="text-2xl font-headline font-semibold">Broadcasts</h1>
          <p className="text-muted-foreground">
            Create, manage, and monitor your corporate announcements.
          </p>
        </header>
        <Sheet>
          <SheetTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Broadcast
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle className="font-headline">New Broadcast</SheetTitle>
              <SheetDescription>
                Craft a message and send it to your users across multiple channels.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-6 py-6">
              <div className="grid gap-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Type your announcement here..." className="min-h-[120px]" />
              </div>
              <div className="grid gap-2">
                <Label>Channels</Label>
                <div className="flex items-center gap-4">
                  {(['Email', 'WhatsApp', 'Push'] as const).map((channel) => (
                    <div key={channel} className="flex items-center space-x-2">
                       <Checkbox id={`channel-${channel}`} />
                       <Label htmlFor={`channel-${channel}`} className="flex items-center gap-2 font-normal">
                        {channelIcons[channel]} {channel}
                       </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="target-audience">Target Audience</Label>
                <Select>
                  <SelectTrigger id="target-audience">
                    <SelectValue placeholder="Select an audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="new">New User</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="outline">Save as Draft</Button>
              <Button>Send Now</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Broadcast History</CardTitle>
          <CardDescription>A log of all past and scheduled broadcasts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Message</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {broadcastData.map((broadcast) => (
                <TableRow key={broadcast.id}>
                  <TableCell className="max-w-xs truncate">{broadcast.message}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {broadcast.channels.map(channel => (
                        <div key={channel} className="flex items-center gap-1">
                          {channelIcons[channel]}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{broadcast.target}</TableCell>
                  <TableCell>
                    <Badge variant={
                      broadcast.status === 'Sent' ? 'default' : 
                      broadcast.status === 'Scheduled' ? 'secondary' : 'outline'
                    }
                    className={broadcast.status === 'Sent' ? 'bg-green-600/20 text-green-700 border-green-600/30' : ''}
                    >
                      {broadcast.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{broadcast.date}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
