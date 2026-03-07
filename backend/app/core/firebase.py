"""Firebase Configuration Module"""
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import os
import json
from dotenv import load_dotenv
from app.core.logger import logger

# Load environment variables from .env file
load_dotenv()


class FirebaseConfig:
    """Firebase initialization and configuration"""
    
    _db = None
    _app = None
    
    @classmethod
    def initialize(cls):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if Firebase is already initialized
            if firebase_admin._apps:
                cls._app = firebase_admin.get_app()
                cls._db = firestore.client()
                logger.info("Using existing Firebase app instance")
                return cls._db
            
            # Get Firebase credentials from environment or file
            firebase_cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
            
            # If relative path, make it absolute from backend directory
            if firebase_cred_path and not os.path.isabs(firebase_cred_path):
                # Get the backend directory (parent of app directory)
                backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
                firebase_cred_path = os.path.join(backend_dir, firebase_cred_path)
            
            if firebase_cred_path and os.path.exists(firebase_cred_path):
                cred = credentials.Certificate(firebase_cred_path)
                cls._app = firebase_admin.initialize_app(cred)
                logger.info(f"✅ Firebase initialized successfully from {firebase_cred_path}")
                logger.info(f"🔥 Connected to project: {cred.project_id}")
            else:
                # Try to get credentials from environment variable
                firebase_cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
                if firebase_cred_json:
                    cred_dict = json.loads(firebase_cred_json)
                    cred = credentials.Certificate(cred_dict)
                    cls._app = firebase_admin.initialize_app(cred)
                    logger.info("✅ Firebase initialized from environment JSON")
                else:
                    # For hackathon: Use in-memory storage without excessive warnings
                    disable_warnings = os.getenv("DISABLE_FIREBASE_WARNINGS", "false").lower() == "true"
                    if not disable_warnings:
                        logger.warning("⚠️  Firebase credentials not configured - using in-memory fallback")
                        logger.warning(f"   Looked for: {firebase_cred_path}")
                    cls._app = None
                    return None
            
            cls._db = firestore.client()
            logger.info("🔥 Firebase Firestore client ready!")
            return cls._db
            
        except Exception as e:
            logger.error(f"❌ Firebase initialization error: {str(e)}")
            logger.warning("⚠️  Proceeding without Firebase - using in-memory storage")
            return None
    
    @classmethod
    def get_db(cls):
        """Get Firebase Firestore client"""
        if cls._db is None:
            cls.initialize()
        return cls._db
    
    @classmethod
    def is_connected(cls) -> bool:
        """Check if Firebase is connected"""
        return cls._db is not None


# Initialize on module load
firebase_db = FirebaseConfig.initialize()
