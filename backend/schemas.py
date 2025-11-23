from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    type: str
    color: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int

    class Config:
        orm_mode = True

# Account Schemas
class AccountBase(BaseModel):
    name: str
    type: str
    balance: float
    currency: str = "INR"
    credit_limit: Optional[float] = None
    due_date: Optional[str] = None

class AccountCreate(AccountBase):
    pass

class Account(AccountBase):
    id: int

    class Config:
        orm_mode = True

# Transaction Schemas
class TransactionBase(BaseModel):
    amount: float
    type: str
    date: datetime
    note: Optional[str] = None
    account_id: int
    category_id: int

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    account: Optional[Account] = None
    category: Optional[Category] = None

    class Config:
        orm_mode = True

class TransferCreate(BaseModel):
    source_account_id: int
    target_account_id: int
    amount: float
    date: datetime
