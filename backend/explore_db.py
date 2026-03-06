#!/usr/bin/env python3
"""
Explore Firebase database structure and available data
"""
import sys
sys.path.insert(0, 'd:\\myenv\\coherence\\COHERENCE-26_GitAndRun\\backend')

import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase
cred_path = 'serviceAccountKey.json'
if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
else:
    print(f"❌ Firebase credentials not found at {cred_path}")
    sys.exit(1)

print("\n🔥 Connected to Firebase (Project: lokniti-66d58)\n")

print("="*70)
print("EXPLORING DATABASE COLLECTIONS")
print("="*70)

# List all collections
collections = list(db.collections())
print(f"\nCollections found: {len(collections)}\n")

for collection in collections:
    collection_name = collection.id
    print(f"\n📁 Collection: {collection_name}")
    print("-" * 70)
    
    # Get first 10 docs to understand schema
    docs = collection.limit(10).stream()
    doc_count = 0
    
    for doc in docs:
        doc_count += 1
        data = doc.to_dict()
        
        if doc_count == 1:
            print(f"   Fields: {', '.join(data.keys())}")
            print(f"   Sample docs:")
        
        # Show summary of first doc
        summary = {}
        for key, val in data.items():
            if isinstance(val, (str, int, float, bool)):
                summary[key] = str(val)[:50]
            elif isinstance(val, dict):
                summary[key] = f"<object with {len(val)} keys>"
            elif isinstance(val, list):
                summary[key] = f"<array with {len(val)} items>"
            else:
                summary[key] = str(type(val).__name__)
        
        print(f"      • {doc.id}: {summary}")
    
    # Get total count
    try:
        total = collection.count().get()
        print(f"   Total documents: {total}")
    except:
        print(f"   Total documents: {doc_count}+")
