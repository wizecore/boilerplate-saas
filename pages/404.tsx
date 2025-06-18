import { ErrorMessage } from "@/components/ErrorMessage";

const Page = () => {
  return (
    <div>
      <ErrorMessage error="404 Can't find that page" redirect="/" status={404} />
    </div>
  );
};

export default Page;
