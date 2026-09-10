#!/usr/bin/env python3
"""Offline, source-bounded TT -> TDB time bridge.

The IERS HF2002_IERS routine returns TCB-TCG at the geocenter.  This module
keeps that quantity separate from TDB-TT and applies the IERS TN36 Eq. 10.1
and Eq. 10.5 relations followed by IAU 2006 Resolution B3.  The coefficients
are read from the pinned, unmodified IERS source asset at every call so a
missing or tampered source fails closed.

This is a derived implementation with a new Python routine name.  The
original IERS source and its intact IERS software license are distributed
alongside it; the derived-work boundary is recorded in the repository
contract and does not claim IERS authorship or endorsement.
"""

from __future__ import annotations

import hashlib
import math
import re
import sys
from decimal import Decimal, ROUND_FLOOR, localcontext
from pathlib import Path
from typing import Any


SOURCE_PATH = Path(__file__).resolve().parent / "iers" / "HF2002_IERS.F"
SOURCE_URL = "https://iers-conventions.obspm.fr/content/chapter10/software/HF2002_IERS.F"
SOURCE_SHA256 = "41a1aec5fabd3f4bdd57c0ac77dc5ba86665f48abc9f18743bfb00f3f5ee1cbf"
SOURCE_BYTES = 47641
MODEL_ID = "HF2002_IERS_TCB_MINUS_TCG_AT_GEOCENTER"
BRIDGE_ID = "HF2002_IERS_TN36_10_5_IAU2006_B3_TDB_MINUS_TT"
DAY_SECONDS = 86400.0
J2000 = 2451545.0

# IERS Conventions numerical standards and the source routine's explicit
# correction.  Values are binary64 constants in the implementation.
LG = 6.969290134e-10
LC = 1.48082686741e-8
LB = 1.550519768e-8
TDB0_SECONDS = -6.55e-5
T0 = 2443144.5003725
C4_TERMS = 1.15e-16

# The official HF2002 source states the model's fit interval as 1600-2200.
# These are the exact JD(TT) endpoints used by the official XHF2002_IERS
# driver vectors, not a new service-date extension.
MODEL_START_JD = 2305445.0
MODEL_END_JD = 2524595.0

TIME_REPRESENTATION_BUDGET_SECONDS = 1.770977e-6
IEEE754_BINARY64 = "IEEE-754 binary64 / CPython float"

_DATA_BLOCK_PATTERN = re.compile(
    r"DATA\s+\(\(HFDATA\(I,J\),I=1,3\),J=\s*(\d+),\s*(\d+)\s*\)\s*/(.*?)/",
    re.IGNORECASE | re.DOTALL,
)
_FORTRAN_NUMBER_PATTERN = re.compile(
    r"[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:D[+-]?\d+)?",
    re.IGNORECASE,
)


class TimeScaleBridgeError(ValueError):
    """Raised when the fixed time-scale bridge contract cannot be applied."""


