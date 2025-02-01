"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getTestSuite } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  StopIcon,
  PauseIcon,
  PlayIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

type RecordingStatus = "ready" | "recording" | "paused" | "completed";

export default function RecordTestCasePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);
  const suiteId = Number(params.suiteId);

  const [status, setStatus] = useState<RecordingStatus>("ready");
  const [recordingTime, setRecordingTime] = useState(0);
  const [steps, setSteps] = useState<any[]>([]);

  const { data: suite, isLoading } = useQuery({
    queryKey: ["test-suite", suiteId],
    queryFn: () => getTestSuite(projectId, suiteId),
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status === "recording") {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="animate-pulse">
          <div className="h-8 w-1/3 bg-gray-200 rounded mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!suite) {
    return (
      <div className="container py-10">
        <p className="text-red-500">テストスイートが見つかりませんでした。</p>
      </div>
    );
  }

  const handleStartRecording = () => {
    setStatus("recording");
    // TODO: 記録開始の処理を実装
  };

  const handlePauseRecording = () => {
    setStatus("paused");
    // TODO: 記録一時停止の処理を実装
  };

  const handleResumeRecording = () => {
    setStatus("recording");
    // TODO: 記録再開の処理を実装
  };

  const handleStopRecording = () => {
    setStatus("completed");
    // TODO: 記録停止の処理を実装
  };

  const handleSave = () => {
    // TODO: 記録したテストケースの保存処理を実装
    router.push(`/projects/${projectId}/test-suites/${suiteId}`);
  };

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">テストケースの記録</h1>
          <p className="text-gray-600 mt-2">{suite.name}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-lg font-mono">{formatTime(recordingTime)}</div>
          {status === "ready" && (
            <Button onClick={handleStartRecording}>
              <PlayIcon className="h-4 w-4 mr-2" />
              記録開始
            </Button>
          )}
          {status === "recording" && (
            <>
              <Button variant="outline" onClick={handlePauseRecording}>
                <PauseIcon className="h-4 w-4 mr-2" />
                一時停止
              </Button>
              <Button variant="destructive" onClick={handleStopRecording}>
                <StopIcon className="h-4 w-4 mr-2" />
                記録終了
              </Button>
            </>
          )}
          {status === "paused" && (
            <>
              <Button onClick={handleResumeRecording}>
                <PlayIcon className="h-4 w-4 mr-2" />
                再開
              </Button>
              <Button variant="destructive" onClick={handleStopRecording}>
                <StopIcon className="h-4 w-4 mr-2" />
                記録終了
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>記録情報</CardTitle>
            <CardDescription>
              記録するテストケースの基本情報を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">テストケース名</Label>
                <Input
                  id="name"
                  placeholder="テストケース名を入力"
                  disabled={status === "recording"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  placeholder="テストケースの説明を入力"
                  disabled={status === "recording"}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>記録されたステップ</CardTitle>
                <CardDescription>
                  記録中のブラウザ操作がここに表示されます
                </CardDescription>
              </div>
              {steps.length > 0 && (
                <Button variant="outline" size="sm">
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  やり直し
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {steps.length > 0 ? (
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium">{step.action}</h3>
                      <p className="text-sm text-gray-600">{step.target}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(step.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                まだステップが記録されていません。記録を開始してブラウザを操作してください。
              </p>
            )}
          </CardContent>
        </Card>

        {status === "completed" && (
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => setStatus("ready")}>
              やり直し
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        )}
      </div>
    </div>
  );
}
