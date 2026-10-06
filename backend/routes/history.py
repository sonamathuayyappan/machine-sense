from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from schemas import HistoryResponse, HistorySummary, HistoryItem
from database import get_history, get_summary_stats, clear_all_history

router = APIRouter(tags=["History"])

@router.get("/history", response_model=HistoryResponse)
def fetch_history(
    limit: int = Query(50, ge=1, le=500, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Offset index for pagination"),
    risk_level: Optional[str] = Query(None, description="Filter by risk tier: 'low', 'medium', 'high', or 'all'"),
    type: Optional[str] = Query(None, description="Filter by machine type: 'L', 'M', 'H', or 'all'")
):
    """
    Returns historical predictions logged in SQLite, ordered newest first, with summary statistics.
    """
    try:
        rows, total = get_history(
            limit=limit,
            offset=offset,
            risk_level=risk_level,
            machine_type=type
        )
        stats = get_summary_stats()
        
        items = [HistoryItem(**row) for row in rows]
        summary = HistorySummary(**stats)
        
        return HistoryResponse(
            items=items,
            total=total,
            limit=limit,
            offset=offset,
            summary=summary
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")

@router.delete("/history")
def clear_history():
    """
    Clears all prediction logs from the SQLite database.
    """
    try:
        affected = clear_all_history()
        return {"status": "success", "message": f"Cleared {affected} historical prediction records"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear history: {str(e)}")
