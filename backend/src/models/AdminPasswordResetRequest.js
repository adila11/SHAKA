import mongoose from 'mongoose';

const adminPasswordResetRequestSchema = new mongoose.Schema(
  {
    requestingAdminId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    requestingAdminUsername: {
      type: String,
      required: true,
      trim: true,
    },
    requestingAdminEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    approvingAdminId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    approvingAdminUsername: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'expired'],
      default: 'pending',
    },
    lookupTokenHash: {
      type: String,
      required: true,
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetExpiresAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

adminPasswordResetRequestSchema.index({ status: 1 });
adminPasswordResetRequestSchema.index({ requestingAdminUsername: 1 });
adminPasswordResetRequestSchema.index({ requestingAdminEmail: 1 });
adminPasswordResetRequestSchema.index({ expiresAt: 1 });

export const AdminPasswordResetRequest = mongoose.model(
  'AdminPasswordResetRequest',
  adminPasswordResetRequestSchema
);

