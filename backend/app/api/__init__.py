"""Root API Router"""
from fastapi import APIRouter
from app.api.scheme_routes import router as scheme_router
from app.api.fund_flow_routes import router as fund_flow_router
from app.api.utilization_routes import router as utilization_router
from app.api.anomaly_routes import router as anomaly_router
from app.api.prediction_routes import router as prediction_router
from app.api.optimization_routes import router as optimization_router
from app.api.analytics_routes import router as analytics_router
from app.api.insights_routes import router as insights_router
from app.api.beneficiary_payment_routes import router as beneficiary_payment_router
from app.api.nodal_agency_routes import router as nodal_agency_router
from app.api.utilization_certificate_routes import router as utilization_certificate_router
from app.api.llm_routes import router as llm_router
from app.api.metamask_auth_routes import router as metamask_auth_router

api_router = APIRouter(prefix="/api/v1")

# Include all routers
api_router.include_router(metamask_auth_router, tags=["MetaMask Authentication"])
api_router.include_router(scheme_router, tags=["Schemes"])
api_router.include_router(fund_flow_router, tags=["Fund Flow"])
api_router.include_router(utilization_router, tags=["Utilization"])
api_router.include_router(anomaly_router, tags=["Anomaly Detection"])
api_router.include_router(prediction_router, tags=["Predictions"])
api_router.include_router(optimization_router, tags=["Optimization"])
api_router.include_router(analytics_router, tags=["Analytics"])
api_router.include_router(insights_router, tags=["Insights"])
api_router.include_router(beneficiary_payment_router, tags=["Beneficiary Payments (DBT)"])
api_router.include_router(nodal_agency_router, tags=["Nodal Agency Monitoring"])
api_router.include_router(utilization_certificate_router, tags=["Utilization Certificates"])
api_router.include_router(llm_router, tags=["LLM Intelligence"])

__all__ = ["api_router"]
