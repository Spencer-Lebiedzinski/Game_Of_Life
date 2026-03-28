"use client";

import { useRouter } from "next/navigation";
import OnboardingForm from "@/components/OnboardingForm";

// TODO: replace with real user_id from Auth0 session
const TEMP_USER_ID = "test-user-001";

export default function OnboardingPage() {
  const router = useRouter();

  function handleComplete() {
    router.push("/dashboard");
  }

  return <OnboardingForm userId={TEMP_USER_ID} onComplete={handleComplete} />;
}
