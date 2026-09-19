/**
 * API Request and Response TypeScript Interfaces for the Internet Archaeologist Platform.
 */

import { Investigation } from './osint';

// Standard API Response envelope
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  timestamp: string;
}

// Investigate Endpoint Types (/api/investigate)
export interface InvestigateRequestBody {
  domain: string;
  options?: {
    includeVisuals?: boolean;
    includeSubdomains?: boolean;
    depth?: 'quick' | 'full' | 'deep';
  };
}

export type InvestigateApiResponse = Investigation | { error: string; statusCode?: number };

// Codebase Analytics Endpoint Types (/api/analytics)
export interface LanguageStat {
  language: string;
  extension: string;
  lines: number;
  percentage: number;
  color: string;
  isExecutable: boolean;
}

export interface ProjectLocStat {
  name: string;
  displayName: string;
  loc: number;
  locDisplay: string;
  files: number;
  color: string;
  description: string;
}

export interface TreemapNode {
  name: string;
  value?: number;
  children?: TreemapNode[];
  color?: string;
  category?: string;
}

export interface RuntimeBreakdown {
  executablePercent: number;
  documentationPercent: number;
  configPercent: number;
  executableLoc: number;
  documentationLoc: number;
  configLoc: number;
  totalLoc: number;
}

export interface GitCommitLocEntry {
  hash: string;
  date: string;
  message: string;
  insertions: number;
  deletions: number;
  netAdded: number;
  cumulativeLoc: number;
}

export interface LanguageMixTimelineEntry {
  milestone: string;
  date: string;
  markdown: number;
  tsx: number;
  json: number;
  js: number;
  html: number;
  ts: number;
  css: number;
  python: number;
  other: number;
}

export interface CodebaseAnalyticsData {
  languages: LanguageStat[];
  projects: ProjectLocStat[];
  treemapData: TreemapNode;
  runtimeBreakdown: RuntimeBreakdown;
  gitHistory: GitCommitLocEntry[];
  languageMixTimeline: LanguageMixTimelineEntry[];
  fileCountByExtension: Array<{ extension: string; count: number; color: string }>;
  summary: {
    totalLoc: number;
    totalFiles: number;
    primaryLanguage: string;
    executablePercent: number;
    documentationPercent: number;
    configPercent: number;
  };
}

export type AnalyticsApiResponse = ApiResponse<CodebaseAnalyticsData> | { error: string };
