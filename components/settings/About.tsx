import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useSWR from "swr";
import { formatMarkdown } from "@/components/formatMarkdown";

export const About = () => {
  const { data: buildInfo } = useSWR<{
    git: string;
    changes: string;
  }>("/api/build", null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
        <CardDescription>
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <span className="font-semibold">Version:</span> {buildInfo?.git}
            </div>
            <div className="prose dark:prose-invert">{formatMarkdown(buildInfo?.changes)}</div>
          </div>
        </CardDescription>
      </CardHeader>
    </Card>
  );
};
