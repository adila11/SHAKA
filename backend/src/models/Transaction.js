import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    fullDate: { type: String, required: true },
    time: { type: String, default: 'Just now' },
    category: { type: String, required: true },
    categoryColor: { type: String, default: '#c9b27c' },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    user: { type: String, required: true, default: 'Alex' },
    userRole: { type: String, default: 'Member' },
    isSplit: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const Transaction = mongoose.model('Transaction', transactionSchema);

