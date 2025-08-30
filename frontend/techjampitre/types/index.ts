export interface Law {
  id: string;
  country: string;
  region: string;
  law: string;
  lawDesc: string;
  relevantLabels: string[];
  source: string;
  createdAt: string;
}

export interface Feature {
  id: string;
  featureName: string;
  featureType: string;
  featureDescription: string;
  relevantLabels: string[];
  source: string;
  createdAt: string;
}

export interface UploadResponse {
  type: "feature" | "law";
  conflicts: (Law | Feature)[];
  message?: string;
}

export interface ApiError {
  error: string;
  details?: string;
}
