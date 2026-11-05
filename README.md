# SHAKA — Personal Finance & Shared Ledger

Full-page responsive web frontend for **SHAKA**, engineered with modular React components and styled using Tailwind CSS tokens matching the **Google Stitch** design specifications.

---

## 💻 Architecture Overview: Responsive Web & Mobile

The application is built as a **proper, full-page web application** that seamlessly responds down to mobile and phone viewports:

* **Desktop View (`lg:`, `xl:`)**:
  * Persistent top navigation bar with brand monogram, quick links, Add Expense trigger, theme switch, and user profile pill.
  * Expansive multi-column layouts:
    * **Dashboard**: 4-column metric strip, side-by-side Monthly Limit and Category Donut widgets, projected month-end status, and recent activity ledger feed.
    * **Shared Ledger**: Full-width data table with search bar, category filter chips, member badges, split indicators, and month totals.
    * **Budget Planner**: 3-column responsive grid with interactive inline limit adjusters.
    * **Settings & Profile**: 2-column layout with household members, security controls, and theme preferences.
* **Mobile & Phone View (`< 768px`)**:
  * Touch-optimized card layouts with 44px+ interactive tap zones.
  * Bottom floating navigation bar (`MobileNav`) with safe area insets and prominent centered `+` action trigger.
  * Responsive **Add Expense Sheet**: Slides up smoothly from the bottom as an authentic native bottom sheet on mobile, and transforms into a centered modal dialog on desktop screens.

---

## 🎨 Stitch Design System Specifications

* **Design System**: *Ledgerly*
* **Aesthetic**: Understated Quiet Luxury & Modern Architectural Minimalism
* **Obsidian Foundations**:
  * Base Canvas: `#0e0e10`
  * Card Surfaces: `#17171a`, `#1f1f24`
  * Hairline Borders: `#26262b`
  * Brand Primary: Champagne Gold (`#c9b27c`, hover `#bba46e`)
  * Semantic Accents: Muted Sage (`#8fb39a`), Soft Amber (`#d4a359`), Muted Rose (`#d97070`)
* **Alabaster Light Mode**:
  * Base Canvas: `#f6f5f2`
  * Card Surfaces: `#ffffff`
  * Hairline Borders: `#e5e3dc`
* **Typography Pairing**:
  * UI Text: `Inter`
  * Monospace Tabular Figures: `JetBrains Mono` (`font-variant-numeric: tabular-nums`)

---

## 📂 Project Structure

```text
src/
├── components/
│   ├── common/
│   │   ├── CategoryBadge.jsx            # Category indicators with semantic dot accents
│   │   ├── HomeIndicator.jsx            # iOS bottom indicator
│   │   ├── ShakaLogo.jsx                # Luxury gold monogram brandmark
│   │   └── StatusBar.jsx                # Mobile status bar
│   ├── layout/
│   │   ├── Navbar.jsx                   # Full desktop top header with navigation & actions
│   │   ├── MobileNav.jsx                # Mobile bottom dock (visible on small viewports)
│   │   ├── ResponsiveLayout.jsx         # Root responsive layout wrapper
│   │   ├── AppHeader.jsx                # In-app compact header
│   │   ├── PhoneFrame.jsx               # Mobile frame container (for Stitch showcase)
│   │   └── ShakaHeader.jsx              # Showcase header
│   ├── modals/
│   │   └── AddExpenseModal.jsx          # Responsive modal (bottom sheet on phone, modal on desktop)
│   ├── showcase/
│   │   ├── AllScreensGallery.jsx        # Raw 8-screen Stitch phone artboard preview
│   │   └── InteractivePhoneSimulator.jsx
│   └── widgets/
│       ├── DonutSpendWidget.jsx         # SVG category donut chart with center pill
│       ├── MonthlyLimitWidget.jsx       # Monthly spend limit card with progress bar
│       ├── ProjectedSpendWidget.jsx     # Month-end projection with trend badge
│       └── StatCardsWidget.jsx          # Quick metrics (Avg/Day, Today's spend, Days left)
├── context/
│   ├── FinanceContext.jsx               # Global state for transactions, limits, and screens
│   └── ThemeContext.jsx                 # Dark (Obsidian) / Light (Alabaster) theme engine
├── data/
│   └── financeData.js                   # Mock data and currency formatters (₹ Indian Rupee)
├── pages/
│   ├── DashboardPage.jsx                # Full-page responsive Dashboard
│   ├── LedgerPage.jsx                   # Full-page responsive Shared Ledger
│   ├── BudgetPage.jsx                   # Full-page responsive Budget Planner
│   ├── ProfilePage.jsx                  # Full-page responsive Settings & Profile
│   ├── LoginPage.jsx                    # Full-page responsive Login card
│   ├── ForgotPasswordPage.jsx           # Full-page responsive Forgot Password
│   └── ChangePasswordPage.jsx           # Full-page responsive Change Password
├── App.jsx                              # Page router & layout mounting
├── index.css                            # Tailwind CSS v4 design tokens and reset
└── main.jsx                             # Application entrypoint
```

---

## 🚀 Running the Project

```bash
# Start Vite development server
npm run dev

# Run ESLint validation (0 errors, 0 warnings)
npm run lint

# Build for production
npm run build
```