def _finite_binary64(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _assert_binary64_runtime() -> None:
    if sys.float_info.radix != 2 or sys.float_info.mant_dig != 53 or sys.float_info.max_exp != 1024:
        raise TimeScaleBridgeError("binary64_runtime_required")


def _read_verified_source() -> str:
    try:
        source_bytes = SOURCE_PATH.read_bytes()
    except OSError as error:
        raise TimeScaleBridgeError("hf2002_source_missing") from error
    if len(source_bytes) != SOURCE_BYTES:
        raise TimeScaleBridgeError("hf2002_source_size_mismatch")
    if hashlib.sha256(source_bytes).hexdigest() != SOURCE_SHA256:
        raise TimeScaleBridgeError("hf2002_source_sha_mismatch")
    try:
        return source_bytes.decode("ascii")
    except UnicodeDecodeError as error:
        raise TimeScaleBridgeError("hf2002_source_encoding_mismatch") from error


def _load_coefficients() -> tuple[tuple[float, float, float], ...]:
    """Parse all 500 official DATA rows after verifying source identity."""

    source = _read_verified_source()
    rows: list[list[float] | None] = [None] * 501
    blocks = list(_DATA_BLOCK_PATTERN.finditer(source))
    if len(blocks) != 50:
        raise TimeScaleBridgeError("hf2002_source_data_blocks_incomplete")
    for block in blocks:
        start = int(block.group(1))
        end = int(block.group(2))
        if start < 1 or end > 500 or end - start + 1 != 10:
            raise TimeScaleBridgeError("hf2002_source_data_range_invalid")
        values = [
            float(token.replace("D", "E").replace("d", "e"))
            for token in _FORTRAN_NUMBER_PATTERN.findall(block.group(3))
        ]
        if len(values) != 30:
            raise TimeScaleBridgeError("hf2002_source_data_values_incomplete")
        for offset, column in enumerate(range(start, end + 1)):
            row = values[offset * 3 : offset * 3 + 3]
            if not all(math.isfinite(value) for value in row):
                raise TimeScaleBridgeError("hf2002_source_data_nonfinite")
            if rows[column] is not None:
                raise TimeScaleBridgeError("hf2002_source_data_duplicate")
            rows[column] = row
    if any(row is None for row in rows[1:]):
        raise TimeScaleBridgeError("hf2002_source_data_missing")
    return tuple(tuple(row) for row in rows[1:] if row is not None)


def _require_two_part_jd(jd1: Any, jd2: Any) -> tuple[float, float]:
    _assert_binary64_runtime()
    if not _finite_binary64(jd1) or not _finite_binary64(jd2):
        raise TimeScaleBridgeError("tt_two_part_jd_nonfinite")
    first = float(jd1)
    second = float(jd2)
    if first != math.floor(first) or not 0.0 <= second < 1.0:
        raise TimeScaleBridgeError("tt_two_part_jd_not_midnight_normalized")
    # Compare the normalized pair lexicographically.  Recombining a large JD
    # into one binary64 value would discard the very fractional bits this ABI
    # is intended to preserve and could admit an out-of-range boundary value.
    start_day = math.floor(MODEL_START_JD)
    end_day = math.floor(MODEL_END_JD)
    if first < start_day or first > end_day or (first == end_day and second > MODEL_END_JD - end_day):
        raise TimeScaleBridgeError("hf2002_model_coverage_outside")
    return first, second


def _hf2002_tcb_minus_tcg(jd1: float, jd2: float, rows: tuple[tuple[float, float, float], ...]) -> float:
    """Port the arithmetic of HF2002_IERS.F without collapsing the JD pair."""

    n = 73000.0
    ne = 463
    nx = 36
    t_start = 2305450.5
    pi2 = 8.0 * math.atan(1.0)
    cn1dt = 3.0 * (n - 1.0)
    cndti = 4.0 / cn1dt

    # The source computes T=(TJD-T_START)-0.5*CN1DT.  Keep the fractional
    # part separate until the small model-relative quantity is formed.
    t = ((jd1 - t_start) + jd2) - 0.5 * cn1dt
    pi2t = pi2 * t
    xi = cndti * t
    row1 = rows[0]
    s0 = row1[0] + xi * (row1[1] + row1[2] * xi)

    s1 = 0.0
    for index in range(1, ne + 1):
        row = rows[ne + 1 - index]
        argument = pi2t * row[2]
        s1 += row[0] * math.sin(argument) + row[1] * math.cos(argument)

    s2 = 0.0
    for index in range(1, nx + 1):
        row = rows[ne + nx + 1 - index]
        argument = pi2t * row[2]
        s2 += xi * (row[0] * math.sin(argument) + row[1] * math.cos(argument))

    # HF2002_IERS.F: HF2002/(1-LB) + C4TERMS*(TJD-TT0)*86400.
    return (s0 + s1 + s2) / (1.0 - LB) + C4_TERMS * ((jd1 - T0) + jd2) * DAY_SECONDS


def hf2002_tcb_minus_tcg(jd_tt1: Any, jd_tt2: Any) -> float:
    """Return the official HF2002_IERS geocentric TCB-TCG value in seconds."""

    jd1, jd2 = _require_two_part_jd(jd_tt1, jd_tt2)
    value = _hf2002_tcb_minus_tcg(jd1, jd2, _load_coefficients())
    if not math.isfinite(value):
        raise TimeScaleBridgeError("hf2002_result_nonfinite")
    return float(value)


def tdb_minus_tt_seconds(jd_tt1: Any, jd_tt2: Any) -> float:
    """Return TDB-TT at the geocenter using HF2002, TN36, and IAU B3."""

    jd1, jd2 = _require_two_part_jd(jd_tt1, jd_tt2)
    rows = _load_coefficients()
    hf_tcb_minus_tcg = _hf2002_tcb_minus_tcg(jd1, jd2, rows)

    # IERS TN36 Eq. 10.1: TCG-TT = LG/(1-LG) * (JD_TT-T0)*86400.
    jd_tt_minus_t0 = (jd1 - T0) + jd2
    tcg_minus_tt = (LG / (1.0 - LG)) * jd_tt_minus_t0 * DAY_SECONDS
    tcb_minus_tt = hf_tcb_minus_tcg + tcg_minus_tt

    # IERS TN36 Eq. 10.5 is already represented by HF2002 at the geocenter.
    # IAU Resolution B3: TDB = TCB - LB*(JD_TCB-T0)*86400 + TDB0.
    jd_tcb_minus_t0 = jd_tt_minus_t0 + tcb_minus_tt / DAY_SECONDS
    result = tcb_minus_tt - LB * jd_tcb_minus_t0 * DAY_SECONDS + TDB0_SECONDS
    if not math.isfinite(result):
        raise TimeScaleBridgeError("tdb_minus_tt_result_nonfinite")
    return float(result)


def et_seconds_to_two_part_jd(et_seconds: Any) -> tuple[float, float]:
    """Split binary64 ET seconds into an exact-day primary and fractional day."""

    _assert_binary64_runtime()
    if not _finite_binary64(et_seconds):
        raise TimeScaleBridgeError("et_seconds_nonfinite")
    et = float(et_seconds)
    with localcontext() as context:
        context.prec = 80
        exact_et = Decimal.from_float(et)
        whole_days = int((exact_et / Decimal("86400")).to_integral_value(rounding=ROUND_FLOOR))
        remainder_seconds = exact_et - Decimal(whole_days) * Decimal("86400")
        secondary = float(remainder_seconds / Decimal("86400"))
    primary = float(int(J2000) + whole_days)
    if not math.isfinite(primary) or not math.isfinite(secondary) or not 0.0 <= secondary < 1.0:
        raise TimeScaleBridgeError("et_two_part_jd_invalid")
    return primary, secondary


def two_part_representation_error_bound_seconds(et_seconds: Any) -> float:
    """Conservative binary64 bound for the ET -> two-part-JD conversion."""

    primary, secondary = et_seconds_to_two_part_jd(et_seconds)
    del primary
    # The canonical ET value is already binary64.  The only new rounding is
    # conversion of its exact fractional-day remainder to the secondary part;
    # retain the ET half-ULP as a bound when the caller began with a decimal
    # value that was converted to binary64.
    bound = 0.5 * math.ulp(float(et_seconds)) + 0.5 * math.ulp(secondary) * DAY_SECONDS
    return float(bound)


def model_provenance() -> dict[str, Any]:
    """Return the fixed, non-semantic bridge identity for packet provenance."""

    return {
        "bridgeId": BRIDGE_ID,
        "modelId": MODEL_ID,
        "source": {"url": SOURCE_URL, "sha256": SOURCE_SHA256, "bytes": SOURCE_BYTES, "path": "api/provider/iers/HF2002_IERS.F"},
        "equations": {"tcgMinusTt": "IERS_TN36_10.1", "tcbMinusTcg": "IERS_TN36_10.5_geocenter", "tdbFromTcb": "IAU_2006_B3"},
        "constants": {"LG": LG, "LC": LC, "LB": LB, "TDB0Seconds": TDB0_SECONDS, "T0Jd": T0, "c4Terms": C4_TERMS},
        "units": {"input": "JD(TT), two-part days", "hf2002": "seconds TCB-TCG", "output": "seconds TDB-TT"},
        "numeric": {"format": IEEE754_BINARY64, "fallbacks": [], "onePartJdAllowed": False},
        "coverage": {"startJdTt": MODEL_START_JD, "endJdTt": MODEL_END_JD, "endInclusive": True},
    }


__all__ = [
    "BRIDGE_ID",
    "C4_TERMS",
    "DAY_SECONDS",
    "IEEE754_BINARY64",
    "J2000",
    "LB",
    "LC",
    "LG",
    "MODEL_END_JD",
    "MODEL_ID",
    "MODEL_START_JD",
    "SOURCE_BYTES",
    "SOURCE_PATH",
    "SOURCE_SHA256",
    "SOURCE_URL",
    "T0",
    "TDB0_SECONDS",
    "TIME_REPRESENTATION_BUDGET_SECONDS",
    "TimeScaleBridgeError",
    "et_seconds_to_two_part_jd",
    "hf2002_tcb_minus_tcg",
    "model_provenance",
    "tdb_minus_tt_seconds",
    "two_part_representation_error_bound_seconds",
]
