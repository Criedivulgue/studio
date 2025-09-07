"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function AiConfigPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-headline font-semibold">AI Configuration</h1>
        <p className="text-muted-foreground">
          Tailor your personal AI assistant's behavior and response style.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Assistant Settings</CardTitle>
          <CardDescription>
            These settings only apply to chats initiated through your unique admin link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4 rounded-md border p-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="use-custom-info" className="font-semibold">
                Use Custom User Information
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow the AI to use custom information to produce better support conversations.
              </p>
            </div>
            <Switch id="use-custom-info" defaultChecked />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-instructions" className="font-semibold">
              Custom Instructions
            </Label>
            <Textarea
              id="custom-instructions"
              placeholder="e.g., Always be friendly and use emojis. Prioritize issues related to billing."
              className="min-h-[120px]"
            />
            <p className="text-sm text-muted-foreground">
              Provide specific guidelines or context for your AI assistant. This will be included in every prompt.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
