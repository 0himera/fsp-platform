export interface DocumentItem {
  id: number;
  competition_id?: number | null;
  title: string;
  url: string;
  file_size: number;
  created_at: string;
}
