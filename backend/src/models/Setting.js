import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    monthlyLimit: { type: Number, default: 30000 },
    availableCategories: [
      {
        name: { type: String, required: true },
        icon: { type: String, default: 'Tag' },
        color: { type: String, default: '#c9b27c' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Setting = mongoose.model('Setting', settingSchema);
