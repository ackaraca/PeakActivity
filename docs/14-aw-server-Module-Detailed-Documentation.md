# aw-server Module Detailed Documentation

`aw-server` is the heart of PeakActivity, serving as the ActivityWatch server module. It provides data collection, processing, storage, and API services.

## Module Overview

### Main Responsibilities
- **Data Collection**: Collecting activity data from watchers
- **Data Storage**: Local (SQLite/Peewee) and cloud (Firestore) storage
- **API Presentation**: Data access via REST API
- **Data Processing**: Anonymization, categorization, analysis
- **Synchronization**: Cloud sync with Firebase

### Technology Stack
- **Backend**: Python 3.9+ (Flask framework)
- **Database**: SQLite/PostgreSQL (Peewee ORM) + Firestore
- **API**: RESTful endpoints
- **Authentication**: Firebase Auth
- **Logging**: Python logging + structured logging

## Core Files and Functions

### 1. main.py - Main Entry Point

```python
# aw-server/aw_server/main.py
import argparse
import logging
from typing import Optional

from aw_core.log import setup_logging
from aw_datastore import get_storage_methods

from .server import create_app
from .config import load_config

def main() -> None:
    """
    Main server startup function
    - Load configuration
    - Select storage backend
    - Start Flask app
    """
    parser = argparse.ArgumentParser(description="ActivityWatch server")
    parser.add_argument("--testing", action="store_true", help="Run in testing mode")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose logging")
    parser.add_argument("--log-json", action="store_true", help="Output logs in JSON format")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", default=5600, type=int, help="Port to bind to")
    parser.add_argument("--storage", choices=get_storage_methods().keys(), 
                       help="Storage method to use")
    
    args = parser.parse_args()
    
    # Logging setup
    setup_logging(
        "aw-server", 
        testing=args.testing, 
        verbose=args.verbose, 
        log_stderr=True,
    ...existing code...
```
