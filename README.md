# BudgetBuddy 💰

**BudgetBuddy** is a modern, full-stack finance tracking application designed to help you manage your money with ease. Track income, expenses, and transfers, visualize your spending habits, and generate detailed reports.

![BudgetBuddy](https://via.placeholder.com/800x400?text=BudgetBuddy+Dashboard)

## Features 🚀

*   **Dashboard**: Real-time overview of your total balance, monthly income, and expenses.
*   **Transactions**:
    *   Log Income, Expenses, and Transfers.
    *   Drill-down filtering by Year > Month > Week > Day.
    *   Custom categories with color coding.
*   **Accounts**: Manage multiple accounts (Bank, Cash, Credit Card).
*   **Reports**:
    *   Visual charts for spending by category and monthly trends.
    *   **PDF Export**: Download detailed reports for offline viewing.
*   **Theming**: Toggle between **Light** and **Dark** modes.

## Tech Stack 🛠️

*   **Frontend**: React (Vite), Vanilla CSS (Variables & Theming), Recharts, html2canvas, jsPDF.
*   **Backend**: Python FastAPI, SQLAlchemy, Pydantic.
*   **Database**: SQLite (Local storage).
*   **Package Manager**: `uv` (Python), `npm` (Node.js).

## Getting Started 🏁

### Prerequisites

*   Node.js (v18+)
*   Python (v3.10+)
*   `uv` (Python package manager) - Optional but recommended.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/manojmk04/budgetbuddy.git
    cd budgetbuddy
    ```

2.  **Backend Setup**:
    ```bash
    cd backend
    # Create virtual environment and install dependencies
    uv venv
    uv pip install fastapi uvicorn sqlalchemy pydantic
    # Run the server
    uv run uvicorn main:app --reload
    ```
    The backend will run at `http://127.0.0.1:8000`.

3.  **Frontend Setup**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    The frontend will run at `http://localhost:5173`.

## Usage 📱

1.  Open your browser and go to `http://localhost:5173`.
2.  **Add Accounts**: Start by creating your bank or cash accounts in the "Accounts" tab.
3.  **Log Transactions**: Use the "+" button to add income or expenses.
4.  **Analyze**: Check the Dashboard and Reports tabs to see where your money goes.

## License 📄

This project is licensed under the MIT License.
