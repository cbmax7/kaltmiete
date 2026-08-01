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

DATASET_ID = "B5WeoIlG49mV9VTXx"
DATASET_URL = f"https://api.apify.com/v2/datasets/{DATASET_ID}/items?clean=true"

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app"
IMAGE_DIR = APP / "assets" / "listings"
DECK_PATH = APP / "src" / "data" / "listings.json"
IMAGE_MAP_PATH = APP / "src" / "data" / "images.ts"

# Guessable, non-degenerate listings only.
MIN_SPACE, MAX_SPACE = 15, 200
MIN_RENT, MAX_RENT = 200, 6000
TARGET_DECK_SIZE = 300
IMAGE_SIZE = "800x600"

# Furnished flats rent for roughly double in Berlin but carry no data field,
# so the signal has to come out of the listing copy.
FURNISHED_RE = re.compile(
    r"m[oö]bl|furnish|serviced\s+apartment|vollausgestattet|all[-\s]?inclusive|wohnen\s+auf\s+zeit",
    re.IGNORECASE,
)
FLOORPLAN_RE = re.compile(r"grundriss|floor\s*plan", re.IGNORECASE)

INTERIOR_QUALITY = {
    "luxury": "Luxus",
    "sophisticated": "Gehoben",
    "normal": "Normal",
    "simple": "Einfach",
}


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
    floor: int | None
    floors_total: int | None
    year: int | None
    condition: str | None
    quality: str | None
    balcony: bool
    kitchen: bool
    garden: bool
    lift: bool
    cellar: bool
    furnished: bool
    new_build: bool
    high_demand: bool
    fair_price: str | None
    url: str


def fetch_raw() -> list[dict]:
    with urllib.request.urlopen(DATASET_URL, timeout=180) as response:
        return json.load(response)


def as_bool(value) -> bool:
    return str(value).lower() in {"y", "true", "yes"}


def tidy_region(value: str | None) -> str:
    """'Friedrichshain_Kreuzberg' -> 'Friedrichshain-Kreuzberg'."""
    return (value or "").replace("_", "-").strip()


def tidy_place(value: str | None) -> str:
    """Strip the administrative suffixes ImmoScout appends: 'Mitte (Ortsteil)' -> 'Mitte'."""
    cleaned = re.sub(
        r"(?:\s*\(|[-\s])(?:Ortsteil|Bezirk|Stadt)\)?\s*$", "", (value or "").strip()
    )
    return cleaned or ""


def photo_url(normalized: dict) -> str | None:
    for item in normalized.get("media") or []:
        if item.get("type") != "PICTURE":
            continue
        caption = item.get("caption") or ""
        url = item.get("url")
        if not url or FLOORPLAN_RE.search(caption) or FLOORPLAN_RE.search(url):
            continue
        # The scraper hands back a 1500x1000 render; a smaller one keeps the bundle sane.
        return re.sub(r"/resize/\d+x\d+/", f"/resize/{IMAGE_SIZE}/", url)
    return None


def normalise(raw: list[dict]) -> list[tuple[Listing, str]]:
    seen: set[tuple[int, int]] = set()
    results: list[tuple[Listing, str]] = []

    for item in raw:
        normalized = item.get("normalized") or {}
        ads = item.get("adTargetingParameters") or {}

        cold = (normalized.get("price") or {}).get("amount")
        space = (normalized.get("area") or {}).get("livingSpace")
        rooms = (normalized.get("rooms") or {}).get("total")
        if not cold or not space or not rooms:
            continue
        if not (MIN_SPACE <= space <= MAX_SPACE) or not (MIN_RENT <= cold <= MAX_RENT):
            continue

        # Near-identical units from the same block add nothing to the deck.
        fingerprint = (round(cold), round(space))
        if fingerprint in seen:
            continue

        photo = photo_url(normalized)
        if not photo:
            continue

        address = normalized.get("address") or {}
        construction = normalized.get("construction") or {}
        floor = normalized.get("floor") or {}

        district = tidy_place(address.get("city")) or tidy_place(tidy_region(ads.get("obj_regio4"))) or "Berlin"
        borough = tidy_place(tidy_region(ads.get("obj_regio3"))) or district

        blurb = f"{normalized.get('title') or ''} {normalized.get('description') or ''}"
        warm = ads.get("obj_totalRent")

        seen.add(fingerprint)
        results.append((
            Listing(
                id=str(normalized.get("listingId") or ads.get("obj_scoutId")),
                district=district,
                borough=borough,
                rooms=float(rooms),
                space=round(space),
                cold_rent=round(cold),
                warm_rent=round(float(warm)) if warm else None,
                per_sqm=round(cold / space, 1),
                floor=floor.get("current"),
                floors_total=floor.get("total"),
                year=construction.get("yearBuilt"),
                condition=construction.get("condition"),
                quality=INTERIOR_QUALITY.get(ads.get("obj_interiorQual") or ""),
                balcony=as_bool(ads.get("obj_balcony")),
                kitchen=as_bool(ads.get("obj_hasKitchen")),
                garden=as_bool(ads.get("obj_garden")),
                lift=as_bool(ads.get("obj_lift")),
                cellar=as_bool(ads.get("obj_cellar")),
                furnished=bool(FURNISHED_RE.search(blurb)),
                new_build=as_bool(ads.get("obj_newlyConst")),
                high_demand=as_bool(ads.get("obj_highDemand")),
                fair_price=(normalized.get("fairPrice") or {}).get("label"),
                url=normalized.get("url") or "",
            ),
            photo,
        ))

    return results


def download_images(entries: list[tuple[Listing, str]]) -> list[Listing]:
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    kept: list[Listing] = []

    for index, (listing, photo) in enumerate(entries, 1):
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
        if index % 50 == 0:
            print(f"  {index}/{len(entries)}")

    return kept


def prune_orphan_images(listings: list[Listing]) -> None:
    """Drop photos left behind by earlier, larger builds."""
    live = {f"{listing.id}.webp" for listing in listings}
    for path in IMAGE_DIR.glob("*.webp"):
        if path.name not in live:
            path.unlink()


def write_outputs(listings: list[Listing]) -> None:
    DECK_PATH.parent.mkdir(parents=True, exist_ok=True)

    deck = {
        "city": "Berlin",
        "source": "ImmobilienScout24 via Apify",
        "medianPerSqm": round(statistics.median(l.per_sqm for l in listings), 1),
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
    prune_orphan_images(listings)

    write_outputs(listings)

    furnished = sum(1 for l in listings if l.furnished)
    with_floor = sum(1 for l in listings if l.floor is not None)
    with_quality = sum(1 for l in listings if l.quality)

    print(f"\nDeck built: {len(listings)} listings")
    print(f"  median €/m²   {statistics.median(l.per_sqm for l in listings)}")
    print(f"  möbliert      {furnished} ({furnished / len(listings) * 100:.0f}%)")
    print(f"  with floor    {with_floor} ({with_floor / len(listings) * 100:.0f}%)")
    print(f"  with quality  {with_quality} ({with_quality / len(listings) * 100:.0f}%)")
    print(f"  {DECK_PATH.relative_to(ROOT)}")
    print(f"  {IMAGE_MAP_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
