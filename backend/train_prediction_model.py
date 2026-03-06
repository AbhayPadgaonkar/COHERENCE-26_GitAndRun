import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)

# LOAD DATA
df = pd.read_csv("indian_gov_fund_flows_40000.csv")

df['transfer_date'] = pd.to_datetime(df['transfer_date'])

# convert date to numeric
df['days'] = (df['transfer_date'] - df['transfer_date'].min()).dt.days

########################################################
# PART 1: AMOUNT PREDICTION (REGRESSION)
########################################################

X = df[['days']]
y = df['amount']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = LinearRegression()
model.fit(X_train, y_train)

predictions = model.predict(X_test)

# regression metrics
mae = mean_absolute_error(y_test, predictions)
rmse = np.sqrt(mean_squared_error(y_test, predictions))
r2 = r2_score(y_test, predictions)

print("\nAMOUNT PREDICTION METRICS")
print("MAE:", round(mae,2))
print("RMSE:", round(rmse,2))
print("R2 Score:", round(r2,3))

########################################################
# PART 2: LAPSE RISK CLASSIFICATION
########################################################

# create label
df['lapse_risk'] = df['status'].apply(
    lambda x: 1 if x in ['failed','expired'] else 0
)

features = [
    'processing_days',
    'fund_utilization_rate',
    'seasonal_factor'
]

X = df[features]
y = df['lapse_risk']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

from sklearn.ensemble import RandomForestClassifier

clf = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

clf.fit(X_train, y_train)

preds = clf.predict(X_test)

# classification metrics
acc = accuracy_score(y_test, preds)
prec = precision_score(y_test, preds)
rec = recall_score(y_test, preds)
f1 = f1_score(y_test, preds)

print("\nLAPSE RISK METRICS")

print("Accuracy:", round(acc,3))
print("Precision:", round(prec,3))
print("Recall:", round(rec,3))
print("F1 Score:", round(f1,3))