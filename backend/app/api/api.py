from fastapi import APIRouter
from app.api.endpoints import projects, test_suites

api_router = APIRouter()
api_router.include_router(projects.router, tags=["projects"])
api_router.include_router(test_suites.router, tags=["test_suites"]) 
