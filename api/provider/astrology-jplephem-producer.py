#!/usr/bin/env python3
"""CSPICE-free DE405 candidate producer.

This script is intentionally an offline evaluation producer. It consumes a
caller-supplied, SHA-checked DE405 BSP and a fixed fixture, then emits only
geocentric J2000 state vectors. It does not download a provider, choose a
fallback, or perform astrology interpretation.
"""

import argparse
import hashlib
import importlib.metadata
import importlib.util
import json
import math
import struct
import sys
from pathlib import Path

from jplephem.spk import SPK


EXPECTED_PROVIDER_ID = "jplephem-2.24-direct-spk"
EXPECTED_JPLEPHEM_VERSION = "2.24"
EXPECTED_NUMPY_VERSION = "2.5.3"
EXPECTED_PYTHON_IMPLEMENTATION = "cpython"
EXPECTED_PYTHON_VERSION_SERIES = (3, 14)
EXPECTED_PYTHON_ABI = "cpython-314"
REFERENCE_PYTHON_VERSION = "3.14.7"
EXPECTED_KERNEL_URL = "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de405.bsp"
EXPECTED_KERNEL_SHA256 = "30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89"
EXPECTED_KERNEL_BYTES = 10898432
EXPECTED_KERNEL_IDENTITY = "unmodified_official_naif_de405_bsp"
EXPECTED_FIXTURE_SHA256 = "8cb64320ebfe24bc2654b920da27af370cc78b4c0f7c663898933aea67a2355d"
DAY_SECONDS = 86400.0
J2000 = 2451545.0
TWO_PART_JD_ERROR_BUDGET_SECONDS = 1.770977e-6
TIME_BRIDGE_PATH = Path(__file__).resolve().with_name("astrology_time_scale_bridge.py")
_time_bridge_module = None
_time_bridge_error = None
EXPECTED_BODY_IDS = {
    "sun": (10, "body"),
    "moon": (301, "body"),
    "mercury": (1, "barycenter"),
    "venus": (2, "barycenter"),
    "mars": (4, "barycenter"),
    "jupiter": (5, "barycenter"),
    "saturn": (6, "barycenter"),
    "uranus": (7, "barycenter"),
    "neptune": (8, "barycenter"),
    "pluto": (9, "barycenter"),
}


class CandidateError(RuntimeError):
    pass


def fail(message):
    raise CandidateError(message)


