"""Billing routes: Stripe Checkout, Customer Portal, and webhook receiver.

The webhook is the only writer that flips `profiles.plan` to 'pro' or back to
'free'. App routes only read the plan — never trust the client's claim of plan
status, never set it from a request body."""

from datetime import datetime, timezone

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request

from app.services.auth import get_current_user
from app.services.stripe_service import (
    create_checkout_session,
    create_portal_session,
    verify_webhook,
)
from app.services.supabase import get_supabase

router = APIRouter()

FREE_LIFETIME_LIMIT = 3  # mirrors quota.py — kept duplicated to avoid an import cycle if quota.py grows


def _get_or_create_profile(user_id: str) -> dict:
    db = get_supabase()
    result = db.table("profiles").select("*").eq("user_id", user_id).execute()
    if result.data:
        return result.data[0]
    insert = db.table("profiles").insert({"user_id": user_id, "plan": "free"}).execute()
    return insert.data[0]


@router.get("/me")
async def billing_me(user=Depends(get_current_user)):
    """Frontend reads this for plan badge, quota badge, and paywall decisions."""
    db = get_supabase()
    profile = _get_or_create_profile(user.id)

    count_result = (
        db.table("ads")
        .select("id", count="exact")
        .eq("user_id", user.id)
        .execute()
    )
    used = count_result.count or 0

    return {
        "plan": profile["plan"],
        "subscription_status": profile.get("subscription_status"),
        "current_period_end": profile.get("current_period_end"),
        "has_stripe_customer": bool(profile.get("stripe_customer_id")),
        "ads_used": used,
        "free_limit": FREE_LIFETIME_LIMIT,
    }


@router.post("/checkout")
async def billing_checkout(user=Depends(get_current_user)):
    """Create a Stripe Checkout session for Pro and return the hosted URL."""
    profile = _get_or_create_profile(user.id)
    if profile["plan"] == "pro":
        raise HTTPException(status_code=400, detail="Already on Pro plan")

    try:
        url = create_checkout_session(
            user_id=user.id,
            email=user.email,
            customer_id=profile.get("stripe_customer_id"),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Stripe checkout failed: {e}")

    return {"url": url}


@router.post("/portal")
async def billing_portal(user=Depends(get_current_user)):
    """Open the Stripe Billing Portal for self-serve subscription management."""
    profile = _get_or_create_profile(user.id)
    customer_id = profile.get("stripe_customer_id")
    if not customer_id:
        raise HTTPException(
            status_code=400,
            detail="No Stripe customer yet — start a checkout first.",
        )

    try:
        url = create_portal_session(customer_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Stripe portal failed: {e}")

    return {"url": url}


@router.post("/webhook")
async def billing_webhook(request: Request):
    """Stripe → us. Auth is the signature header, not a JWT.
    Must read the raw request body before any parsing for signature to match."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = verify_webhook(payload, sig_header)
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Bad webhook payload: {e}")

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        _handle_checkout_completed(data)
    elif event_type in ("customer.subscription.updated", "customer.subscription.created"):
        _handle_subscription_sync(data)
    elif event_type == "customer.subscription.deleted":
        _handle_subscription_deleted(data)
    # Other events (invoice.payment_failed etc.) — Stripe handles dunning;
    # subscription.updated will fire when status changes to past_due/canceled.

    return {"received": True}


def _handle_checkout_completed(session: dict) -> None:
    """First Pro signup — link the new Stripe customer + subscription to the user."""
    user_id = (session.get("metadata") or {}).get("user_id") or session.get("client_reference_id")
    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    if not user_id:
        return  # nothing to do — orphaned session

    update = {
        "plan": "pro",
        "subscription_status": "active",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if customer_id:
        update["stripe_customer_id"] = customer_id
    if subscription_id:
        update["stripe_subscription_id"] = subscription_id

    get_supabase().table("profiles").update(update).eq("user_id", user_id).execute()


def _handle_subscription_sync(subscription: dict) -> None:
    """Re-sync plan + status + period end from any subscription change."""
    user_id = (subscription.get("metadata") or {}).get("user_id")
    customer_id = subscription.get("customer")
    if not user_id and not customer_id:
        return

    status = subscription.get("status")  # active, past_due, canceled, unpaid, ...
    period_end = subscription.get("current_period_end")
    update = {
        "subscription_status": status,
        "plan": "pro" if status in ("active", "trialing") else "free",
        "stripe_subscription_id": subscription.get("id"),
        "current_period_end": (
            datetime.fromtimestamp(period_end, tz=timezone.utc).isoformat()
            if period_end
            else None
        ),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    db = get_supabase()
    if user_id:
        db.table("profiles").update(update).eq("user_id", user_id).execute()
    else:
        update["stripe_customer_id"] = customer_id
        db.table("profiles").update(update).eq("stripe_customer_id", customer_id).execute()


def _handle_subscription_deleted(subscription: dict) -> None:
    """Subscription ended (cancellation took effect or final non-payment) — revoke Pro."""
    user_id = (subscription.get("metadata") or {}).get("user_id")
    customer_id = subscription.get("customer")
    update = {
        "plan": "free",
        "subscription_status": "canceled",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    db = get_supabase()
    if user_id:
        db.table("profiles").update(update).eq("user_id", user_id).execute()
    elif customer_id:
        db.table("profiles").update(update).eq("stripe_customer_id", customer_id).execute()
