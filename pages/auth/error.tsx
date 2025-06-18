import { ErrorMessage } from "@/components/ErrorMessage";
import { useRouter } from "next/router";

const Page = () => {
  const router = useRouter();
  return (
    <div>
      <ErrorMessage error={"Error " + router.query.error} redirect="/" />
    </div>
  );
};

export default Page;