def finite(value):
    return isinstance(value, (int, float)) and math.isfinite(float(value))


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def stable_json(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n"


def et_bits(value):
    return "0x%016x" % struct.unpack(">Q", struct.pack(">d", float(value)))[0]


def _load_time_bridge():
    global _time_bridge_module, _time_bridge_error
    if _time_bridge_module is not None:
        return _time_bridge_module
    if _time_bridge_error is not None:
        fail(_time_bridge_error)
    try:
        spec = importlib.util.spec_from_file_location("astrology_time_scale_bridge", TIME_BRIDGE_PATH)
        if spec is None or spec.loader is None:
            raise RuntimeError("time-scale bridge module cannot be loaded")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        _time_bridge_module = module
        return module
    except Exception as error:
        _time_bridge_error = f"time-scale bridge unavailable: {error}"
        fail(_time_bridge_error)


def et_seconds_to_two_part_jd(et_seconds):
    try:
        return _load_time_bridge().et_seconds_to_two_part_jd(et_seconds)
    except Exception as error:
        fail(f"ET two-part conversion failed: {error}")


def two_part_representation_error_bound_seconds(et_seconds):
    try:
        return _load_time_bridge().two_part_representation_error_bound_seconds(et_seconds)
    except Exception as error:
        fail(f"ET two-part error bound failed: {error}")


def vector_add(left, right, sign=1.0):
    return [float(a + sign * b) for a, b in zip(left, right)]


def segment_state(segment, tdb1, tdb2):
    if not finite(tdb1) or not finite(tdb2) or tdb1 != math.floor(tdb1) or not 0.0 <= tdb2 < 1.0:
        fail("invalid normalized two-part TDB JD")
    position, velocity_km_per_day = segment.compute_and_differentiate(tdb1, tdb2)
    result = [float(value) for value in position]
    result.extend(float(value) / DAY_SECONDS for value in velocity_km_per_day)
    if len(result) != 6 or not all(finite(value) for value in result):
        fail("non-finite or incomplete SPK state")
    return result


def required_segment(kernel, center_id, target_id):
    try:
        return kernel[center_id, target_id]
    except Exception as error:
        fail(f"required DE405 segment missing: {center_id}->{target_id}: {error}")


def absolute_state(kernel, target_id, tdb1, tdb2):
    if target_id == 301:
        emb = segment_state(required_segment(kernel, 0, 3), tdb1, tdb2)
        moon = segment_state(required_segment(kernel, 3, 301), tdb1, tdb2)
        return vector_add(emb, moon)
    if target_id == 399:
        emb = segment_state(required_segment(kernel, 0, 3), tdb1, tdb2)
        earth = segment_state(required_segment(kernel, 3, 399), tdb1, tdb2)
        return vector_add(emb, earth)
    return segment_state(required_segment(kernel, 0, target_id), tdb1, tdb2)


def relative_to_earth(kernel, target_id, tdb1, tdb2):
    target = absolute_state(kernel, target_id, tdb1, tdb2)
    earth = absolute_state(kernel, 399, tdb1, tdb2)
    return vector_add(target, earth, sign=-1.0)


def validate_fixture(fixture_path, fixture):
    if fixture.get("schemaVersion") != "astrology-provider-equivalence-fixture-v1":
        fail("unsupported fixture schema")
    if fixture.get("fixtureId") != "jplephem-de405-equivalence-suite-v1":
        fail("unexpected fixture identity")
    actual_fixture_sha = sha256_file(fixture_path)
    if actual_fixture_sha != EXPECTED_FIXTURE_SHA256:
        fail(f"fixture SHA mismatch: {actual_fixture_sha}")

    kernel_contract = fixture.get("kernel")
    if not isinstance(kernel_contract, dict):
        fail("fixture kernel contract missing")
    for key, expected in (("sourceUrl", EXPECTED_KERNEL_URL), ("sha256", EXPECTED_KERNEL_SHA256), ("bytes", EXPECTED_KERNEL_BYTES), ("identity", EXPECTED_KERNEL_IDENTITY)):
        if kernel_contract.get(key) != expected:
            fail(f"fixture kernel contract mismatch: {key}")

    time_contract = fixture.get("time")
    if not isinstance(time_contract, dict):
        fail("fixture time contract missing")
    for key, expected in (("timeScale", "TDB"), ("observerId", 399), ("frame", "J2000"), ("aberrationCorrection", "NONE")):
        if time_contract.get(key) != expected:
            fail(f"fixture time contract mismatch: {key}")

    bodies = fixture.get("bodies")
    if bodies != [{"id": body_id, "targetId": target_id, "targetType": target_type} for body_id, (target_id, target_type) in EXPECTED_BODY_IDS.items()]:
        fail("fixture body mapping mismatch")
    locations = fixture.get("locations")
    if not isinstance(locations, list) or len(locations) != 4:
        fail("fixture locations incomplete")
    location_ids = [location.get("id") for location in locations]
    if location_ids != ["seoul", "busan", "jeju", "incheon"]:
        fail("fixture location order mismatch")
    for location in locations:
        if not finite(location.get("latitudeDegrees")) or not finite(location.get("longitudeDegreesEast")):
            fail("fixture location coordinate missing")

    fixtures = fixture.get("fixtures")
    if not isinstance(fixtures, list) or len(fixtures) != 19:
        fail("fixture date suite incomplete")
    seen = set()
    for item in fixtures:
        item_id = item.get("id")
        if not isinstance(item_id, str) or item_id in seen:
            fail("fixture date identity is missing or duplicated")
        seen.add(item_id)
        for key in ("et", "jdTt", "jdTdb", "tdbMinusTtSeconds"):
            if not finite(item.get(key)):
                fail(f"fixture date value missing: {item_id}.{key}")
        expected_jd_tdb = float(item["jdTt"]) + float(item["tdbMinusTtSeconds"]) / DAY_SECONDS
        if abs(expected_jd_tdb - float(item["jdTdb"])) > 1e-12:
            fail(f"fixture TT/TDB mismatch: {item_id}")
        expected_et = (float(item["jdTdb"]) - J2000) * DAY_SECONDS
        # The fixture stores both decimal JD(TDB) and ET; their independent
        # decimal round-trips can differ by a few tens of microseconds.
        if abs(expected_et - float(item["et"])) > 5e-5:
            fail(f"fixture ET/TDB mismatch: {item_id}")
    return fixtures


def validate_runtime():
    python_version = ".".join(str(part) for part in sys.version_info[:3])
    python_implementation = sys.implementation.name
    python_abi = sys.implementation.cache_tag
    if sys.version_info[:2] != EXPECTED_PYTHON_VERSION_SERIES or python_implementation != EXPECTED_PYTHON_IMPLEMENTATION or python_abi != EXPECTED_PYTHON_ABI:
        fail(f"Python runtime ABI mismatch: {python_version}/{python_implementation}/{python_abi}")
    try:
        jplephem_version = importlib.metadata.version("jplephem")
        numpy_version = importlib.metadata.version("numpy")
    except importlib.metadata.PackageNotFoundError as error:
        fail(f"provider dependency missing: {error}")
    if jplephem_version != EXPECTED_JPLEPHEM_VERSION:
        fail(f"jplephem version mismatch: {jplephem_version}")
    if numpy_version != EXPECTED_NUMPY_VERSION:
        fail(f"numpy version mismatch: {numpy_version}")
    return python_version, python_implementation, python_abi, jplephem_version, numpy_version


def produce(fixture_path, bsp_path, output_path, provider_id):
    if provider_id != EXPECTED_PROVIDER_ID:
        fail(f"wrong provider: {provider_id}")
    if not bsp_path.is_file():
        fail("DE405 BSP is missing")
    if bsp_path.stat().st_size != EXPECTED_KERNEL_BYTES:
        fail("DE405 BSP byte size mismatch")
    actual_kernel_sha = sha256_file(bsp_path)
    if actual_kernel_sha != EXPECTED_KERNEL_SHA256:
        fail(f"DE405 BSP SHA mismatch: {actual_kernel_sha}")
    if not fixture_path.is_file():
        fail("equivalence fixture is missing")
    fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    fixtures = validate_fixture(fixture_path, fixture)
    python_version, python_implementation, python_abi, jplephem_version, numpy_version = validate_runtime()

    try:
        kernel = SPK.open(str(bsp_path))
    except Exception as error:
        fail(f"DE405 BSP open failed: {error}")

    rows = []
    for item in fixtures:
        jd_tdb = float(item["jdTdb"])
        tdb1, tdb2 = et_seconds_to_two_part_jd(item["et"])
        if two_part_representation_error_bound_seconds(item["et"]) > TWO_PART_JD_ERROR_BUDGET_SECONDS:
            fail(f"two-part TDB representation budget exceeded: {item['id']}")
        for body_id, (target_id, target_type) in EXPECTED_BODY_IDS.items():
            state = relative_to_earth(kernel, target_id, tdb1, tdb2)
            rows.append({
                "fixtureId": item["id"],
                "body": body_id,
                "targetId": target_id,
                "targetType": target_type,
                "observerId": 399,
                "observer": "EARTH",
                "frame": "J2000/ICRF",
                "aberrationCorrection": "NONE",
                "jdTdb": jd_tdb,
                "et": float(item["et"]),
                "queryEtHex": et_bits(item["et"]),
                "positionKm": state[:3],
                "velocityKmPerSecond": state[3:],
                "selectionEvidenceStatus": "verified",
            })

    output = {
        "schemaVersion": "astrology-jplephem-producer-output-v1",
        "availability": "available",
        "provider": {
            "id": "jplephem",
            "implementation": "direct_spk",
            "version": jplephem_version,
            "numpyVersion": numpy_version,
            "pythonVersion": python_version,
            "pythonImplementation": python_implementation,
            "pythonAbi": python_abi,
            "license": "MIT",
        },
        "source": {
            "sourceUrl": EXPECTED_KERNEL_URL,
            "sha256": actual_kernel_sha,
            "bytes": EXPECTED_KERNEL_BYTES,
            "identity": EXPECTED_KERNEL_IDENTITY,
            "coverage": fixture["kernel"]["coverage"],
        },
        "semantics": {
            "timeScale": "TDB",
            "observerId": 399,
            "observer": "EARTH",
            "frame": "J2000/ICRF",
            "aberrationCorrection": "NONE",
            "positionUnit": "km",
            "velocityUnit": "km/s",
            "barycenterMapping": "DE405_BODY_MAPPING_v0",
        },
        "fixture": {
            "fixtureId": fixture["fixtureId"],
            "sha256": sha256_file(fixture_path),
            "dateCount": len(fixtures),
            "locationCount": len(fixture["locations"]),
            "bodyCount": len(EXPECTED_BODY_IDS),
            "rowCount": len(rows),
        },
        "rows": rows,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(stable_json(output), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--fixture", required=True)
    parser.add_argument("--bsp", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--provider", default=EXPECTED_PROVIDER_ID)
    args = parser.parse_args()
    try:
        produce(Path(args.fixture), Path(args.bsp), Path(args.output), args.provider)
    except (CandidateError, json.JSONDecodeError, OSError, ValueError) as error:
        print(f"astrology jplephem producer failed: {error}", file=sys.stderr)
        return 1
    print(json.dumps({"status": "pass", "output": args.output}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
