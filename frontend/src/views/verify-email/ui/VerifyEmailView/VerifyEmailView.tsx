import * as React from "react";
import { VerifyEmailContent } from "../VerifyEmailContent";

export const VerifyEmailView: React.FC = () => (
  <React.Suspense fallback={<p>Загрузка...</p>}>
    <VerifyEmailContent />
  </React.Suspense>
);
