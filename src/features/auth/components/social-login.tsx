"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { useState } from "react";

export const SocialLogin = () => {
  const [isLoading, setIsLoading] = useState<"google" | "github" | null>(null);

  const onClick = (provider: "google" | "github") => {
    setIsLoading(provider);
    signIn(provider, {
      callbackUrl: "/dashboard",
    });
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <Button
        size="lg"
        variant="outline"
        className="w-full font-normal flex items-center justify-center gap-2"
        onClick={() => onClick("google")}
        disabled={isLoading !== null}
      >
        <FcGoogle className="h-5 w-5" />
        {isLoading === "google" ? "Redirecting..." : "Continue with Google"}
      </Button>
      
      <Button
        size="lg"
        variant="outline"
        className="w-full font-normal flex items-center justify-center gap-2"
        onClick={() => onClick("github")}
        disabled={isLoading !== null}
      >
        <FaGithub className="h-5 w-5" />
        {isLoading === "github" ? "Redirecting..." : "Continue with GitHub"}
      </Button>
    </div>
  );
};
