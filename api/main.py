from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from services import bus

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=[""],
    allow_headers=[""],
)

@app.get("/cta/bus/routes")
def routes():
    return bus.get_routes()

@app.get("/cta/bus/directions")
def directions(rt: str):
    return bus.get_directions(rt)

@app.get("/cta/bus/stops")
def stops(rt: str, direction: str = Query(default="Northbound")):
    return bus.get_stops(rt, direction)

@app.get("/cta/bus/predictions")
def predictions(rt: str, stop_id: str):
    return bus.get_predictions(rt, stop_id)

@app.get("/cta/bus/vehicles")
def vehicles(rt: str):
    return bus.get_vehicles(rt)