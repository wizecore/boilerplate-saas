import { CheckCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import useSWR from "swr";

import { AppShell } from "@/components/AppShell";
import { JSONSafe, Task } from "@/types";
import { cn, formatDistanceTime, queryField, str, unjsona } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/router";
import { dashboardMenu } from "@/components/dashboard/menu";

const Page = () => {
  const router = useRouter();
  const tab = str(router?.query?.status) ?? "all";
  const [page, setPage] = useState(1);
  const {
    data: tasks,
    mutate,
    isValidating
  } = useSWR<JSONSafe<Task>[]>(
    "/api/task?" +
      queryField("status", tab == "all" ? undefined : tab) +
      "&limit=10&page=" +
      page
  );

  return (
    <AppShell menuItem={dashboardMenu.task}>
      <Card className="mb-4 gradient-header m-4 py-4">
        <CardHeader>
          <CardTitle className="text-xl">Tasks</CardTitle>
          <CardDescription className="text-secondary-foreground">
            Show the tasks which have been executed.
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid flex-1 items-start gap-4 p-4 pt-0">
        <Tabs value={tab} onValueChange={value => router.push(`/task?status=${value}`)}>
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="error">Error</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                className="h-8 gap-1"
                onClick={e => {
                  e.preventDefault();
                  mutate();
                }}
              >
                Refresh
              </Button>
            </div>
          </div>
          <TabsContent value={tab}>
            <Card x-chunk="dashboard-06-chunk-0">
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>
                  Show the tasks which have been executed on the hosts, apps and services.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden w-[40px] sm:table-cell">
                        <span className="sr-only">Image</span>
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden md:table-cell">Status</TableHead>
                      <TableHead className="hidden md:table-cell">Created</TableHead>
                      <TableHead className="hidden md:table-cell">Executed</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className={cn(isValidating && "opacity-50")}>
                    {unjsona(tasks).map(task => (
                      <TableRow key={task.id}>
                        <TableCell className="hidden sm:table-cell">
                          <CheckCheck height="32" width="32" />
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link href={`/journal?taskId=${task.id}`}>{task.type}</Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{task.status ?? "Draft"}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatDistanceTime(task.createdAt)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatDistanceTime(task.executedAt)}
                        </TableCell>
                        <TableCell className="line-clamp-1">
                          {JSON.stringify(task.result, null, 2)}
                        </TableCell>
                      </TableRow>
                    ))}

                    {tasks && tasks.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No tasks found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-xs text-muted-foreground">
                  Showing{" "}
                  <strong>
                    {tasks && tasks?.length > 0 ? 1 : 0}-{tasks?.length}
                  </strong>{" "}
                  of <strong>{tasks?.length}+</strong> tasks
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button size="sm" className="h-8 gap-1" onClick={() => setPage(page + 1)}>
                    Next
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
};

export default Page;
