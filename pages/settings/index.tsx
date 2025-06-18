"use client";

import { useRouter } from "next/router";

const Page = () => {
  const router = useRouter();

  if (router.isReady) {
    router.replace("/settings/general");
  }

  return null;
};

export default Page;
