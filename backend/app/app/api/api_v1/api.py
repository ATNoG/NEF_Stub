from fastapi import APIRouter

from app.api.api_v1 import endpoints

api_router = APIRouter()
api_router.include_router(endpoints.login.router, tags=["login"])
api_router.include_router(endpoints.users.router, prefix="/users", tags=["users"])
api_router.include_router(endpoints.utils.router, prefix="/utils", tags=["UI"])
api_router.include_router(endpoints.ue_movement.router, prefix="/ue_movement", tags=["Movement"])
api_router.include_router(endpoints.paths.router, prefix="/paths", tags=["Paths"])
api_router.include_router(endpoints.gNB.router, prefix="/gNBs", tags=["gNBs"])
api_router.include_router(endpoints.Cell.router, prefix="/Cells", tags=["Cells"])
api_router.include_router(endpoints.UE.router, prefix="/UEs", tags=["UEs"])
api_router.include_router(endpoints.qosInformation.router, prefix="/qosInfo", tags=["QoS Information"])
# api_router.include_router(monitoringevent.router, prefix="/3gpp-monitoring-event/v1", tags=["Monitoring Event API"])
# api_router.include_router(qosMonitoring.router, prefix="/3gpp-as-session-with-qos/v1", tags=["Session With QoS API"])
#api_router.include_router(monitoringevent.monitoring_callback_router, prefix="/3gpp-monitoring-event/v1", tags=["Monitoring Event API"])


    # ---Create a subapp---
nef_router = APIRouter()
nef_router.include_router(endpoints.testReport.router, prefix="/test-report/v1", tags=["Test Report API"])
nef_router.include_router(endpoints.monitoringevent.router, prefix="/3gpp-monitoring-event/v1", tags=["Monitoring Event API"])
nef_router.include_router(endpoints.qosMonitoring.router, prefix="/3gpp-as-session-with-qos/v1", tags=["Session With QoS API"])
nef_router.include_router(endpoints.bdtManagement.router, prefix="/3gpp-bdt/v1", tags=["Resource Management of Bdt API"])
nef_router.include_router(endpoints.trafficInfluence.router, prefix="/3gpp-traffic-influence/v1", tags=["Traffic Influence API"])
nef_router.include_router(endpoints.chargeableParty.router, prefix="/3gpp-chargeable-party/v1", tags=["Chargeable Party API"])
nef_router.include_router(endpoints.netStatReport.router, prefix="/3gpp-net-stat-report/v1", tags=["Reporting Network Status API"])
