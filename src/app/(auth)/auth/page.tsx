import { AuthCard } from "@/features/auth/components/auth-card";

export default function AuthPage() {
  return (
    <AuthCard 
      title="Welcome to DevSync AI" 
      description="Sign in or create an account to continue."
      footer={
        <p>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      }
    />
  );
}
