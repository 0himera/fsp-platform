import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/shared/ui";
import { usePublishResultsMutation } from "@/features/publish-results";
import type { Registration } from "@/shared/api";

interface PublishProtocolCardProps {
  competitionId: number;
  registrations: Registration[];
}

export const PublishProtocolCard: React.FC<PublishProtocolCardProps> = ({
  competitionId,
  registrations,
}) => {
  const publishMutation = usePublishResultsMutation();

  const handleAutoPublish = () => {
    const mockResults = registrations.map((r, i) => ({
      athlete_id: r.athlete_id,
      place: i + 1,
      score_text: `${100 - i * 5} pts`,
    }));
    publishMutation.mutate({ competitionId, results: mockResults });
  };

  return (
    <Card>
      <CardHeader><CardTitle>Публикация протокола</CardTitle></CardHeader>
      <CardContent>
        <Button onClick={handleAutoPublish} disabled={publishMutation.isPending || registrations.length === 0}>
          {publishMutation.isPending ? "Публикация..." : "Опубликовать результаты по текущему списку"}
        </Button>
      </CardContent>
    </Card>
  );
};
