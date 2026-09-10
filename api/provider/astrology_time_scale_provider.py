#!/usr/bin/env python3
"""Verified offline UTC -> UT1/TT/TDB provider for Astrology v0.

The module is deliberately a thin composition layer over the already closed
C04 and HF2002 bridge contracts.  It does not predict, download, substitute,
or reuse the provider-equivalence fixture.  Every requested epoch must pass
the immutable time-scale bundle, its component assets, and the existing
source-bounded provider checks before a value is returned.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import math
from decimal import Decimal, ROUND_FLOOR, localcontext
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve()
REPOSITORY_ROOT = SCRIPT_PATH.parents[2]
BUNDLE_PATH = SCRIPT_PATH.parent / "astrology-time-scale-bundle-v1.json"
DUT1_CONTRACT_PATH = SCRIPT_PATH.parent / "dut1-c04-contract-v1.json"
TDB_CONTRACT_PATH = SCRIPT_PATH.parent / "tdb-tt-bridge-contract-v1.json"
DUT1_PROVIDER_PATH = SCRIPT_PATH.parent / "astrology_dut1_c04_provider.py"
TDB_BRIDGE_PATH = SCRIPT_PATH.parent / "astrology_time_scale_bridge.py"

BUNDLE_SCHEMA = "astrology-time-scale-bundle-v1"
BUNDLE_VERSION = "1.0.0"
EXPECTED_BUNDLE_CANONICAL_SHA256 = "eec8801b2c7b4a0c002a3bf24a76714f60c2c334c5ea63113c37a24ef6f6cf2b"
EXPECTED_DUT1_CONTRACT_SHA256 = "a2ef999f0fb18fe5f19ff7b87b7b9c6e97b940401b66ac945201ed4afac4d025"
EXPECTED_TDB_CONTRACT_SHA256 = "2d32c7240f0df6c4033d54c5b9b5302e8d2ff29b3a6e3dcf95467e2131ee9df8"
EXPECTED_UTC_TAI_SHA256 = "54e702abdc388ae3bf8cfc5f126900a5277829ad90e80f6773df6e714a133642"
EXPECTED_HF2002_SHA256 = "41a1aec5fabd3f4bdd57c0ac77dc5ba86665f48abc9f18743bfb00f3f5ee1cbf"
EXPECTED_RANGE_START_UTC = "1962-01-01T00:00:00.000Z"
EXPECTED_RANGE_END_UTC = "2026-08-10T00:00:00.000Z"
DAY_SECONDS = 86400.0
J2000 = 2451545.0

_dut1_module = None
_tdb_module = None


class TimeScaleProviderError(RuntimeError):
    """A stable fail-closed time-scale provider error."""

    def __init__(self, reason: str, detail: str | None = None):
        super().__init__(reason if detail is None else f"{reason}: {detail}")
        self.reason = reason


def fail(reason: str, detail: str | None = None) -> None:
    raise TimeScaleProviderError(reason, detail)


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _sha256_file(path: Path) -> str:
    try:
        return _sha256_bytes(path.read_bytes())
    except FileNotFoundError:
        fail("time_scale_asset_missing", str(path))
    except OSError as error:
        fail("time_scale_asset_unreadable", str(path))


def _ordered(value):
    if isinstance(value, list):
        return [_ordered(item) for item in value]
    if isinstance(value, dict):
        return {key: _ordered(value[key]) for key in sorted(value)}
    return value


def _canonical_json(value) -> str:
    return json.dumps(_ordered(value), ensure_ascii=False, sort_keys=False, separators=(",", ":"), allow_nan=False) + "\n"


def _canonical_sha256(value) -> str:
    return _sha256_bytes(_canonical_json(value).encode("utf-8"))


def _read_json(path: Path, reason: str) -> tuple[dict, bytes]:
    try:
        raw = path.read_bytes()
        value = json.loads(raw.decode("utf-8"))
    except FileNotFoundError:
        fail(reason + "_missing", str(path))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        fail(reason + "_invalid", str(error))
    if not isinstance(value, dict):
        fail(reason + "_invalid", "object required")
    return value, raw


def _asset_path(relative_path: str) -> Path:
    if not isinstance(relative_path, str) or not relative_path or Path(relative_path).is_absolute():
        fail("time_scale_asset_path_invalid", str(relative_path))
    path = (REPOSITORY_ROOT / relative_path).resolve()
    try:
        path.relative_to(REPOSITORY_ROOT.resolve())
    except ValueError:
        fail("time_scale_asset_path_invalid", relative_path)
    return path


def _verify_declared_asset(asset: dict) -> None:
    relative_path = asset.get("path")
    expected_sha = asset.get("sha256")
    expected_bytes = asset.get("bytes")
    if not isinstance(expected_sha, str) or len(expected_sha) != 64:
        fail("time_scale_asset_identity_invalid", str(relative_path))
    path = _asset_path(relative_path)
    actual_sha = _sha256_file(path)
    if actual_sha != expected_sha:
        fail("time_scale_asset_sha_mismatch", relative_path)
    if expected_bytes is not None:
        if not isinstance(expected_bytes, int) or path.stat().st_size != expected_bytes:
            fail("time_scale_asset_size_mismatch", relative_path)


def _load_module(name: str, path: Path):
    try:
        spec = importlib.util.spec_from_file_location(name, path)
        if spec is None or spec.loader is None:
            raise ImportError("module spec unavailable")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module
    except TimeScaleProviderError:
        raise
    except Exception as error:
        fail("time_scale_provider_module_unavailable", f"{name}:{type(error).__name__}")


def _load_dut1_module():
    global _dut1_module
    if _dut1_module is None:
        _dut1_module = _load_module("astrology_dut1_c04_provider", DUT1_PROVIDER_PATH)
    return _dut1_module


def _load_tdb_module():
    global _tdb_module
    if _tdb_module is None:
        _tdb_module = _load_module("astrology_time_scale_bridge", TDB_BRIDGE_PATH)
    return _tdb_module


def verify_bundle() -> tuple[dict, str]:
    """Verify the complete immutable time-scale bundle and component identity."""

    bundle, raw = _read_json(BUNDLE_PATH, "time_scale_bundle")
    without_hash = dict(bundle)
    declared_sha = without_hash.pop("bundleCanonicalSha256", None)
    if declared_sha != EXPECTED_BUNDLE_CANONICAL_SHA256 or _canonical_sha256(without_hash) != declared_sha:
        fail("time_scale_bundle_hash_mismatch")
    if bundle.get("schemaVersion") != BUNDLE_SCHEMA or bundle.get("contractVersion") != BUNDLE_VERSION:
        fail("time_scale_bundle_schema_mismatch")
    if bundle.get("status") != "implemented_internal_offline_external_review_required":
        fail("time_scale_bundle_status_mismatch")
    support = bundle.get("supportedRange")
    if support != {
        "startUtc": EXPECTED_RANGE_START_UTC,
        "endUtc": EXPECTED_RANGE_END_UTC,
        "endInclusive": True,
        "sourceOfCutoff": "C04_snapshot_last_daily_row",
        "futurePrediction": False,
        "beforeStart": False,
    }:
        fail("time_scale_bundle_range_mismatch")
    if bundle.get("bundleInvariants", {}).get("offlineOnly") is not True or bundle.get("bundleInvariants", {}).get("runtimeDownload") is not False or bundle.get("bundleInvariants", {}).get("syntheticProvider") is not False or bundle.get("bundleInvariants", {}).get("implicitZeroOrFallback") is not False:
        fail("time_scale_bundle_offline_boundary_mismatch")
    if bundle.get("redistribution", {}).get("status") != "external_review_required" or bundle.get("redistribution", {}).get("publicReleaseAllowed") is not False:
        fail("time_scale_bundle_release_boundary_mismatch")

    assets = bundle.get("immutableAssets")
    if not isinstance(assets, list) or not assets:
        fail("time_scale_bundle_asset_inventory_missing")
    for asset in assets:
        if not isinstance(asset, dict):
            fail("time_scale_bundle_asset_inventory_invalid")
        _verify_declared_asset(asset)

    components = bundle.get("components")
    if not isinstance(components, dict):
        fail("time_scale_bundle_components_missing")
    if components.get("dut1", {}).get("contractSha256") != EXPECTED_DUT1_CONTRACT_SHA256:
        fail("dut1_contract_identity_mismatch")
    if components.get("tdbMinusTt", {}).get("contractSha256") != EXPECTED_TDB_CONTRACT_SHA256:
        fail("tdb_contract_identity_mismatch")

    dut1, dut1_raw = _read_json(DUT1_CONTRACT_PATH, "dut1_contract")
    if _sha256_bytes(dut1_raw) != EXPECTED_DUT1_CONTRACT_SHA256 or dut1.get("schemaVersion") != "astrology-dut1-c04-contract-v1":
        fail("dut1_contract_identity_mismatch")
    tdb, tdb_raw = _read_json(TDB_CONTRACT_PATH, "tdb_contract")
    if _sha256_bytes(tdb_raw) != EXPECTED_TDB_CONTRACT_SHA256 or tdb.get("schemaVersion") != "astrology-tdb-tt-bridge-contract-v1" or tdb.get("input", {}).get("onePartFallback") is not False:
        fail("tdb_contract_identity_mismatch")
    if tdb.get("model", {}).get("hf2002", {}).get("sourceSha256") != EXPECTED_HF2002_SHA256:
        fail("hf2002_source_identity_mismatch")
    if components.get("ttMinusUtc", {}).get("sourceSha256") != EXPECTED_UTC_TAI_SHA256:
        fail("utc_tai_source_identity_mismatch")
    return bundle, _sha256_bytes(raw)


def _utc_jd_parts(record: dict) -> tuple[Decimal, Decimal]:
    try:
        year = int(record["year"])
        month = int(record["month"])
        day = int(record["day"])
        hour = int(record["hour"])
        minute = int(record["minute"])
        second = int(record["second"])
    except (KeyError, TypeError, ValueError) as error:
        fail("utc_record_invalid", str(error))
    a = (14 - month) // 12
    y = year + 4800 - a
    m = month + 12 * a - 3
    jdn = day + ((153 * m + 2) // 5) + (365 * y) + (y // 4) - (y // 100) + (y // 400) - 32045
    with localcontext() as context:
        context.prec = 80
        return Decimal(jdn - 1), Decimal("0.5") + Decimal(hour * 3600 + minute * 60 + second) / Decimal(str(DAY_SECONDS))


def _tt_pair(record: dict, tt_minus_utc_seconds: float) -> tuple[float, float, Decimal, Decimal]:
    utc_primary, utc_secondary = _utc_jd_parts(record)
    with localcontext() as context:
        context.prec = 80
        total = utc_secondary + Decimal(str(tt_minus_utc_seconds)) / Decimal(str(DAY_SECONDS))
        carry = total.to_integral_value(rounding=ROUND_FLOOR)
        primary = utc_primary + carry
        secondary = total - carry
        if not 0 <= secondary < 1:
            fail("tt_two_part_jd_invalid")
        return float(primary), float(secondary), primary, secondary


def _raise_component_error(error: Exception) -> None:
    reason = getattr(error, "reason", None)
    if isinstance(reason, str) and reason:
        fail(reason)
    fail("time_scale_provider_component_failure", type(error).__name__)


def produce(utc_iso: str, *, bundle_path: Path = BUNDLE_PATH, asset_root: Path = REPOSITORY_ROOT) -> dict:
    """Produce verified DUT1, TT-UTC, TDB-TT and canonical JD values."""

    if bundle_path != BUNDLE_PATH or asset_root != REPOSITORY_ROOT:
        # The production route is intentionally pinned to the packaged root.
        # Tests may mutate individual module paths after import; they cannot
        # redirect the canonical bundle to an arbitrary source.
        fail("time_scale_provider_root_override_rejected")
    bundle, bundle_file_sha = verify_bundle()
    dut1_module = _load_dut1_module()
    try:
        dut1 = dut1_module.produce(utc_iso, dut1_module.DEFAULT_CONTRACT_PATH, dut1_module.REPOSITORY_ROOT)
    except Exception as error:
        _raise_component_error(error)
    if dut1.get("status") != "ready_source_bounded_with_uncertainty":
        fail("dut1_provider_status_invalid")

    try:
        tai_minus_utc = dut1["provenance"]["utcTaiHistory"]["taiMinusUtcSecondsAtEpoch"]
        record = dut1["input"]
        tt_minus_utc = float(tai_minus_utc) + 32.184
    except (KeyError, TypeError, ValueError) as error:
        fail("tt_minus_utc_provenance_missing", str(error))
    if not _finite(tai_minus_utc) or not _finite(tt_minus_utc):
        fail("tt_minus_utc_nonfinite")

    tt1, tt2, tt1_decimal, tt2_decimal = _tt_pair(record, tt_minus_utc)
    bridge = _load_tdb_module()
    try:
        tdb_minus_tt = float(bridge.tdb_minus_tt_seconds(tt1, tt2))
    except Exception as error:
        _raise_component_error(error)
    if not _finite(tdb_minus_tt):
        fail("tdb_minus_tt_nonfinite")
    bridge_provenance = bridge.model_provenance()
    if bridge_provenance.get("bridgeId") != "HF2002_IERS_TN36_10_5_IAU2006_B3_TDB_MINUS_TT" or bridge_provenance.get("source", {}).get("sha256") != EXPECTED_HF2002_SHA256:
        fail("tdb_minus_tt_provenance_mismatch")

    utc_primary, utc_secondary = _utc_jd_parts(record)
    with localcontext() as context:
        context.prec = 80
        jd_utc_decimal = utc_primary + utc_secondary
        jd_ut1_decimal = jd_utc_decimal + Decimal.from_float(float(dut1["value"]["seconds"])) / Decimal(str(DAY_SECONDS))
        jd_tt_decimal = tt1_decimal + tt2_decimal
        jd_tdb_decimal = jd_tt_decimal + Decimal.from_float(tdb_minus_tt) / Decimal(str(DAY_SECONDS))
        et_decimal = (jd_tt_decimal - Decimal(str(J2000))) * Decimal(str(DAY_SECONDS)) + Decimal.from_float(tdb_minus_tt)
    jd_utc = float(jd_utc_decimal)
    jd_ut1 = float(jd_ut1_decimal)
    jd_tt = float(jd_tt_decimal)
    jd_tdb = float(jd_tdb_decimal)
    et_seconds = float(et_decimal)
    if not all(_finite(value) for value in (jd_utc, jd_ut1, jd_tt, jd_tdb, et_seconds)):
        fail("time_scale_result_nonfinite")

    components = bundle["components"]
    output = {
        "schemaVersion": "astrology-verified-time-scales-v1",
        "status": "verified_source_relative",
        "supportRange": dict(bundle["supportedRange"]),
        "input": dict(record),
        "values": {
            "dut1Seconds": float(dut1["value"]["seconds"]),
            "taiMinusUtcSeconds": float(tai_minus_utc),
            "ttMinusUtcSeconds": tt_minus_utc,
            "tdbMinusTtSeconds": tdb_minus_tt,
        },
        "julianDates": {
            "utc": jd_utc,
            "ut1": jd_ut1,
            "tt": {"value": jd_tt, "primary": tt1, "secondary": tt2},
            "tdb": {"value": jd_tdb},
        },
        "etSeconds": et_seconds,
        "provenance": {
            "bundle": {"schemaVersion": BUNDLE_SCHEMA, "path": "api/provider/astrology-time-scale-bundle-v1.json", "canonicalSha256": bundle["bundleCanonicalSha256"], "fileSha256": bundle_file_sha},
            "dut1": {
                "identity": components["dut1"]["identity"],
                "contractPath": components["dut1"]["contractPath"],
                "contractSha256": components["dut1"]["contractSha256"],
                "provider": dut1["provenance"],
                "sourceRefs": ["C04.data.UT1-UTC", "C04.data.UT1-UTC-Er", "IERS.INTERP.F.LAGINT", "IERS.INTERP.F.PMUT1_OCEANS", "IERS.UTLIBR.F", "IERS.FUNDARG.F"],
            },
            "ttMinusUtc": {
                "identity": components["ttMinusUtc"]["identity"],
                "definition": components["ttMinusUtc"]["definition"],
                "sourcePath": components["ttMinusUtc"]["sourcePath"],
                "sourceSha256": components["ttMinusUtc"]["sourceSha256"],
                "taiMinusUtcSeconds": float(tai_minus_utc),
                "constantTaiToTtSeconds": 32.184,
                "sourceRefs": ["IERS.UTC-TAI.history", "TT=TAI+32.184s"],
            },
            "tdbMinusTt": {
                "contractPath": components["tdbMinusTt"]["contractPath"],
                "contractSha256": components["tdbMinusTt"]["contractSha256"],
                "bridge": bridge_provenance,
                "twoPartInput": {"primary": tt1, "secondary": tt2},
                "sourceRefs": ["HF2002_IERS.F", "IERS_TN36_10.1", "IERS_TN36_10.5", "IAU_2006_B3"],
            },
            "sourceRefs": ["timeScaleBundle", "dut1", "ttMinusUtc", "tdbMinusTt", "input.utc"],
        },
        "uncertainty": {
            "dut1": dut1["uncertainty"],
            "tdbMinusTt": {"model": "HF2002_fit_metadata_only", "twoPartRepresentationBudgetSeconds": bridge.TIME_REPRESENTATION_BUDGET_SECONDS, "notAnAbsoluteTruthBound": True},
            "discreteBoundaryUse": "requires_separate_frozen_boundary_guard; no final-observable interval inferred here",
        },
        "failClosed": {"runtimeDownload": False, "prediction": False, "fallback": False, "coverage": True, "sourceTamper": True},
    }
    return output


__all__ = [
    "BUNDLE_PATH",
    "EXPECTED_BUNDLE_CANONICAL_SHA256",
    "EXPECTED_DUT1_CONTRACT_SHA256",
    "EXPECTED_HF2002_SHA256",
    "EXPECTED_RANGE_END_UTC",
    "EXPECTED_RANGE_START_UTC",
    "EXPECTED_TDB_CONTRACT_SHA256",
    "EXPECTED_UTC_TAI_SHA256",
    "TimeScaleProviderError",
    "produce",
    "verify_bundle",
]
