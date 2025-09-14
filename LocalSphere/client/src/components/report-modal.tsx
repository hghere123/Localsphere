import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, MessageSquareX, UserX, Shield, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const { toast } = useToast();

  if (!isOpen) return null;

  const reportReasons = [
    {
      id: "spam",
      icon: MessageSquareX,
      title: "Spam or inappropriate content",
      description: "Unwanted or offensive messages"
    },
    {
      id: "harassment",
      icon: UserX,
      title: "Harassment or bullying",
      description: "Targeted abuse or threatening behavior"
    },
    {
      id: "safety",
      icon: Shield,
      title: "Safety concerns",
      description: "Content that might harm others"
    },
    {
      id: "other",
      icon: Ban,
      title: "Other violation",
      description: "Community guideline violations"
    }
  ];

  const handleSubmitReport = async () => {
    if (!selectedReason) return;

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: selectedReason,
          reporterId: "anonymous",
          messageId: null,
          userId: null
        })
      });

      if (response.ok) {
        toast({
          title: "Report submitted",
          description: "Thank you for your report. Our team will review it promptly.",
        });
        onClose();
        setSelectedReason(null);
      } else {
        throw new Error("Failed to submit report");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" data-testid="report-modal">
      <Card className="max-w-sm w-full">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-destructive rounded-full mx-auto mb-3 flex items-center justify-center">
              <AlertTriangle className="text-destructive-foreground" size={24} />
            </div>
            <h2 className="text-lg font-semibold">Report Content</h2>
            <p className="text-sm text-muted-foreground mt-1">Help us keep the community safe</p>
          </div>

          <div className="space-y-3 mb-6">
            {reportReasons.map((reason) => {
              const IconComponent = reason.icon;
              return (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`w-full text-left p-3 border rounded-lg text-sm transition-colors ${
                    selectedReason === reason.id
                      ? "border-destructive bg-destructive/10"
                      : "border-border hover:bg-muted"
                  }`}
                  data-testid={`button-report-reason-${reason.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className="text-destructive flex-shrink-0" size={16} />
                    <div>
                      <div className="font-medium">{reason.title}</div>
                      <div className="text-muted-foreground text-xs mt-1">{reason.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel-report"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmitReport}
              disabled={!selectedReason}
              className="flex-1"
              data-testid="button-submit-report"
            >
              Submit Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
