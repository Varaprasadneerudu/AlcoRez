"""Convenience CLI runner for seeding Telangana catalog & retail fixtures.

Directs execution to `backend/scripts/seed_data.py`.
Can be run via:
    python seed_data.py
    python scripts/seed_data.py
"""

import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scripts.seed_data import seed_database

if __name__ == "__main__":
    seed_database()
