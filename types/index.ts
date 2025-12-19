import { LucideIcon } from "lucide-react";
import { z } from "zod";

// Note: Temporarily defining types manually due to Prisma client generation issues
// These should be imported from @prisma/client once the client is properly generated

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonValue = any;

type PrismaTask = {
  id: string;
  type: string;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
  args: JsonValue;
  executing: boolean | null;
  executionStartedAt: Date | null;
  executedAt: Date | null;
  result: JsonValue;
  userId: string | null;
  tenantId: string | null;
  nextTaskId: string | null;
  interval: number | null;
  nextExecuteAt: Date | null;
};

type PrismaJournal = {
  id: string;
  hostId: string | null;
  appId: string | null;
  level: string | null;
  message: string | null;
  details: JsonValue;
  createdAt: Date;
  userId: string | null;
  tenantId: string | null;
  taskId: string | null;
};

type PrismaTenant = {
  id: string;
  name: string;
  status: string;
  planId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaUser = {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  tenantId: string | null;
  flags: JsonValue;
  attributes: JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

declare module "next" {
  interface NextApiRequest {
    url: string;
    method:
      | "GET"
      | "POST"
      | "PUT"
      | "DELETE"
      | "PATCH"
      | "OPTIONS"
      | "HEAD"
      | "CONNECT"
      | "TRACE";
  }
}

export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
  icon: LucideIcon;
};

export type User = PrismaUser;

/** Additional attributes on the user as JSON. */
export interface UserAttributes {
  // Standard UTM parameters
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  // Comes from ?ref=
  referrer?: string;
  // Google Ads params
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  // Facebook Ads params
  fbclid?: string;
  // IP address of the user
  ipAddress?: string;
  // Last-click attribution timestamp
  attributedAt?: Date;
}

/**
 * Marketing attributes to be used for tracking user source when logging in or subscribing.
 * When one of them is updated, the `attributedAt` timestamp is set to the current date.
 */
export const UserAttributionKeys = [
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmContent",
  "utmTerm",
  "referrer",
  "gclid",
  "fbclid",
  "gbraid",
  "wbraid"
] as const;

type NonEmptyArray<T> = [T, ...T[]];

export type TaskStatus = "queued" | "active" | "completed" | "error";
export const TaskStatuses: NonEmptyArray<TaskStatus> = [
  "queued",
  "active",
  "completed",
  "error"
];
export const TaskStatusCheck = z.enum(TaskStatuses);
export type TaskType =
  | "tick"
  | "period:minute"
  | "period:hour"
  | "period:day"
  | "period:week"
  | "period:month";

export const TaskTypes: NonEmptyArray<TaskType> = [
  "period:minute",
  "period:hour",
  "period:day",
  "period:week",
  "period:month",
  "tick"
];

export const TaskTypeCheck = z.enum(TaskTypes);

export type Task = PrismaTask & {
  type: TaskType;
  status?: TaskStatus | null;
  args?: TaskArgsType | null;
};

export type Journal = PrismaJournal;
export type Tenant = PrismaTenant;

/**
 * We have to define all as optional since the
 * same schema is used for partial updates as well.
 */
export const TaskArgsSchema = z.object({
  templateId: z.string().optional()
});

export type TaskArgsType = z.output<typeof TaskArgsSchema>;

export type JSONSafe<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Date | undefined
      ? string | undefined
      : T[K] extends Date | null
        ? string | null
        : T[K];
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    type PrismaTaskType = TaskType;
    type PrismaTaskStatus = TaskStatus;
    type PrismaTaskArgs = TaskArgsType;
    type PrismaAppEnv = Record<string, string>;
    type PrismaServiceEnv = Record<string, string>;
    type PrismaUserAttributes = UserAttributes;
  }
}
