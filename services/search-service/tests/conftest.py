import pytest
from datetime import date, timedelta


@pytest.fixture
def valid_search_params():
    today = date.today()
    return {
        "destination": "Cartagena",
        "check_in": today + timedelta(days=10),
        "check_out": today + timedelta(days=14),
        "adults": 2,
        "children": 0,
        "rooms": 1,
        "pets": False,
    }

