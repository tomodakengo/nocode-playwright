from app.schemas.test_suite import TestSuiteCreate, TestSuiteUpdate, TestSuiteResponse, TestSuiteWithTestCases
from app.schemas.test_case import TestCaseCreate, TestCaseUpdate, TestCaseResponse
from app.schemas.page import PageCreate, PageUpdate, PageResponse

# Resolve forward references
TestSuiteWithTestCases.model_rebuild()
