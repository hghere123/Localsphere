import { useState, useEffect } from "react";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { ChatInterface } from "@/components/chat-interface";

export default function Home() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const onboardingStatus = localStorage.getItem("localchat_onboarded");
    setHasCompletedOnboarding(onboardingStatus === "true");
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("localchat_onboarded", "true");
    setHasCompletedOnboarding(true);
  };

  if (!hasCompletedOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return <ChatInterface />;
}
