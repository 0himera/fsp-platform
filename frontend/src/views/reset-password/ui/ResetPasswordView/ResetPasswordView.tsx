import * as React from "react";
import { ResetPasswordContent } from "../ResetPasswordContent";

export const ResetPasswordView: React.FC = () => (
  <React.Suspense fallback={<p>Загрузка...</p>}>
    <ResetPasswordContent />
  </React.Suspense>
);
