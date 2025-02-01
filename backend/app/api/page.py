from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.page import Page
from app.schemas.page import Page as PageSchema
from app.schemas.page import PageCreate, PageUpdate
from app.services.page import PageService

router = APIRouter(prefix="/pages", tags=["pages"])
service = PageService()

@router.post("/", response_model=PageSchema, status_code=status.HTTP_201_CREATED)
def create_page(page: PageCreate, db: Session = Depends(get_db)):
    return service.create(db, page)

@router.get("/", response_model=List[PageSchema])
def get_pages(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return service.get_multi(db, skip=skip, limit=limit)

@router.get("/{page_id}", response_model=PageSchema)
def get_page(page_id: int, db: Session = Depends(get_db)):
    page = service.get(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@router.put("/{page_id}", response_model=PageSchema)
def update_page(page_id: int, page: PageUpdate, db: Session = Depends(get_db)):
    db_page = service.get(db, page_id)
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")
    return service.update(db, db_obj=db_page, obj_in=page)

@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_page(page_id: int, db: Session = Depends(get_db)):
    page = service.get(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    service.delete(db, id=page_id)
    return None
