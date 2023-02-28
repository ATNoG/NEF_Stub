from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, IPvAnyAddress, AnyHttpUrl
from enum import Enum


class Test(BaseModel):
    name: str
    number: int
    other: Optional[int]
    