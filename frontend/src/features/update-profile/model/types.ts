export interface UpdateProfileInput {
  full_name: string;
  organization: string;
  city: string;
  disciplines: string[];
  codeforces_handle?: string;
}
