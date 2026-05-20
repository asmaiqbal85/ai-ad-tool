"""Free-tier quota enforcement.

Free users get 3 lifetime ad generations. Re-renders are unlimited (they don't
hit this gate; only POST /api/generate-ad does)."""

from fastapi import HTTPException

from app.services.supabase import get_supabase

FREE_LIFETIME_LIMIT = 3


async def assert_can_create_ad(user) -> None:
    """Raise 402 if user is on free plan and at the lifetime ad limit."""
    db = get_supabase()

    profile_result = (
        db.table("profiles")
        .select("plan")
        .eq("user_id", user.id)
        .execute()
    )

    if profile_result.data:
        plan = profile_result.data[0]["plan"]
    else:
        # Trigger should have created this; self-heal if it didn't fire.
        db.table("profiles").insert({"user_id": user.id, "plan": "free"}).execute()
        plan = "free"

    if plan == "pro":
        return

    count_result = (
        db.table("ads")
        .select("id", count="exact")
        .eq("user_id", user.id)
        .execute()
    )
    used = count_result.count or 0

    if used >= FREE_LIFETIME_LIMIT:
        raise HTTPException(
            status_code=402,
            detail={
                "code": "quota_exceeded",
                "plan": "free",
                "used": used,
                "limit": FREE_LIFETIME_LIMIT,
                "message": (
                    f"Free plan limit reached ({used}/{FREE_LIFETIME_LIMIT} ads). "
                    "Upgrade to Pro for unlimited ads."
                ),
            },
        )
