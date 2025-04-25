from dotenv import load_dotenv
import os
import requests

load_dotenv()  # 👈 MUST COME BEFORE os.getenv()

BUS_API_KEY = os.getenv("BUS_API_KEY")

BASE_URL = "http://www.ctabustracker.com/bustime/api/v2"

def get_routes():
    url = f"{BASE_URL}/getroutes?key={BUS_API_KEY}&format=json"
    return requests.get(url).json()

def get_directions(rt):
    url = f"{BASE_URL}/getdirections?key={BUS_API_KEY}&format=json&rt={rt}"
    return requests.get(url).json()

def get_stops(rt, direction):
    url = f"{BASE_URL}/getstops?key={BUS_API_KEY}&format=json&rt={rt}&dir={direction}"
    return requests.get(url).json()

def get_predictions(rt, stop_id):
    url = f"{BASE_URL}/getpredictions?key={BUS_API_KEY}&format=json&stpid={stop_id}&rt={rt}"
    return requests.get(url).json()

def get_vehicles(rt):
    url = f"{BASE_URL}/getvehicles?key={BUS_API_KEY}&format=json&rt={rt}"
    return requests.get(url).json()