from fastapi import APIRouter
from app.api import test_suite, test_case, page

api_router = APIRouter()

api_router.include_router(test_suite.router)
api_router.include_router(test_case.router)
api_router.include_router(page.router)
