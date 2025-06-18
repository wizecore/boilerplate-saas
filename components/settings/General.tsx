import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import useSWR from "swr";
import { Label } from "@radix-ui/react-dropdown-menu";
import { User } from "@/types";

export const General = () => {
  const [settings, setSettings] = useState<Pick<User, "name" | "image">>({
    name: "",
    image: ""
  });

  useSWR<Pick<User, "name" | "image">>("/api/settings", null, {
    onSuccess: setSettings
  });

  const handleSave = useCallback(async () => {
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings })
    });
    if (response.ok) {
      toast({ title: "Saved successfully" });
    } else {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  }, [settings]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>General</CardTitle>
        <CardDescription>General settings for the user.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <Label>Name</Label>
          <Input
            placeholder="Name"
            value={settings.name || ""}
            onChange={e =>
              setSettings(settings => ({
                ...settings,
                name: e.target.value
              }))
            }
          />
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSave}>Save</Button>
      </CardFooter>
    </Card>
  );
};
