from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.page import Page, PageCreate, PageUpdate
from app.services import page as page_service

router = APIRouter()

@router.get("/projects/{project_id}/pages/", response_model=List[Page])
def read_pages(project_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    pages = page_service.get_pages(db, project_id=project_id, skip=skip, limit=limit)
    return pages

@router.post("/projects/{project_id}/pages/", response_model=Page)
def create_page(project_id: int, page: PageCreate, db: Session = Depends(get_db)):
    page.project_id = project_id
    return page_service.create_page(db=db, page=page)

@router.get("/pages/{page_id}", response_model=Page)
def read_page(page_id: int, db: Session = Depends(get_db)):
    db_page = page_service.get_page(db, page_id=page_id)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    return db_page

@router.put("/pages/{page_id}", response_model=Page)
def update_page(page_id: int, page: PageUpdate, db: Session = Depends(get_db)):
    db_page = page_service.update_page(db, page_id=page_id, page=page)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    return db_page

@router.delete("/pages/{page_id}", response_model=Page)
def delete_page(page_id: int, db: Session = Depends(get_db)):
    db_page = page_service.delete_page(db, page_id=page_id)
    if db_page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    return db_page

@router.post("/pages/{page_id}/validate", response_model=Dict)
def validate_page_selectors(page_id: int, db: Session = Depends(get_db)):
    result = page_service.validate_selectors(db, page_id=page_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Page not found")
    return result 