"""Build the offline listing deck for the Kaltmiete app.

Pulls the scraped ImmobilienScout24 Berlin dataset from Apify, normalises it,
downloads one photo per listing, and writes both the JSON deck and the static
image map the Expo bundler needs.

Run:  python3 pipeline/build_listings.py
"""

from __future__ import annotations

import json
import re
import statistics
import urllib.request
from dataclasses import dataclass, asdict
from pathlib import Path

DATASET_ID = "gPxxBFcjuof0d9bPF"
DATASET_URL = f"https://api.apify.com/v2/datasets/{DATASET_ID}/items?clean=true"

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app"
IMAGE_DIR = APP / "assets" / "listings"
DECK_PATH = APP / "src" / "data" / "listings.json"
IMAGE_MAP_PATH = APP / "src" / "data" / "images.ts"

# Guessable, non-degenerate listings only.
MIN_SPACE, MAX_SPACE = 15, 200
MIN_RENT, MAX_RENT = 200, 6000
TARGET_DECK_SIZE = 30
IMAGE_SIZE = "800x600"


@dataclass
class Listing:
    id: str
    district: str
    borough: str
    rooms: float
    space: int
    cold_rent: int
    warm_rent: int | None
    per_sqm: float
    year: int | None
    balcony: bool
    kitchen: bool
    garden: bool
    url: str


def fetch_raw() -> list[dict]:
    with urllib.request.urlopen(DATASET_URL, timeout=60) as response:
        return json.load(response)


def split_quarter(quarter: str) -> tuple[str, str]:
    """'Britz (Neukölln)' -> ('Britz', 'Neukölln'). Falls back to the raw value."""
    match = re.match(r"^(.*?)\s*\((.*?)\)\s*$", quarter or "")
    if match:
        return match.group(1).strip(), match.group(2).strip()
    cleaned = (quarter or "Berlin").strip()
    return cleaned, cleaned


def first_photo_url(estate: dict) -> str | None:
    attachments = estate.get("galleryAttachments", {}).get("attachment")
    if isinstance(attachments, dict):
        attachments = [attachments]
    for attachment in attachments or []:
        if attachment.get("floorplan") == "true":
            continue
        urls = attachment.get("urls") or []
        for entry in urls:
            url = entry.get("url")
            candidates = [url] if isinstance(url, dict) else (url or [])
            for candidate in candidates:
                href = candidate.get("@href")
                if href:
                    return href.replace("%WIDTH%x%HEIGHT%", IMAGE_SIZE)
    return None


def as_bool(value) -> bool:
    return str(value).lower() == "true"


def normalise(raw: list[dict]) -> list[tuple[Listing, str]]:
    seen: set[tuple[int, int]] = set()
    results: list[tuple[Listing, str]] = []

    for item in raw:
        estate = item.get("resultlist.realEstate")
        if not estate:
            continue

        cold = estate.get("price", {}).get("value")
        space = estate.get("livingSpace")
        rooms = estate.get("numberOfRooms")
        if not cold or not space or not rooms:
            continue
        if not (MIN_SPACE <= space <= MAX_SPACE) or not (MIN_RENT <= cold <= MAX_RENT):
            continue

        # Near-identical units from the same block add nothing to the deck.
        fingerprint = (round(cold), round(space))
        if fingerprint in seen:
            continue

        photo = first_photo_url(estate)
        if not photo:
            continue

        district, borough = split_quarter(estate.get("address", {}).get("quarter", ""))
        warm = estate.get("calculatedTotalRent", {}).get("totalRent", {}).get("value")
        year = estate.get("constructionYear")

        seen.add(fingerprint)
        results.append((
            Listing(
                id=str(estate.get("@id") or item.get("realEstateId")),
                district=district,
                borough=borough,
                rooms=float(rooms),
                space=round(space),
                cold_rent=round(cold),
                warm_rent=round(warm) if warm else None,
                per_sqm=round(cold / space, 1),
                year=int(year) if year else None,
                balcony=as_bool(estate.get("balcony")),
                kitchen=as_bool(estate.get("builtInKitchen")),
                garden=as_bool(estate.get("garden")),
                url=item.get("link", ""),
            ),
            photo,
        ))

    return results


def download_images(entries: list[tuple[Listing, str]]) -> list[Listing]:
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    kept: list[Listing] = []

    for listing, photo in entries:
        target = IMAGE_DIR / f"{listing.id}.webp"
        if not target.exists():
            try:
                request = urllib.request.Request(photo, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(request, timeout=30) as response:
                    target.write_bytes(response.read())
            except Exception as error:  # noqa: BLE001 - a dead photo just drops the card
                print(f"  ! skipped {listing.id}: {error}")
                continue
        kept.append(listing)

    return kept


def write_outputs(listings: list[Listing]) -> None:
    DECK_PATH.parent.mkdir(parents=True, exist_ok=True)

    per_sqm_values = [listing.per_sqm for listing in listings]
    deck = {
        "city": "Berlin",
        "source": "ImmobilienScout24 via Apify",
        "medianPerSqm": round(statistics.median(per_sqm_values), 1),
        "medianColdRent": round(statistics.median(l.cold_rent for l in listings)),
        "listings": [asdict(listing) for listing in listings],
    }
    DECK_PATH.write_text(json.dumps(deck, ensure_ascii=False, indent=2), encoding="utf-8")

    # Metro only bundles statically-analysable require() calls, so emit them literally.
    requires = "\n".join(
        f'  "{listing.id}": require("../../assets/listings/{listing.id}.webp"),'
        for listing in listings
    )
    IMAGE_MAP_PATH.write_text(
        "// Generated by pipeline/build_listings.py — do not edit by hand.\n"
        "import type { ImageSourcePropType } from 'react-native';\n\n"
        "export const LISTING_IMAGES: Record<string, ImageSourcePropType> = {\n"
        f"{requires}\n"
        "};\n",
        encoding="utf-8",
    )


def main() -> None:
    print("Fetching scraped listings…")
    raw = fetch_raw()
    print(f"  {len(raw)} raw items")

    entries = normalise(raw)[:TARGET_DECK_SIZE]
    print(f"  {len(entries)} usable listings")

    print("Downloading photos…")
    listings = download_images(entries)

    write_outputs(listings)
    print(f"\nDeck built: {len(listings)} listings")
    print(f"  median €/m²  {statistics.median(l.per_sqm for l in listings)}")
    print(f"  {DECK_PATH.relative_to(ROOT)}")
    print(f"  {IMAGE_MAP_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
