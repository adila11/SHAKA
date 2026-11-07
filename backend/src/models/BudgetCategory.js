import mongoose from 'mongoose';

const budgetCategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    category: { type: String, required: true, unique: true },
    limit: { type: Number, required: true, default: 5000 },
    color: { type: String, default: '#c9b27c' },
  },
  {
    timestamps: true,
  }
);

export const BudgetCategory = mongoose.model('BudgetCategory', budgetCategorySchema);
