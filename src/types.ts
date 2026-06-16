export interface TimelineStage {
  stage: string;
  description: string;
}

export interface HobbyQuestion {
  title: string;
  question: string;
  options: string[];
  responses: Record<string, string>;
}

export interface PhotoAsset {
  id: string;
  url: string; // base64 or CDN / uploads URL
  caption: string;
  createdAt: string;
}

export interface AppConfig {
  landingPage: {
    heading: string;
    subHeading: string;
    button: string;
    animation: string;
  };
  hobbiesSection: HobbyQuestion;
  journeyTimeline: TimelineStage[];
  specialSection: {
    title: string;
    cards: string[];
  };
  proposalSection: {
    background: string;
    message: string;
    buttons: {
      yes: string;
      thinkAgain: string;
    };
    successMessage: string;
  };
  backgroundMusicUrl: string;
}

export interface UserResponse {
  id: string;
  timestamp: string;
  sessionId: string;
  hobbies: string[];
  proposalStatus: 'yes' | 'think_again' | 'none';
  customNote?: string;
  stagesVisited: string[];
}

export interface AnalyticsData {
  pageViews: number;
  totalInteractions: number;
  yesCount: number;
  thinkAgainCount: number;
  hobbiesBreakdown: Record<string, number>;
  visitsTimeline: { date: string; count: number }[];
}

export interface ServerState {
  config: AppConfig;
  responses: UserResponse[];
  photos: PhotoAsset[];
  analytics: {
    pageViews: number;
    sessions: Record<string, string[]>; // sessionId -> created timestamp
  };
}
