from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.services.page import PageService
from app.schemas.page import (
    PageCreate,
    PageUpdate,
    PageResponse
)

router = APIRouter(prefix="/pages", tags=["pages"])

@router.post("/", response_model=PageResponse, status_code=status.HTTP_201_CREATED)
def create_page(page: PageCreate, db: Session = Depends(get_db)):
    try:
        service = PageService(db)
        return service.create(page.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[PageResponse])
def get_pages(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    service = PageService(db)
    return service.get_multi(skip=skip, limit=limit)

@router.get("/{page_id}", response_model=PageResponse)
def get_page(page_id: int, db: Session = Depends(get_db)):
    try:
        service = PageService(db)
        page = service.get(page_id)
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")
        return page
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{page_id}", response_model=PageResponse)
def update_page(
    page_id: int,
    page: PageUpdate,
    db: Session = Depends(get_db)
):
    try:
        service = PageService(db)
        updated_page = service.update(page_id, page.model_dump(exclude_unset=True))
        if not updated_page:
            raise HTTPException(status_code=404, detail="Page not found")
        return updated_page
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_page(page_id: int, db: Session = Depends(get_db)):
    try:
        service = PageService(db)
        service.delete(page_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
