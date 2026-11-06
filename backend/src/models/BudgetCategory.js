import mongoose from 'mongoose';

const budgetCategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    spent: { type: Number, default: 0 },
    limit: { type: Number, required: true, default: 5000 },
    color: { type: String, default: '#c9b27c' },
    status: { type: String, default: 'Healthy' },
    statusColor: { type: String, default: '#8fb39a' },
  },
  {
    timestamps: true,
  }
);

export const BudgetCategory = mongoose.model('BudgetCategory', budgetCategorySchema);

