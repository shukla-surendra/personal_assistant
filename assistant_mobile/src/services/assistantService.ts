import api from './api';

export interface AssistantCommand {
  command: string;
}

export interface AssistantResponse {
  message: string;
  data: any;
  requires_clarification?: boolean;
  questions?: string[];
}

export interface UserSettings {
  assistant_settings: {
    name: string;
    voice_enabled: boolean;
    voice_gender: string;
    language: string;
    timezone: string;
    notification_preferences: {
      email: boolean;
      push: boolean;
      desktop: boolean;
    };
  };
  theme_settings: {
    mode: string;
    primary_color: string;
    font_size: string;
  };
  privacy_settings: {
    data_collection: boolean;
    analytics: boolean;
    history_retention_days: number;
  };
  workspace_settings: {
    default_view: string;
    sort_by: string;
    group_by: string;
  };
}

class AssistantService {
  private static instance: AssistantService;
  private baseUrl = '/assistant';

  private constructor() {}

  public static getInstance(): AssistantService {
    if (!AssistantService.instance) {
      AssistantService.instance = new AssistantService();
    }
    return AssistantService.instance;
  }

  async processCommand(command: string): Promise<AssistantResponse> {
    try {
      const response = await api.post<AssistantResponse>(`${this.baseUrl}/command`, {
        command,
      });
      return response.data;
    } catch (error) {
      console.error('Error processing command:', error);
      throw error;
    }
  }

  async getSettings(): Promise<UserSettings> {
    try {
      const response = await api.get<UserSettings>('/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  }

  async updateAssistantSettings(settings: Partial<UserSettings['assistant_settings']>): Promise<UserSettings> {
    try {
      const response = await api.put<UserSettings>('/settings/assistant', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating assistant settings:', error);
      throw error;
    }
  }

  async updateThemeSettings(settings: Partial<UserSettings['theme_settings']>): Promise<UserSettings> {
    try {
      const response = await api.put<UserSettings>('/settings/theme', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating theme settings:', error);
      throw error;
    }
  }

  async updatePrivacySettings(settings: Partial<UserSettings['privacy_settings']>): Promise<UserSettings> {
    try {
      const response = await api.put<UserSettings>('/settings/privacy', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  }

  async updateWorkspaceSettings(settings: Partial<UserSettings['workspace_settings']>): Promise<UserSettings> {
    try {
      const response = await api.put<UserSettings>('/settings/workspace', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating workspace settings:', error);
      throw error;
    }
  }
}

export const assistantService = AssistantService.getInstance(); 