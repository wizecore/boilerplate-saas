import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PopperContentProps } from "@radix-ui/react-popper";

export const OptionalTooltip = ({
  children,
  tooltip,
  show,
  side
}: {
  children: React.ReactNode;
  tooltip: React.ReactNode;
  show?: boolean;
  side?: PopperContentProps["side"];
}) => {
  return show === true || (show === undefined && tooltip !== undefined) ? (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side ?? "right"}>{tooltip}</TooltipContent>
    </Tooltip>
  ) : (
    <>{children}</>
  );
};
