from fastapi import APIRouter
from app.api.endpoints import projects, test_suites, test_cases, pages, test_data, code_generator

api_router = APIRouter()
api_router.include_router(projects.router, tags=["projects"])
api_router.include_router(test_suites.router, tags=["test_suites"])
api_router.include_router(test_cases.router, tags=["test_cases"])
api_router.include_router(pages.router, tags=["pages"])
api_router.include_router(test_data.router, tags=["test_data"])
api_router.include_router(code_generator.router, tags=["code_generator"]) 
