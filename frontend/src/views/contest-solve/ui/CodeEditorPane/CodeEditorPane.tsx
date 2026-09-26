"use client";

import type { ContestSubmission } from "@/shared/api";
import type { BottomTab } from "../../model/types";
import { EditorToolbar } from "../EditorToolbar";
import { EditorTextarea } from "../EditorTextarea";
import { EditorBottomTabs } from "../EditorBottomTabs";
import { TestResultTab } from "../TestResultTab";
import { SubmissionsHistoryTab } from "../SubmissionsHistoryTab";
import styles from "./CodeEditorPane.module.css";

interface Props {
  code: string;
  onChangeCode: (code: string) => void;
  onResetCode: () => void;
  onSubmit: () => void;
  submitting: boolean;
  lastSubmission?: ContestSubmission;
  submissions: ContestSubmission[];
  activeTab: BottomTab;
  onTabChange: (tab: BottomTab) => void;
  maxPoints?: number;
}

export function CodeEditorPane({
  code,
  onChangeCode,
  onResetCode,
  onSubmit,
  submitting,
  lastSubmission,
  submissions,
  activeTab,
  onTabChange,
  maxPoints,
}: Props) {
  return (
    <div className={styles.pane}>
      <div className={styles.editorArea}>
        <EditorToolbar onReset={onResetCode} onSubmit={onSubmit} submitting={submitting} />
        <EditorTextarea code={code} onChange={onChangeCode} />
      </div>
      <div className={styles.bottomArea}>
        <EditorBottomTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          submissionCount={submissions.length}
        />
        {activeTab === "result" ? (
          <TestResultTab submission={lastSubmission} maxPoints={maxPoints} />
        ) : (
          <SubmissionsHistoryTab submissions={submissions} onLoadCode={onChangeCode} />
        )}
      </div>
    </div>
  );
}
