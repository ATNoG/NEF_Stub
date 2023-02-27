import logging
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Path, Request, Response
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pymongo.database import Database
from sqlalchemy.orm import Session
from app import models, schemas, tools
from app.api import deps
from app.crud import crud_mongo, user, ue
from app.db.session import client
from .utils import add_notifications
import requests
import json
from app.core.config import settings

router = APIRouter()
db_collection= 'BdtManagement'

@router.get("/{scsAsId}/subscriptions")
def read_active_subscriptions(
    *,
    scsAsId: str = Path(..., title="The ID of the Netapp that creates a subscription", example="myNetapp"),
    current_user: models.User = Depends(deps.get_current_active_user),
    http_request: Request
) -> Any:
    endpoint = http_request.scope['route'].path 
    user_item = jsonable_encoder(current_user)
    data = {"user": user_item ,"scsAsId": scsAsId, "endpoint": endpoint, "method": "GET", "payload": ""}
    requests.put(f"http://{str(settings.REPORT_API_HOST)}:{str(settings.REPORT_API_PORT)}/report/", data=json.dumps(data))

#Callback 

bdt_callback_router = APIRouter()

@bdt_callback_router.post("{$request.body.notificationDestination}",response_class=Response)
def bdt_notification(body: schemas.ExNotification):
    pass

@router.post("/{scsAsId}/subscriptions")
def create_subscription(
    *,
    scsAsId: str = Path(..., title="The ID of the Netapp that creates a subscription", example="myNetapp"),
    db: Session = Depends(deps.get_db),
    item_in: schemas.BdtCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
    http_request: Request
) -> Any:
    endpoint = http_request.scope['route'].path 
    json_item = jsonable_encoder(item_in)
    user_item = jsonable_encoder(current_user)
    body = {"user": user_item ,"scsAsId": scsAsId, "endpoint": endpoint, "method": "POST", "payload": json_item}
    print(body)
    data2=json.dumps(body)
    print(data2)
    x = requests.put("http://10.0.12.168:8000/report/", data=data2)
    pass

@router.put("/{scsAsId}/subscriptions/{subscriptionId}")
def update_subscription(
    *,
    scsAsId: str = Path(..., title="The ID of the Netapp that creates a subscription", example="myNetapp"),
    subscriptionId: str = Path(..., title="Identifier of the subscription resource"),
    item_in: schemas.MonitoringEventSubscriptionCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
    http_request: Request
) -> Any:    
    endpoint = http_request.scope['route'].path 
    json_item = jsonable_encoder(item_in)
    data = {"user": current_user ,"scsAsId": scsAsId, "endpoint": endpoint, "method": "PUT", "subscriptionId": subscriptionId,"payload": json_item}
    x = requests.put("http://10.0.12.168:8000/report/", data=json.dumps(data))
    pass

# @router.get("/{scsAsId}/subscriptions/{subscriptionId}")
# def read_subscription(
#     *,
#     scsAsId: str = Path(..., title="The ID of the Netapp that creates a subscription", example="myNetapp"),
#     subscriptionId: str = Path(..., title="Identifier of the subscription resource"),
#     current_user: models.User = Depends(deps.get_current_active_user),
#     http_request: Request
# ) -> Any:
#     endpoint = http_request.scope['route'].path 
#     tools.reports.update_report(scsAsId, endpoint, "GET", subs_id=subscriptionId)
#     pass


# @router.delete("/{scsAsId}/subscriptions/{subscriptionId}")
# def delete_subscription(
#     *,
#     scsAsId: str = Path(..., title="The ID of the Netapp that creates a subscription", example="myNetapp"),
#     subscriptionId: str = Path(..., title="Identifier of the subscription resource"),
#     current_user: models.User = Depends(deps.get_current_active_user),
#     http_request: Request
# ) -> Any:
#     endpoint = http_request.scope['route'].path 
#     tools.reports.update_report(scsAsId, endpoint, "DELETE", subs_id=subscriptionId)
#     pass


# # This function will handle all default pydantic exceptions raised in the
# # routers and parse them to TMF632 standardized exceptions
# @router.exception_handler(RequestValidationError)
# async def validation_exception_handler(request, exc):

#     error_messages = [
#         f"Error=(payload_location={'/'.join(error['loc'])}, " +
#         f"message='{error['msg']}')"
#         for error
#         in exc.errors()
#     ]

#     print("Exception Occurred in Payload's Validation: " +
#                  ", ".join(error_messages))

#     # return RouterAux.create_http_response(
#     #         http_status=HTTPStatus.BAD_REQUEST,
#     #         content=RouterAux.compose_error_payload(
#     #             code=HTTPStatus.BAD_REQUEST,
#     #             reason=", ".join(error_messages),
#     #         )
#     #     )