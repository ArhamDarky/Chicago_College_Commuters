from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import requests

load_dotenv()

app = FastAPI()

# Enable frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BUS_API_KEY = os.getenv("BUS_API_KEY")
BASE_URL = "http://www.ctabustracker.com/bustime/api/v2"

@app.get("/cta/routes")
def get_routes():
    url = f"{BASE_URL}/getroutes?key={BUS_API_KEY}&format=json"
    response = requests.get(url)
    return response.json()

@app.get("/cta/directions")
def get_directions(rt: str):
    url = f"{BASE_URL}/getdirections?key={BUS_API_KEY}&format=json&rt={rt}"
    response = requests.get(url)
    return response.json()

@app.get("/cta/stops")
def get_stops(rt: str, direction: str = Query(default="Northbound")):
    url = f"{BASE_URL}/getstops?key={BUS_API_KEY}&format=json&rt={rt}&dir={direction}"
    response = requests.get(url)
    return response.json()

@app.get("/cta/predictions")
def get_predictions(stop_id: str, rt: str = ""):
    url = f"{BASE_URL}/getpredictions?key={BUS_API_KEY}&format=json&stpid={stop_id}&rt={rt}"
    response = requests.get(url)
    return response.json()

@app.get("/cta/vehicles")
def get_vehicles(rt: str):
    url = f"{BASE_URL}/getvehicles?key={BUS_API_KEY}&format=json&rt={rt}"
    response = requests.get(url)
    return response.json()
