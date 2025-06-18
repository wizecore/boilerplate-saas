import { AppShell } from "@/components/AppShell";
import { Card, CardDescription, CardTitle, CardHeader } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <AppShell>
      <Card className="mb-4 gradient-header m-4 py-4">
        <CardHeader>
          <CardTitle className="text-xl">Dashboard</CardTitle>
          <CardDescription className="text-secondary-foreground">
            Show the dashboard.
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid flex-1 items-start gap-4 p-4 pt-0">Nothing here, yet</div>
    </AppShell>
  );
}
