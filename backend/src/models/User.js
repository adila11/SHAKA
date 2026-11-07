import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
    },
    refreshTokenHash: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    deviceInfo: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: 'profile1',
    },
    profileImage: {
      type: String,
      enum: ['profile1', 'profile2'],
      default: 'profile1',
    },
    password: {
      type: String,
      required: true,
    },
    accessCodeEnabled: {
      type: Boolean,
      default: false,
    },
    accessCodeHash: {
      type: String,
      default: null,
    },
    failedAccessCodeAttempts: {
      type: Number,
      default: 0,
    },
    accessCodeLockoutUntil: {
      type: Date,
      default: null,
    },
    sessions: [sessionSchema],
  },
  {
    timestamps: true,
  }
);

userSchema.index({ 'sessions.sessionId': 1 });

export const User = mongoose.model('User', userSchema);
