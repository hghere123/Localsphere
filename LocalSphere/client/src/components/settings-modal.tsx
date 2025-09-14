import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { X, Shield, HelpCircle, LogOut } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  currentRadius: number;
  onRadiusChange: (radius: number) => void;
}

export function SettingsModal({ isOpen, onClose, currentUsername, currentRadius, onRadiusChange }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" data-testid="settings-modal">
      <Card className="w-full rounded-t-xl border-t border-border">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Settings</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg"
              data-testid="button-close-settings"
            >
              <X className="text-muted-foreground" size={16} />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Dark Mode</h3>
                <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={handleThemeToggle}
                data-testid="switch-dark-mode"
              />
            </div>

            {/* Username */}
            <div>
              <h3 className="font-medium mb-2">Your Username</h3>
              <div className="flex items-center space-x-2">
                <Input
                  value={currentUsername}
                  className="flex-1"
                  readOnly
                  data-testid="input-username"
                />
                <Button variant="secondary" size="sm" disabled>
                  Change
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Your temporary anonymous username</p>
            </div>

            {/* Proximity Settings */}
            <div>
              <h3 className="font-medium mb-2">Chat Radius</h3>
              <div className="grid grid-cols-4 gap-2">
                {[0.5, 1, 2, 5].map(radius => (
                  <Button
                    key={radius}
                    variant={currentRadius === radius ? "default" : "outline"}
                    size="sm"
                    onClick={() => onRadiusChange(radius)}
                    className="text-sm"
                    data-testid={`button-settings-radius-${radius}`}
                  >
                    {radius}mi
                  </Button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Notifications</h3>
                <p className="text-sm text-muted-foreground">Get notified of new messages</p>
              </div>
              <Switch
                defaultChecked={true}
                data-testid="switch-notifications"
              />
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start p-3 hover:bg-muted rounded-lg"
              data-testid="button-privacy-safety"
            >
              <Shield className="text-accent mr-3" size={16} />
              Privacy & Safety
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-3 hover:bg-muted rounded-lg"
              data-testid="button-help-support"
            >
              <HelpCircle className="text-accent mr-3" size={16} />
              Help & Support
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start p-3 hover:bg-muted rounded-lg text-destructive hover:text-destructive"
              data-testid="button-leave-area"
            >
              <LogOut className="mr-3" size={16} />
              Leave This Area
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
