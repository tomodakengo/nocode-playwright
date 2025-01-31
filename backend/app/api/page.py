from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.page import Page
from app.schemas.page import (
    PageCreate,
    PageUpdate,
    PageResponse
)

router = APIRouter(prefix="/pages", tags=["pages"])

@router.post("/", response_model=PageResponse, status_code=status.HTTP_201_CREATED)
def create_page(page: PageCreate, db: Session = Depends(get_db)):
    db_page = Page(**page.model_dump())
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page

@router.get("/", response_model=List[PageResponse])
def get_pages(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Page).offset(skip).limit(limit).all()

@router.get("/{page_id}", response_model=PageResponse)
def get_page(page_id: int, db: Session = Depends(get_db)):
    db_page = db.query(Page).filter(Page.id == page_id).first()
    if db_page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    return db_page

@router.put("/{page_id}", response_model=PageResponse)
def update_page(
    page_id: int,
    page: PageUpdate,
    db: Session = Depends(get_db)
):
    db_page = db.query(Page).filter(Page.id == page_id).first()
    if db_page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    
    for key, value in page.model_dump(exclude_unset=True).items():
        setattr(db_page, key, value)
    
    db.commit()
    db.refresh(db_page)
    return db_page

@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_page(page_id: int, db: Session = Depends(get_db)):
    db_page = db.query(Page).filter(Page.id == page_id).first()
    if db_page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    
    db.delete(db_page)
    db.commit()
    return None
