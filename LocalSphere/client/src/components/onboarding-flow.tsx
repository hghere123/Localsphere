import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Shield, Clock, Locate, Heart, Handshake, Ban, User, UserMinus } from "lucide-react";
import { useGeolocation } from "@/hooks/use-geolocation";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<"welcome" | "location" | "guidelines">("welcome");
  const { requestLocation } = useGeolocation();

  const handleLocationRequest = async () => {
    try {
      await requestLocation();
      setCurrentStep("guidelines");
    } catch (error) {
      console.log("Location access denied:", error);
      setCurrentStep("guidelines");
    }
  };

  const handleSkipLocation = () => {
    setCurrentStep("guidelines");
  };

  if (currentStep === "welcome") {
    return (
      <div className="fixed inset-0 z-50 bg-background" data-testid="onboarding-welcome">
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <div className="max-w-sm w-full text-center space-y-6">
            <div className="mb-8">
              <div className="w-20 h-20 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <MapPin className="text-2xl text-primary-foreground" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-foreground">LocalChat</h1>
              <p className="text-muted-foreground mt-2">Connect with people nearby</p>
            </div>

            <div className="space-y-4 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                  <Shield className="text-xs text-accent-foreground" size={12} />
                </div>
                <div>
                  <h3 className="font-semibold">Anonymous & Safe</h3>
                  <p className="text-sm text-muted-foreground">No registration needed. Chat anonymously with temporary usernames.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                  <Locate className="text-xs text-accent-foreground" size={12} />
                </div>
                <div>
                  <h3 className="font-semibold">Location Privacy</h3>
                  <p className="text-sm text-muted-foreground">We only use your general area, never your exact location.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                  <Clock className="text-xs text-accent-foreground" size={12} />
                </div>
                <div>
                  <h3 className="font-semibold">24-Hour Messages</h3>
                  <p className="text-sm text-muted-foreground">Messages automatically delete after 24 hours for privacy.</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setCurrentStep("location")} 
              className="w-full"
              data-testid="button-get-started"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === "location") {
    return (
      <div className="fixed inset-0 z-50 bg-background" data-testid="onboarding-location">
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <div className="max-w-sm w-full text-center space-y-6">
            <div className="mb-8">
              <div className="w-20 h-20 bg-accent rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Locate className="text-2xl text-accent-foreground" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Enable Location</h2>
              <p className="text-muted-foreground mt-2">Find people chatting nearby</p>
            </div>

            <Card>
              <CardContent className="pt-6 text-left">
                <h3 className="font-semibold mb-2">Your Privacy Matters</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• We only see your neighborhood, not exact address</li>
                  <li>• Location data is encrypted and never stored</li>
                  <li>• You can change your radius anytime</li>
                  <li>• Other users only see general area</li>
                </ul>
              </CardContent>
            </Card>

            <Button 
              onClick={handleLocationRequest} 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              data-testid="button-allow-location"
            >
              Allow Location Access
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleSkipLocation}
              className="w-full"
              data-testid="button-skip-location"
            >
              Skip for now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background" data-testid="onboarding-guidelines">
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full space-y-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-secondary rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Heart className="text-xl text-secondary-foreground" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Community Guidelines</h2>
            <p className="text-muted-foreground mt-2">Let's keep it friendly and safe</p>
          </div>

          <div className="space-y-3">
            <Card>
              <CardContent className="p-3 flex items-center space-x-3">
                <Handshake className="text-primary" size={20} />
                <span className="text-sm">Be respectful and kind to others</span>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 flex items-center space-x-3">
                <Ban className="text-destructive" size={20} />
                <span className="text-sm">No harassment, spam, or inappropriate content</span>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 flex items-center space-x-3">
                <Shield className="text-accent" size={20} />
                <span className="text-sm">Report suspicious behavior immediately</span>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 flex items-center space-x-3">
                <UserMinus className="text-muted-foreground" size={20} />
                <span className="text-sm">Don't share personal information</span>
              </CardContent>
            </Card>
          </div>

          <Button 
            onClick={onComplete} 
            className="w-full"
            data-testid="button-start-chatting"
          >
            I Understand - Start Chatting
          </Button>
        </div>
      </div>
    </div>
  );
}
