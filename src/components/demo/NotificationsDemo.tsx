
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  showSuccess, 
  showError, 
  showWarning, 
  showInfo, 
  showConfirmation,
  successToast,
  errorToast,
  warningToast,
  infoToast
} from '@/utils/notifications';

export function NotificationsDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SweetAlert2 Notifications</CardTitle>
        <CardDescription>
          Examples of different notification types using SweetAlert2
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-medium">Alerts</h3>
            <Button 
              variant="outline" 
              onClick={() => showSuccess("Operation completed successfully", "Success!")}
            >
              Success Alert
            </Button>
            <Button 
              variant="outline" 
              onClick={() => showError("Something went wrong", "Error")}
            >
              Error Alert
            </Button>
            <Button 
              variant="outline" 
              onClick={() => showWarning("This action cannot be undone", "Warning")}
            >
              Warning Alert
            </Button>
            <Button 
              variant="outline" 
              onClick={() => showInfo("This is useful information", "Info")}
            >
              Info Alert
            </Button>
          </div>
          
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-medium">Toasts</h3>
            <Button 
              variant="outline" 
              onClick={() => successToast("Operation successful")}
            >
              Success Toast
            </Button>
            <Button 
              variant="outline" 
              onClick={() => errorToast("Something went wrong")}
            >
              Error Toast
            </Button>
            <Button 
              variant="outline" 
              onClick={() => warningToast("Warning message")}
            >
              Warning Toast
            </Button>
            <Button 
              variant="outline" 
              onClick={() => infoToast("Information message")}
            >
              Info Toast
            </Button>
          </div>
          
          <div className="flex flex-col gap-2 md:col-span-2">
            <h3 className="text-lg font-medium">Advanced</h3>
            <Button 
              variant="default" 
              onClick={() => showConfirmation({
                title: "Are you sure?",
                text: "You won't be able to revert this!",
                confirmButtonText: "Yes, delete it!",
                onConfirm: () => successToast("Deleted successfully")
              })}
            >
              Confirmation Dialog
            </Button>
            <Button 
              variant="default" 
              onClick={() => showNotificationWithTimer()}
            >
              Auto-close Alert
            </Button>
            <Button 
              variant="default" 
              onClick={() => showPositionedNotification()}
            >
              Custom Position
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  function showNotificationWithTimer() {
    showSuccess("This alert will close in 2 seconds", "Auto-closing", { timer: 2000, timerProgressBar: true });
  }

  function showPositionedNotification() {
    showInfo("This appears at the bottom", "Custom Position", { position: "bottom" });
  }
}
