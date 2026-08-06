"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SocialLogin } from "./social-login";
import { ReactNode, Suspense } from "react";

interface AuthCardProps {
  title: string;
  description: string;
  footer?: ReactNode;
}

export const AuthCard = ({ title, description, footer }: AuthCardProps) => {
  return (
    <Card className="w-full max-w-md shadow-lg border-muted">
      <CardHeader className="space-y-1 items-center text-center">
        <div className="w-12 h-12 bg-primary rounded-xl mb-4 flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-xl">DS</span>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div className="h-[104px] w-full animate-pulse bg-zinc-800 rounded-lg"></div>}>
          <SocialLogin />
        </Suspense>
      </CardContent>
      {footer && (
        <CardFooter className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};
