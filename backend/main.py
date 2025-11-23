from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas, crud
from database import SessionLocal, engine
import datetime

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS Setup - Allow both port 5173 and 5174
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/accounts/", response_model=schemas.Account)
def create_account(account: schemas.AccountCreate, db: Session = Depends(get_db)):
    return crud.create_account(db=db, account=account)

@app.get("/accounts/", response_model=List[schemas.Account])
def read_accounts(db: Session = Depends(get_db)):
    return crud.get_accounts(db)

@app.post("/categories/", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    return crud.create_category(db=db, category=category)

@app.get("/categories/", response_model=List[schemas.Category])
def read_categories(db: Session = Depends(get_db)):
    return crud.get_categories(db)

@app.post("/transactions/", response_model=schemas.Transaction)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    return crud.create_transaction(db=db, transaction=transaction)

@app.get("/transactions/", response_model=List[schemas.Transaction])
def read_transactions(
    skip: int = 0, 
    limit: int = 100, 
    start_date: str = None, 
    end_date: str = None, 
    db: Session = Depends(get_db)
):
    s_date = datetime.datetime.fromisoformat(start_date) if start_date else None
    e_date = datetime.datetime.fromisoformat(end_date) if end_date else None
    return crud.get_transactions(db, skip=skip, limit=limit, start_date=s_date, end_date=e_date)

@app.get("/dashboard/")
def read_dashboard_stats(start_date: str = None, end_date: str = None, db: Session = Depends(get_db)):
    s_date = datetime.datetime.fromisoformat(start_date) if start_date else None
    e_date = datetime.datetime.fromisoformat(end_date) if end_date else None
    return crud.get_dashboard_stats(db, start_date=s_date, end_date=e_date)

@app.get("/reports/trend")
def read_report_trend(db: Session = Depends(get_db)):
    data = crud.get_report_data(db, 'monthly_trend')
    # Format for frontend: [{period: '2023-11', income: 100, expense: 50}]
    result = {}
    for row in data:
        period, type, amount = row
        if period not in result:
            result[period] = {'period': period, 'income': 0, 'expense': 0}
        result[period][type] = amount
    return list(result.values())

@app.post("/transfers/")
def create_transfer(transfer: schemas.TransferCreate, db: Session = Depends(get_db)):
    return crud.create_transfer(db=db, transfer=transfer)

# Pre-populate some data if empty (Optional helper)
@app.post("/seed/")
def seed_data(db: Session = Depends(get_db)):
    if not crud.get_categories(db):
        crud.create_category(db, schemas.CategoryCreate(name="Food", type="expense", color="#FF5733"))
        crud.create_category(db, schemas.CategoryCreate(name="Salary", type="income", color="#33FF57"))
        crud.create_category(db, schemas.CategoryCreate(name="Transport", type="expense", color="#3357FF"))
    return {"message": "Data seeded"}
