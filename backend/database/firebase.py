import firebase_admin
from firebase_admin import credentials
import os

# 1. Get the absolute path to the directory where firebase.py lives (.../backend/database)
current_dir = os.path.dirname(os.path.abspath(__file__))

# 2. Navigate one level up to the 'backend' folder and target the JSON file
key_path = os.path.join(current_dir, '..', 'serviceAccountKey.json')

# Optional: Clean up the path (resolves the '..' to a clean absolute path)
key_path = os.path.abspath(key_path)

# 3. Use the absolute path to initialize Firebase
cred = credentials.Certificate(key_path)
firebase_admin.initialize_app(cred)

print(f"Firebase initialized successfully using key at: {key_path}")