import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, default: '' },
    role: { type: String, default: 'Member' },
    entriesCount: { type: Number, default: 0 },
    initials: { type: String, default: '' },
    avatarGradient: { type: String, default: 'from-[#c9b27c] to-[#967f4c]' },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
