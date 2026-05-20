"""Stripe wrapper. Lazy-configured so import never crashes when env is unset
(routes that call into Stripe will fail loudly at request time instead)."""

import os

import stripe
from dotenv import load_dotenv

load_dotenv()


def _configure() -> None:
    if stripe.api_key:
        return
    secret = os.getenv("STRIPE_SECRET_KEY")
    if not secret:
        raise RuntimeError("STRIPE_SECRET_KEY is not set")
    stripe.api_key = secret


def _required(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} is not set")
    return value


def create_checkout_session(
    user_id: str,
    email: str,
    customer_id: str | None,
) -> str:
    """Open a Pro-tier subscription Checkout. Returns the hosted URL."""
    _configure()
    price_id = _required("STRIPE_PRICE_ID")
    frontend_url = _required("FRONTEND_URL")

    kwargs: dict = {
        "mode": "subscription",
        "line_items": [{"price": price_id, "quantity": 1}],
        "client_reference_id": user_id,
        "success_url": f"{frontend_url}/billing?upgraded=1",
        "cancel_url": f"{frontend_url}/pricing?canceled=1",
        "metadata": {"user_id": user_id},
        "subscription_data": {"metadata": {"user_id": user_id}},
    }
    if customer_id:
        kwargs["customer"] = customer_id
    else:
        kwargs["customer_email"] = email

    session = stripe.checkout.Session.create(**kwargs)
    return session.url


def create_portal_session(customer_id: str) -> str:
    """Open the Stripe Billing Portal for self-serve subscription management."""
    _configure()
    frontend_url = _required("FRONTEND_URL")
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{frontend_url}/billing",
    )
    return session.url


def verify_webhook(payload: bytes, sig_header: str) -> stripe.Event:
    """Verify a webhook signature and return the parsed event.
    Raises stripe.SignatureVerificationError on tampering or wrong secret."""
    _configure()
    webhook_secret = _required("STRIPE_WEBHOOK_SECRET")
    return stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
