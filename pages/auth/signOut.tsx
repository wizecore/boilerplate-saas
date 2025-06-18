import { useEffect } from "react";
import { signOut } from "next-auth/react";

const SignOut: React.FC = () => {
  useEffect(() => {
    signOut({ redirect: true, callbackUrl: "/" });
  }, []);

  return null;
};

export default SignOut;
