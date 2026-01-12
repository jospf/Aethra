from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Aethra Backend Online"}

@app.get("/api/status")
def status():
    return {"status": "ok", "version": "2.0.0"}
