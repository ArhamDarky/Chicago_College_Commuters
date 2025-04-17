from fastapi import FastAPI, Query
from dotenv import load_dotenv
import os
import requests

load_dotenv()
app = FastAPI()

BUS_API_KEY = os.getenv("BUS_API_KEY")
BASE_URL = "http://www.ctabustracker.com/bustime/api/v2"

# ------------------- Endpoint 1: Get All Bus Routes -------------------
@app.get("/cta/routes")
def get_routes():
    url = f"{BASE_URL}/getroutes?key={BUS_API_KEY}&format=json"
    response = requests.get(url)
    return response.json()

# ------------------- Endpoint 2: Get Stops for a Route -------------------
@app.get("/cta/stops")
def get_stops(rt: str, direction: str = Query(default="Northbound")):
    url = f"{BASE_URL}/getstops?key={BUS_API_KEY}&format=json&rt={rt}&dir={direction}"
    response = requests.get(url)
    return response.json()

# ------------------- Endpoint 3: Get Predictions -------------------
@app.get("/cta/predictions")
def get_predictions(stop_id: str, rt: str = ""):
    url = f"{BASE_URL}/getpredictions?key={BUS_API_KEY}&format=json&stpid={stop_id}&rt={rt}"
    response = requests.get(url)
    return response.json()
