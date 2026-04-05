from fastapi import APIRouter

from app.services.voice_sandbox.promotion_engine import engine

router = APIRouter()


@router.get("/state")
async def get_state():
    """Returns the full current state for the frontend to render."""
    return engine.get_state()


@router.post("/tick")
async def tick():
    """
    One engine cycle: check completions, promote leads.
    Frontend polls this every ~1.5s.
    """
    return engine.tick()


@router.post("/start")
async def start():
    """Reset and start the promotion engine (clean slate)."""
    engine.reset()
    engine.start()
    return engine.tick()


@router.post("/stop")
async def stop():
    """Pause the promotion engine."""
    engine.stop()
    return engine.get_state()


@router.post("/reset")
async def reset():
    """Reset all state to initial seed data."""
    engine.reset()
    return engine.get_state()
