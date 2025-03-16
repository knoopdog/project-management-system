import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Play, Pause, Clock, Save } from "lucide-react";
import { timeEntryApi } from "@/lib/api";
import { TimeEntry } from "@/types/schema";
import { useAuth } from "../../../supabase/auth";

interface TimeTrackerProps {
  taskId: string;
  hourlyRate?: number;
  onTimeEntryAdded?: () => void;
}

export default function TimeTracker({
  taskId,
  hourlyRate = 0,
  onTimeEntryAdded,
}: TimeTrackerProps) {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [notes, setNotes] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateCost = (seconds: number) => {
    if (!hourlyRate) return 0;
    const hours = seconds / 3600;
    return hours * hourlyRate;
  };

  const startTimer = () => {
    if (isRunning) return;

    setIsRunning(true);
    startTimeRef.current = Date.now() - elapsedTime * 1000;

    timerRef.current = window.setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
      }
    }, 1000);
  };

  const pauseTimer = () => {
    if (!isRunning) return;

    setIsRunning(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetTimer = () => {
    pauseTimer();
    setElapsedTime(0);
    startTimeRef.current = null;
  };

  const saveTimeEntry = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to track time.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      if (elapsedTime === 0 && !manualTime) {
        toast({
          title: "Error",
          description: "Please track some time or enter a manual time.",
          variant: "destructive",
        });
        return;
      }

      let duration = elapsedTime;

      // If manual time is provided, parse it
      if (manualTime) {
        const [hours, minutes] = manualTime.split(":").map(Number);
        duration = hours * 3600 + minutes * 60;
      }

      await timeEntryApi.create({
        task_id: taskId,
        user_id: user.id,
        duration,
        notes: notes.trim() || undefined,
      });

      toast({
        title: "Time entry saved",
        description: `${formatTime(duration)} has been recorded for this task.`,
      });

      // Reset form
      resetTimer();
      setNotes("");
      setManualTime("");

      if (onTimeEntryAdded) {
        onTimeEntryAdded();
      }
    } catch (error) {
      console.error("Error saving time entry:", error);
      toast({
        title: "Error",
        description:
          "There was an error saving the time entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow the format HH:MM
    if (/^\d{0,2}(:\d{0,2})?$/.test(value)) {
      setManualTime(value);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2">
          <div className="text-3xl font-mono text-center py-4 bg-gray-50 rounded-md">
            {formatTime(elapsedTime)}
          </div>

          <div className="flex space-x-2">
            {!isRunning ? (
              <Button
                onClick={startTimer}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Play className="mr-2 h-4 w-4" />
                Start
              </Button>
            ) : (
              <Button
                onClick={pauseTimer}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium mb-2">Manual Time Entry</h3>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="HH:MM"
              value={manualTime}
              onChange={handleManualTimeChange}
              className="font-mono"
            />
            <span className="text-sm text-gray-500">Hours:Minutes</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Notes</h3>
          <Textarea
            placeholder="Add notes about this time entry"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {hourlyRate > 0 && (
          <div className="pt-2">
            <p className="text-sm text-gray-500">
              Estimated cost: ${calculateCost(elapsedTime).toFixed(2)}
            </p>
          </div>
        )}

        <Button onClick={saveTimeEntry} className="w-full" disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Time Entry"}
        </Button>
      </CardContent>
    </Card>
  );
}
