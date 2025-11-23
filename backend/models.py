from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String)  # bank, cash, credit
    balance = Column(Float, default=0.0)
    currency = Column(String, default="INR")
    credit_limit = Column(Float, nullable=True)
    due_date = Column(String, nullable=True) # Storing as string for simplicity or could be day of month

    transactions = relationship("Transaction", back_populates="account")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String) # income, expense
    color = Column(String, default="#000000")

    transactions = relationship("Transaction", back_populates="category")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))
    amount = Column(Float)
    type = Column(String) # income, expense
    date = Column(DateTime, default=datetime.datetime.utcnow)
    note = Column(String, nullable=True)

    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
