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

router = APIRouter()
db_collection= 'Test'


@router.post("/test")
def create_subscription(
    *,
    scsAsId: str = Path(..., title="The ID of the Netapp that creates a subscription", example="myNetapp"),
    db: Session = Depends(deps.get_db),
    item_in: schemas.Test,
    # current_user: models.User = Depends(deps.get_current_active_user),
    http_request: Request
) -> Any:
    print(item_in)
    endpoint = http_request.scope['route'].path 
    json_item = jsonable_encoder(item_in)
    # tools.reports.update_report(scsAsId, endpoint, "POST", json_item)
    pass