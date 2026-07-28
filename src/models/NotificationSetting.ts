import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Singleton config for outbound notification emails, keyed by channel so more
 * alert types (NFO alerts, quiz submissions, …) can be added without a new
 * collection. Today only "lead" exists — the fund callback / request-a-callback
 * forms.
 */
export interface INotificationSetting extends Document {
  channel: string;
  enabled: boolean;
  recipients: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSettingSchema = new Schema<INotificationSetting>(
  {
    channel: { type: String, required: true, unique: true, trim: true },
    enabled: { type: Boolean, default: true },
    recipients: { type: [String], default: [] },
  },
  { timestamps: true },
);

const NotificationSetting: Model<INotificationSetting> =
  mongoose.models.NotificationSetting ||
  mongoose.model<INotificationSetting>("NotificationSetting", NotificationSettingSchema);

export const LEAD_CHANNEL = "lead";

export default NotificationSetting;
