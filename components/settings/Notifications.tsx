import { useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import useSWR from "swr";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface NotificationSettings {
  enabled: boolean;
  status?: string;
  executedAt?: string;
  nextExecuteAt?: string;
  result?: string;
}

const tryParseJson = (json: string | undefined | null) => {
  if (!json) {
    return "unknown";
  }

  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch (_error) {
    return json;
  }
};

const NotificationForPeriod = ({
  type,
  title,
  description
}: {
  type: string;
  title: string;
  description: string;
}) => {
  const { data: status, mutate: invalidate } = useSWR<NotificationSettings>(
    `/api/settings/notification/${type}`,
    null,
    {
      revalidateOnFocus: false
    }
  );

  const forceTask = useCallback(async (type: string) => {
    const response = await fetch(`/api/settings/notification/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        force: true
      })
    });

    if (response.ok) {
      toast({
        title: `Successfully started ${type} task`
      });
    } else {
      toast({
        title: `Failed to start ${type} task`,
        variant: "destructive"
      });
    }
  }, []);

  const updateNotification = useCallback(async (type: string, enabled: boolean) => {
    const response = await fetch(`/api/settings/notification/${type}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled
      })
    });

    if (response.ok) {
      toast({
        title: `Successfully ${enabled ? "enabled" : "disabled"} ${type} notifications`
      });
    } else {
      toast({
        title: `Failed to update ${type} notifications`,
        variant: "destructive"
      });
    }
  }, []);

  return (
    <div className="flex items-start justify-between">
      <div className="space-y-0.5 flex flex-col gap-2">
        <Label className="text-lg">{title}</Label>
        <p className="text-sm text-muted-foreground">
          {description}
          <div className="grid grid-cols-[94px_repeat(3,1fr)] mt-2 gap-2">
            <div className="font-medium w-24">Task status</div>
            <div className="col-span-3">{status?.status ?? "unknown"}</div>
            <div className="font-medium w-24">Last run</div>
            <div className="col-span-3">
              {status?.executedAt
                ? formatDate(status?.executedAt, "MMM d, yyyy h:mm a")
                : "never"}
            </div>
            <div className="font-medium w-24">Next run</div>
            <div className="col-span-3">
              {status?.nextExecuteAt
                ? formatDate(status?.nextExecuteAt, "MMM d, yyyy h:mm a")
                : "never"}
            </div>
            <div className="font-medium w-24">Result</div>
            <div className="col-span-3 break-all">{tryParseJson(status?.result)}</div>
          </div>
        </p>

        <div>
          <Button
            variant="outline"
            className="flex gap-2"
            disabled={!status?.enabled}
            onClick={() => forceTask(type).then(() => invalidate())}
          >
            <RefreshCcw className="h-4 w-4" />
            Run now
          </Button>
        </div>
      </div>

      <Switch
        checked={status?.enabled}
        disabled={status === undefined}
        onCheckedChange={(checked: boolean) =>
          updateNotification(type, checked).then(() => invalidate())
        }
      />
    </div>
  );
};

export const Notifications = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Configure your notification and maintenance preferences. Will send emails to the all
          users of your company.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <NotificationForPeriod
            type="minute"
            title="Minute"
            description="Maintenance and upkeep. Internal task."
          />

          <NotificationForPeriod
            type="hour"
            title="Hourly"
            description="Cleanup logs older than 30 days."
          />

          <NotificationForPeriod
            type="day"
            title="Daily"
            description="Get a daily summary of your hosts and apps."
          />

          <NotificationForPeriod
            type="week"
            title="Weekly"
            description="Get a weekly summary of your hosts and apps."
          />

          <NotificationForPeriod
            type="month"
            title="Monthly"
            description="Get a monthly summary of your hosts and apps."
          />
        </div>
      </CardContent>
    </Card>
  );
};
