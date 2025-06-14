import api from './api';

export interface Reminder {
  id: string;
  message: string;
  remind_at: string;
  user_id: string;
}

class ReminderService {
  private static instance: ReminderService;
  private baseUrl = '/reminders';

  private constructor() {}

  public static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  async getReminders(): Promise<Reminder[]> {
    const response = await api.get<Reminder[]>(this.baseUrl);
    return response.data;
  }

  async createReminder(reminder: Partial<Reminder>): Promise<Reminder> {
    const response = await api.post<Reminder>(this.baseUrl, reminder);
    return response.data;
  }

  async updateReminder(id: string, reminder: Partial<Reminder>): Promise<Reminder> {
    const response = await api.put<Reminder>(`${this.baseUrl}/${id}`, reminder);
    return response.data;
  }

  async deleteReminder(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }
}

export const reminderService = ReminderService.getInstance(); 