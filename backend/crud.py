from sqlalchemy.orm import Session
from sqlalchemy import func
import models, schemas
import datetime

# Account CRUD
def get_accounts(db: Session):
    return db.query(models.Account).all()

def create_account(db: Session, account: schemas.AccountCreate):
    db_account = models.Account(**account.dict())
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def update_account_balance(db: Session, account_id: int, amount: float, type: str):
    account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if account:
        if type == "income":
            account.balance += amount
        elif type == "expense":
            account.balance -= amount
        db.commit()
        db.refresh(account)

# Category CRUD
def get_categories(db: Session):
    return db.query(models.Category).all()

def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# Transaction CRUD
def get_transactions(db: Session, skip: int = 0, limit: int = 100, start_date: datetime.datetime = None, end_date: datetime.datetime = None):
    query = db.query(models.Transaction)
    if start_date:
        query = query.filter(models.Transaction.date >= start_date)
    if end_date:
        query = query.filter(models.Transaction.date <= end_date)
    return query.order_by(models.Transaction.date.desc()).offset(skip).limit(limit).all()

def create_transaction(db: Session, transaction: schemas.TransactionCreate):
    db_transaction = models.Transaction(**transaction.dict())
    db.add(db_transaction)
    
    # Update account balance
    update_account_balance(db, transaction.account_id, transaction.amount, transaction.type)
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def get_dashboard_stats(db: Session, start_date: datetime.datetime = None, end_date: datetime.datetime = None):
    total_balance = db.query(func.sum(models.Account.balance)).scalar() or 0
    
    # Default to current month if no dates provided
    if not start_date:
        now = datetime.datetime.utcnow()
        start_date = datetime.datetime(now.year, now.month, 1)
    
    income_query = db.query(func.sum(models.Transaction.amount)).filter(models.Transaction.type == "income")
    expense_query = db.query(func.sum(models.Transaction.amount)).filter(models.Transaction.type == "expense")

    if start_date:
        income_query = income_query.filter(models.Transaction.date >= start_date)
        expense_query = expense_query.filter(models.Transaction.date >= start_date)
    if end_date:
        income_query = income_query.filter(models.Transaction.date <= end_date)
        expense_query = expense_query.filter(models.Transaction.date <= end_date)

    return {
        "total_balance": total_balance,
        "monthly_income": income_query.scalar() or 0,
        "monthly_expense": expense_query.scalar() or 0
    }

def get_report_data(db: Session, type: str):
    # Aggregate data for charts
    if type == 'monthly_trend':
        # Group by Month-Year
        # SQLite specific date formatting
        return db.query(
            func.strftime('%Y-%m', models.Transaction.date).label('period'),
            models.Transaction.type,
            func.sum(models.Transaction.amount)
        ).group_by('period', models.Transaction.type).all()
    return []

def create_transfer(db: Session, transfer: schemas.TransferCreate):
    # 1. Deduct from Source
    source = db.query(models.Account).filter(models.Account.id == transfer.source_account_id).first()
    if source:
        source.balance -= transfer.amount
    
    # 2. Add to Target
    target = db.query(models.Account).filter(models.Account.id == transfer.target_account_id).first()
    if target:
        if target.type == 'credit':
            # For credit card, adding money reduces the 'balance' (debt) if we treat balance as debt, 
            # BUT my model has 'balance' as a float. 
            # Let's assume positive balance = money owned, negative = debt?
            # Or for simplicity, just add to balance. 
            # If user has Credit Card with 0 balance, and spends 500, balance becomes -500?
            # My seed data had positive balance. Let's stick to: Transfer adds to balance.
            target.balance += transfer.amount
        else:
            target.balance += transfer.amount

    # 3. Create Transaction Record (Optional: Create 2 records or 1 special record)
    # For simplicity, we'll create a transaction on the Source account saying "Transfer to X"
    # And maybe one on Target?
    # Let's just create one transaction linked to Source for now to track the flow.
    # Or better: Create a transaction with type 'transfer'
    
    db_trans = models.Transaction(
        account_id=transfer.source_account_id,
        category_id=None, # System category? or Null
        amount=transfer.amount,
        type="transfer",
        date=transfer.date,
        note=f"Transfer to {target.name if target else 'Unknown'}"
    )
    db.add(db_trans)
    
    db.commit()
    return {"message": "Transfer successful"}

def delete_transaction(db: Session, transaction_id: int):
    transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not transaction:
        return {"error": "Transaction not found"}
    
    # Reverse the balance change
    if transaction.type == "income":
        update_account_balance(db, transaction.account_id, transaction.amount, "expense")
    elif transaction.type == "expense":
        update_account_balance(db, transaction.account_id, transaction.amount, "income")
    
    db.delete(transaction)
    db.commit()
    return {"message": "Transaction deleted successfully"}

def update_transaction(db: Session, transaction_id: int, transaction_update: schemas.TransactionCreate):
    db_transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not db_transaction:
        return {"error": "Transaction not found"}
    
    # Reverse old balance change
    if db_transaction.type == "income":
        update_account_balance(db, db_transaction.account_id, db_transaction.amount, "expense")
    elif db_transaction.type == "expense":
        update_account_balance(db, db_transaction.account_id, db_transaction.amount, "income")
    
    # Update transaction
    for key, value in transaction_update.dict().items():
        setattr(db_transaction, key, value)
    
    # Apply new balance change
    update_account_balance(db, transaction_update.account_id, transaction_update.amount, transaction_update.type)
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def delete_account(db: Session, account_id: int):
    # Check if account has transactions
    transactions = db.query(models.Transaction).filter(models.Transaction.account_id == account_id).first()
    if transactions:
        return {"error": "Cannot delete account with existing transactions"}
    
    account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not account:
        return {"error": "Account not found"}
    
    db.delete(account)
    db.commit()
    return {"message": "Account deleted successfully"}
