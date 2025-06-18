import { FileWarning } from "lucide-react";

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
import { JSONSafe, TaskTypes } from "@/types";
import { ListJournalResponse } from "@/pages/api/journal";
import React from "react";
import { cn, str } from "@/lib/utils";
import { OptionalLink } from "@/components/OptionalLink";
import { useRouter } from "next/router";
import { dashboardMenu } from "@/components/dashboard/menu";

const Page = () => {
  const router = useRouter();
  const taskId = str(router.query.taskId);
  const tab = str(router.query.tab) ?? (taskId ? "task" : "all");
  const [page, setPage] = React.useState(1);
  const {
    data: logs,
    mutate,
    isValidating
  } = useSWR<JSONSafe<ListJournalResponse>[]>(
    "/api/journal?" +
      (taskId ? "&taskId=" + taskId : "&taskType=" + tab) +
      "&limit=100&page=" +
      page
  );

  return (
    <AppShell menuItem={dashboardMenu.journal}>
      <Card className="col-span-full gradient-header m-4 py-4">
        <CardHeader>
          <CardTitle className="text-xl">Journal</CardTitle>
          <CardDescription className="text-secondary-foreground">
            Show the history of execution for various tasks.
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid flex-1 items-start gap-4 p-4 pt-0">
        <Tabs value={tab} onValueChange={value => router.push(`/journal?tab=${value}`)}>
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              {TaskTypes.map(type => (
                <TabsTrigger key={type} value={type}>
                  {type}
                </TabsTrigger>
              ))}
              {taskId && <TabsTrigger value="task">Task</TabsTrigger>}
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
                <CardTitle>Journal</CardTitle>
                <CardDescription>Show history of execution for various tasks.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden w-[40px] sm:table-cell">
                        <span className="sr-only">Image</span>
                      </TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Type</TableHead>

                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className={cn(isValidating && "opacity-50")}>
                    {logs?.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="hidden sm:table-cell">
                          <FileWarning height="32" width="32" />
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link href={`?taskId=${log.taskId}`}>{log.type}</Link>
                        </TableCell>
                        <TableCell className="table-cell">
                          <OptionalLink
                            href={
                              log.appId
                                ? `/app/${log.appId}`
                                : log.hostId
                                  ? `/host/${log.hostId}`
                                  : undefined
                            }
                          >
                            {log.task?.type}
                          </OptionalLink>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{log.createdAt}</TableCell>
                        <TableCell className="line-clamp-1 max-w-md">{log.message}</TableCell>
                      </TableRow>
                    ))}

                    {logs && logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No journal entries found
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
                    {logs && logs?.length > 0 ? 1 : 0}-{logs?.length}
                  </strong>{" "}
                  of <strong>{logs?.length}+</strong> journal entries
                </div>
                <div className="flex items-center gap-2">
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
