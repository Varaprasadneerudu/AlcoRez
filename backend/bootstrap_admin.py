"""Convenience CLI runner for bootstrapping the initial administrator.

Directs execution to `backend/scripts/bootstrap_admin.py`.
Can be run via:
    python bootstrap_admin.py
    python scripts/bootstrap_admin.py
"""

import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scripts.bootstrap_admin import main

if __name__ == "__main__":
    main()
