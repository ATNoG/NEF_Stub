import logging

from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.core.config import settings
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init() -> None:
    db = SessionLocal()
    init_db(db)
    

def main() -> None:
    logger.info("Creating initial data")
    init()
    logger.info("Initial data created")

    logger.info("Creating Report")
    requests.post(f"http://{str(settings.REPORT_API_HOST)}:{str(settings.REPORT_API_PORT)}/report/")
    logger.info("Report Created")


if __name__ == "__main__":
    main()
