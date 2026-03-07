import firebase_admin
from firebase_admin import credentials, firestore # Added firestore here
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
key_path = os.path.join(current_dir, '..', 'serviceAccountKey.json')
key_path = os.path.abspath(key_path)

cred = credentials.Certificate(key_path)
firebase_admin.initialize_app(cred)

print(f"Firebase initialized successfully using key at: {key_path}")

# Add this to export the database client!
db = firestore.client()