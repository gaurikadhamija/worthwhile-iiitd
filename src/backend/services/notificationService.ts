import { db } from '../db/connection.js';
import { Notification } from '../types/index.js';

export class NotificationService {
  static getNotifications(userId: string): Notification[] {
    const rows = db.prepare(`
      SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId) as any[];

    return rows.map(r => ({
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      message: r.message,
      type: r.type,
      event_id: r.event_id,
      read: Boolean(r.read),
      created_at: r.created_at
    }));
  }

  static markAsRead(notificationId: string, userId: string): boolean {
    const res = db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(notificationId, userId);
    return res.changes > 0;
  }

  static markAllAsRead(userId: string): boolean {
    const res = db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(userId);
    return res.changes > 0;
  }
}
