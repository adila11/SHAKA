import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    fullDate: { type: String, required: true },
    time: { type: String, default: 'Just now' },
    category: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'BudgetCategory' },
    categoryColor: { type: String, default: '#c9b27c' },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['expense', 'income'], default: 'expense', required: true },
    isSplit: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ category: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ type: 1, category: 1, date: -1 });
transactionSchema.index({ categoryId: 1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);

