import { ErrorMessage } from "@/components/ErrorMessage";

const Page = () => {
  return (
    <div>
      <ErrorMessage
        title="Check your email"
        error="Please check your email for a verification link"
        redirect="/auth/signIn"
        buttonText="Sign in"
      />
    </div>
  );
};

export default Page;
