import mongoose, { Schema, Document } from "mongoose";

export interface AuditLogDoc extends Document {
  user: mongoose.Types.ObjectId;
  action: string;
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  meta?: any;
  createdAt: Date;
}

const AuditLogSchema = new Schema<AuditLogDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<AuditLogDoc>("AuditLog", AuditLogSchema);
