#!/usr/bin/env python3
"""Offline C04 DUT1 provider with source-pinned interpolation and corrections.

This is an independent, renamed Python implementation of the source-bounded
IERS EOP Product Center path.  It consumes only a pinned C04 snapshot and
verified local source assets; it never downloads, predicts, extrapolates, or
substitutes a missing value.
"""

from __future__ import annotations

import argparse
import bisect
from datetime import date
import hashlib
import json
import math
import re
import sys
from pathlib import Path


SCRIPT_PATH = Path(__file__).resolve()
REPOSITORY_ROOT = SCRIPT_PATH.parents[2]
DEFAULT_CONTRACT_PATH = SCRIPT_PATH.parent / "dut1-c04-contract-v1.json"
EXPECTED_CONTRACT_SHA256 = "a2ef999f0fb18fe5f19ff7b87b7b9c6e97b940401b66ac945201ed4afac4d025"

SECONDS_PER_DAY = 86400.0
TURN_AS = 1296000.0
ARCSEC_TO_RAD = 4.848136811095359935899141e-6
TWO_PI = 6.283185307179586476925287
HALF_PI = 1.5707963267948966
RAD2SEC = SECONDS_PER_DAY / TWO_PI
MJD_J2000 = 51544.5

NUMBER_RE = re.compile(r"[-+]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[EeDd][-+]?\d+)?")
UTC_RE = re.compile(
    r"^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?Z$"
)


class ProviderError(Exception):
    """A fail-closed provider error with a stable reason code."""

    def __init__(self, reason: str, detail: str | None = None):
        super().__init__(reason if detail is None else f"{reason}: {detail}")
        self.reason = reason


def fail(reason: str, detail: str | None = None) -> None:
    raise ProviderError(reason, detail)


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    try:
        return sha256_bytes(path.read_bytes())
    except FileNotFoundError:
        fail("asset_missing", str(path))


def read_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail("contract_missing_or_hash_mismatch", str(path))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        fail("contract_invalid", str(exc))


def require(condition: bool, reason: str, detail: str | None = None) -> None:
    if not condition:
        fail(reason, detail)


def parse_date_mjd(value: str, reason: str = "history_segment_invalid") -> float:
    parts = value.split("-")
    require(len(parts) == 3 and all(part.isdigit() for part in parts), reason, value)
    year, month, day = (int(part) for part in parts)
    require(1 <= month <= 12 and 1 <= day <= 31, reason, value)
    try:
        date(year, month, day)
    except ValueError:
        fail(reason, value)
    a = (14 - month) // 12
    y = year + 4800 - a
    m = month + 12 * a - 3
    jdn = day + ((153 * m + 2) // 5) + (365 * y) + (y // 4) - (y // 100) + (y // 400) - 32045
    return float(jdn) - 2400001.0


def parse_utc_mjd(value: str) -> tuple[float, dict]:
    match = UTC_RE.fullmatch(value)
    require(match is not None, "invalid_utc", "expected YYYY-MM-DDTHH:MM:SS[.fraction]Z")
    year, month, day, hour, minute, second, fraction_digits = match.groups()
    year, month, day, hour, minute, second = (int(item) for item in (year, month, day, hour, minute, second))
    require(second != 60, "leap_second_second_60_unsupported")
    require(0 <= hour <= 23 and 0 <= minute <= 59 and 0 <= second <= 59, "invalid_utc", value)
    day_mjd = parse_date_mjd(f"{year:04d}-{month:02d}-{day:02d}", "invalid_utc")
    fraction = 0.0 if not fraction_digits else float(f"0.{fraction_digits}")
    require(math.isfinite(fraction) and 0.0 <= fraction < 1.0, "invalid_utc", value)
    mjd = day_mjd + (hour * 3600.0 + minute * 60.0 + second + fraction) / SECONDS_PER_DAY
    require(math.isfinite(mjd), "invalid_utc", value)
    return mjd, {
        "utcIso": value,
        "year": year,
        "month": month,
        "day": day,
        "hour": hour,
        "minute": minute,
        "second": second,
        "fractionDigits": fraction_digits or "",
        "mjdUtc": mjd,
    }


def parse_contract(path: Path) -> tuple[dict, str]:
    raw = path.read_bytes() if path.exists() else None
    require(raw is not None, "contract_missing_or_hash_mismatch", str(path))
    contract_sha = sha256_bytes(raw)
    require(contract_sha == EXPECTED_CONTRACT_SHA256, "contract_missing_or_hash_mismatch", contract_sha)
    try:
        contract = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        fail("contract_invalid", str(exc))
    require(contract.get("schemaVersion") == "astrology-dut1-c04-contract-v1", "contract_invalid", "schemaVersion")
    require(contract.get("contractVersion") == "1.0.0", "contract_invalid", "contractVersion")
    require(contract.get("status") == "implemented_internal_offline_external_review_required", "contract_invalid", "status")
    return contract, contract_sha


def asset_path(asset_root: Path, relative_path: str) -> Path:
    path = (asset_root / relative_path).resolve()
    try:
        path.relative_to(asset_root.resolve())
    except ValueError:
        fail("asset_path_invalid", relative_path)
    return path


def verify_asset(asset_root: Path, relative_path: str, expected_sha: str, expected_bytes: int | None) -> Path:
    path = asset_path(asset_root, relative_path)
    actual_sha = sha256_file(path)
    require(actual_sha == expected_sha, "asset_sha_mismatch", relative_path)
    if expected_bytes is not None:
        require(path.stat().st_size == expected_bytes, "asset_size_mismatch", relative_path)
    return path


def parse_c04_rows(path: Path, sample: dict) -> list[dict]:
    try:
        text = path.read_text(encoding="ascii")
    except (OSError, UnicodeDecodeError) as exc:
        fail("data_asset_invalid", str(exc))
    header = "\n".join(text.splitlines()[:8])
    for marker in ("20 C04", "0h UTC", "UT1-UTC", "UT1-UTC Er"):
        require(marker in header, "data_header_or_row_count_or_mjd_sequence_mismatch", marker)
    rows: list[dict] = []
    for line_number, line in enumerate(text.splitlines(), start=1):
        fields = line.split()
        if not fields or not fields[0].isdigit():
            continue
        require(len(fields) >= 21, "data_header_or_row_count_or_mjd_sequence_mismatch", f"line {line_number}")
        try:
            year, month, day, hour = (int(fields[index]) for index in range(4))
            mjd = float(fields[4])
            ut1_minus_utc = float(fields[7])
            formal_error = float(fields[15])
        except (TypeError, ValueError) as exc:
            fail("data_header_or_row_count_or_mjd_sequence_mismatch", f"line {line_number}: {exc}")
        require(hour == 0, "data_header_or_row_count_or_mjd_sequence_mismatch", f"nonzero hour line {line_number}")
        require(math.isfinite(mjd) and math.isfinite(ut1_minus_utc), "data_header_or_row_count_or_mjd_sequence_mismatch", f"line {line_number}")
        require(math.isfinite(formal_error) and formal_error >= 0.0, "formal_uncertainty_missing_or_nonfinite_or_negative", f"line {line_number}")
        expected_mjd = float(sample["firstMjdUtc"]) + len(rows)
        require(mjd == expected_mjd, "data_header_or_row_count_or_mjd_sequence_mismatch", f"line {line_number}")
        rows.append({
            "year": year,
            "month": month,
            "day": day,
            "date": f"{year:04d}-{month:02d}-{day:02d}",
            "mjd": mjd,
            "ut1MinusUtcSeconds": ut1_minus_utc,
            "formalErrorSeconds": formal_error,
        })
    require(len(rows) == int(sample["rowCount"]), "data_header_or_row_count_or_mjd_sequence_mismatch", f"rows={len(rows)}")
    require(rows[0]["mjd"] == float(sample["firstMjdUtc"]), "data_header_or_row_count_or_mjd_sequence_mismatch", "first MJD")
    require(rows[-1]["mjd"] == float(sample["lastMjdUtc"]), "data_header_or_row_count_or_mjd_sequence_mismatch", "last MJD")
    return rows


def verify_history_segments(contract: dict, rows: list[dict]) -> list[dict]:
    history = contract["utcTaiHistory"]
    prepared: list[dict] = []
    previous_start = None
    for segment in history.get("segments", []):
        start = segment.get("start")
        end = segment.get("end")
        start_mjd = parse_date_mjd(start)
        end_mjd = None if end is None else parse_date_mjd(end)
        require(previous_start is None or start_mjd > previous_start, "history_segment_invalid", start)
        require(end_mjd is None or end_mjd > start_mjd, "history_segment_invalid", start)
        base = segment.get("baseSeconds")
        slope = segment.get("slopeSecondsPerDay")
        require(isinstance(base, (int, float)) and math.isfinite(float(base)), "history_segment_invalid", start)
        require(isinstance(slope, (int, float)) and math.isfinite(float(slope)), "history_segment_invalid", start)
        reference = segment.get("referenceMjd", start_mjd)
        require(isinstance(reference, (int, float)) and math.isfinite(float(reference)), "history_segment_invalid", start)
        prepared.append({**segment, "startMjd": start_mjd, "endMjd": end_mjd, "baseSeconds": float(base), "slopeSecondsPerDay": float(slope), "referenceMjd": float(reference)})
        previous_start = start_mjd
    require(prepared, "history_asset_missing_or_sha_mismatch_or_segment_gap")
    require(prepared[0]["startMjd"] <= rows[0]["mjd"], "history_asset_missing_or_sha_mismatch_or_segment_gap", "start")
    require(prepared[-1]["endMjd"] is None or prepared[-1]["endMjd"] > rows[-1]["mjd"], "history_asset_missing_or_sha_mismatch_or_segment_gap", "end")
    for left, right in zip(prepared, prepared[1:]):
        require(left["endMjd"] == right["startMjd"], "history_asset_missing_or_sha_mismatch_or_segment_gap", left["start"])
    return prepared


def segment_for_mjd(segments: list[dict], mjd: float) -> dict:
    starts = [segment["startMjd"] for segment in segments]
    index = bisect.bisect_right(starts, mjd) - 1
    if index < 0:
        fail("history_asset_missing_or_sha_mismatch_or_segment_gap", "before first segment")
    segment = segments[index]
    if segment["endMjd"] is not None and mjd >= segment["endMjd"]:
        fail("history_asset_missing_or_sha_mismatch_or_segment_gap", "segment lookup")
    return segment


def tai_minus_utc(mjd: float, segment: dict) -> float:
    value = segment["baseSeconds"] + (mjd - segment["referenceMjd"]) * segment["slopeSecondsPerDay"]
    require(math.isfinite(value), "history_asset_missing_or_sha_mismatch_or_segment_gap")
    return value


def number_tokens(block: str) -> list[float]:
    return [float(token.replace("D", "E").replace("d", "e")) for token in NUMBER_RE.findall(block)]


def parse_ocean_terms(path: Path) -> list[dict]:
    try:
        text = path.read_text(encoding="ascii")
        start_marker = "j=1,nlines)/"
        end_marker = "\n\n      T ="
        start = text.index(start_marker) + len(start_marker)
        end = text.index(end_marker, start)
    except (OSError, UnicodeDecodeError, ValueError) as exc:
        fail("correction_source_missing_or_sha_mismatch_or_term_parse_mismatch", f"ocean: {exc}")
    values = number_tokens(text[start:end])
    require(len(values) == 71 * 12, "correction_source_missing_or_sha_mismatch_or_term_parse_mismatch", f"ocean values={len(values)}")
    terms = []
    for offset in range(0, len(values), 12):
        row = values[offset:offset + 12]
        terms.append({"multipliers": [int(value) for value in row[:6]], "xSin": row[6], "xCos": row[7], "ySin": row[8], "yCos": row[9], "ut1Sin": row[10], "ut1Cos": row[11]})
    return terms


def parse_libration_terms(path: Path) -> list[dict]:
    try:
        text = path.read_text(encoding="ascii")
        start_marker = "J=1,11)"
        end_marker = "\n\n* Compute the harmonic model"
        start = text.index(start_marker) + len(start_marker)
        end = text.index(end_marker, start)
    except (OSError, UnicodeDecodeError, ValueError) as exc:
        fail("correction_source_missing_or_sha_mismatch_or_term_parse_mismatch", f"libration: {exc}")
    values = number_tokens(text[start:end])
    require(len(values) == 11 * 11, "correction_source_missing_or_sha_mismatch_or_term_parse_mismatch", f"libration values={len(values)}")
    terms = []
    for offset in range(0, len(values), 11):
        row = values[offset:offset + 11]
        terms.append({"multipliers": [int(value) for value in row[:6]], "periodDays": row[6], "ut1Sin": row[7], "ut1Cos": row[8], "lodSin": row[9], "lodCos": row[10]})
    return terms


def modulo_fortran(value: float, modulus: float) -> float:
    return math.fmod(value, modulus)


def ocean_arguments(mjd: float) -> list[float]:
    t = (mjd - 51544.5) / 36525.0
    arg1_arcsec = (67310.54841 + (876600.0 * 3600.0 + 8640184.812866) * t + 0.093104 * t**2 - 6.2e-6 * t**3) * 15.0 + 648000.0
    arg2_arcsec = -0.00024470 * t**4 + 0.051635 * t**3 + 31.8792 * t**2 + 1717915923.2178 * t + 485868.249036
    arg3_arcsec = -0.00001149 * t**4 + 0.000136 * t**3 - 0.5532 * t**2 + 129596581.0481 * t + 1287104.79305
    arg4_arcsec = 0.00000417 * t**4 - 0.001037 * t**3 - 12.7512 * t**2 + 1739527262.8478 * t + 335779.526232
    arg5_arcsec = -0.00003169 * t**4 + 0.006593 * t**3 - 6.3706 * t**2 + 1602961601.2090 * t + 1072260.70369
    arg6_arcsec = -0.00005939 * t**4 + 0.007702 * t**3 + 7.4722 * t**2 - 6962890.2665 * t + 450160.398036
    return [modulo_fortran(value, TURN_AS) * ARCSEC_TO_RAD for value in (arg1_arcsec, arg2_arcsec, arg3_arcsec, arg4_arcsec, arg5_arcsec, arg6_arcsec)]


def ocean_ut1_seconds(mjd: float, terms: list[dict]) -> float:
    arguments = ocean_arguments(mjd)
    result_microseconds = 0.0
    for term in terms:
        angle = modulo_fortran(sum(multiplier * argument for multiplier, argument in zip(term["multipliers"], arguments)), TWO_PI)
        result_microseconds += term["ut1Cos"] * math.cos(angle) + term["ut1Sin"] * math.sin(angle)
    result = result_microseconds * 1.0e-6
    require(math.isfinite(result), "correction_source_missing_or_sha_mismatch_or_term_parse_mismatch", "ocean result")
    return result


def fundamental_arguments(t: float) -> list[float]:
    l = 485868.249036 + t * (1717915923.2178 + t * (31.8792 + t * (0.051635 + t * -0.00024470)))
    lp = 1287104.79305 + t * (129596581.0481 + t * (-0.5532 + t * (0.000136 + t * -0.00001149)))
    f = 335779.526232 + t * (1739527262.8478 + t * (-12.7512 + t * (-0.001037 + t * 0.00000417)))
    d = 1072260.70369 + t * (1602961601.2090 + t * (-6.3706 + t * (0.006593 + t * -0.00003169)))
    om = 450160.398036 + t * (-6962890.5431 + t * (7.4722 + t * (0.007702 + t * -0.00005939)))
    return [modulo_fortran(value, TURN_AS) * ARCSEC_TO_RAD for value in (l, lp, f, d, om)]


def libration_ut1_seconds(mjd: float, terms: list[dict]) -> float:
    t = (mjd - MJD_J2000) / 36525.0
    gmst = modulo_fortran(67310.54841 + t * ((8640184.812866 + 3155760000.0) + t * (0.093104 + t * -0.0000062)), SECONDS_PER_DAY)
    l, lp, f, d, om = fundamental_arguments(t)
    arguments = [modulo_fortran(gmst / RAD2SEC + math.pi, TWO_PI), l, lp, f, d, om]
    result_microseconds = 0.0
    for term in terms:
        angle = modulo_fortran(sum(multiplier * argument for multiplier, argument in zip(term["multipliers"], arguments)), TWO_PI)
        result_microseconds += term["ut1Sin"] * math.sin(angle) + term["ut1Cos"] * math.cos(angle)
    result = result_microseconds * 1.0e-6
    require(math.isfinite(result), "correction_source_missing_or_sha_mismatch_or_term_parse_mismatch", "libration result")
    return result


def lagrange(rows: list[dict], mjd: float, segments: list[dict]) -> tuple[float, list[dict], list[float], str]:
    mjds = [row["mjd"] for row in rows]
    exact_index = bisect.bisect_left(mjds, mjd)
    if exact_index < len(rows) and mjds[exact_index] == mjd:
        return rows[exact_index]["ut1MinusUtcSeconds"], [rows[exact_index]], [1.0], "exact_source_sample"
    index = bisect.bisect_right(mjds, mjd) - 1
    require(0 <= index < len(rows) - 1, "outside_C04_snapshot_coverage")
    left = index - 1
    right = index + 2
    require(left >= 0 and right < len(rows), "endpoint_neighbour_window_unavailable")
    window = rows[left:right + 1]
    window_segments = [segment_for_mjd(segments, row["mjd"])["start"] for row in window]
    require(len(set(window_segments)) == 1, "interpolation_window_crosses_UTC_TAI_segment_boundary")
    weights = []
    result = 0.0
    for m, row in enumerate(window):
        weight = 1.0
        for j, other in enumerate(window):
            if m != j:
                weight *= (mjd - other["mjd"]) / (row["mjd"] - other["mjd"])
        weights.append(weight)
        result += weight * row["ut1MinusUtcSeconds"]
    require(math.isfinite(result), "data_header_or_row_count_or_mjd_sequence_mismatch", "interpolation result")
    return result, window, weights, "four_point_lagrange"


def verify_and_load(contract_path: Path, asset_root: Path) -> tuple[dict, str, list[dict], list[dict], list[dict], list[dict]]:
    contract, contract_sha = parse_contract(contract_path)
    data = contract["observedProvider"]
    data_path = verify_asset(asset_root, data["assetPath"], data["assetSha256"], data["assetBytes"])
    for asset in data.get("documentationAssets", []):
        verify_asset(asset_root, asset["path"], asset["sha256"], asset.get("bytes"))
    rows = parse_c04_rows(data_path, data["sample"])
    history = contract["utcTaiHistory"]
    verify_asset(asset_root, history["assetPath"], history["assetSha256"], history["assetBytes"])
    segments = verify_history_segments(contract, rows)
    interpolation = contract["interpolation"]
    interp_path = verify_asset(asset_root, interpolation["sourcePath"], interpolation["sourceSha256"], interpolation["sourceBytes"])
    for asset in interpolation.get("documentationAssets", []):
        verify_asset(asset_root, asset["path"], asset["sha256"], asset.get("bytes"))
    ocean_terms = parse_ocean_terms(interp_path)
    libration = contract["corrections"]["libration"]
    libration_path = verify_asset(asset_root, libration["sourcePath"], libration["sourceSha256"], libration["sourceBytes"])
    libration_terms = parse_libration_terms(libration_path)
    fundamentals = contract["corrections"]["fundamentalArguments"]
    fundarg_path = verify_asset(asset_root, fundamentals["sourcePath"], fundamentals["sourceSha256"], fundamentals["sourceBytes"])
    fundarg_text = fundarg_path.read_text(encoding="ascii")
    require("6962890.5431D0" in fundarg_text and "SUBROUTINE FUNDARG" in fundarg_text, "correction_source_missing_or_sha_mismatch_or_term_parse_mismatch", "FUNDARG identity")
    return contract, contract_sha, rows, segments, ocean_terms, libration_terms


def produce(utc: str, contract_path: Path = DEFAULT_CONTRACT_PATH, asset_root: Path = REPOSITORY_ROOT) -> dict:
    contract, contract_sha, rows, segments, ocean_terms, libration_terms = verify_and_load(contract_path, asset_root)
    mjd, input_record = parse_utc_mjd(utc)
    sample = contract["observedProvider"]["sample"]
    require(float(sample["firstMjdUtc"]) <= mjd <= float(sample["lastMjdUtc"]), "outside_C04_snapshot_coverage")
    raw_value, nodes, weights, interpolation_status = lagrange(rows, mjd, segments)
    segment = segment_for_mjd(segments, mjd)
    ocean = ocean_ut1_seconds(mjd, ocean_terms)
    libration = libration_ut1_seconds(mjd, libration_terms)
    total = raw_value + ocean + libration
    require(math.isfinite(total), "correction_source_missing_or_sha_mismatch_or_term_parse_mismatch", "total DUT1")
    formal_errors = [node["formalErrorSeconds"] for node in nodes]
    exact = interpolation_status == "exact_source_sample"
    output = {
        "schemaVersion": "astrology-dut1-c04-output-v1",
        "status": "ready_source_bounded_with_uncertainty",
        "input": input_record,
        "value": {
            "quantity": "UT1_minus_UTC",
            "unit": "SI_seconds",
            "seconds": total,
            "sourceC04Seconds": raw_value,
            "oceanTideCorrectionSeconds": ocean,
            "axialLibrationCorrectionSeconds": libration,
        },
        "interpolation": {
            "status": interpolation_status,
            "algorithm": "four_point_lagrange" if not exact else "source_sample",
            "sourceNodes": [
                {"date": node["date"], "mjdUtc": node["mjd"], "ut1MinusUtcSeconds": node["ut1MinusUtcSeconds"], "formalErrorSeconds": node["formalErrorSeconds"]}
                for node in nodes
            ],
            "weights": weights,
            "utcTaiSegment": segment["start"],
            "neighbourPolicy": "two_before_two_after_same_UTC_TAI_segment" if not exact else "not_required_for_exact_sample",
        },
        "uncertainty": {
            "status": "reported_formal_error_required_not_absolute_truth_bound",
            "sourceFormalErrorSeconds": formal_errors,
            "reportedFormalErrorSeconds": formal_errors[0] if exact else None,
            "acceptance": "finite_nonnegative_source_formal_errors_present",
            "boundarySafety": "not_proven_by_C04_formal_error_alone",
            "downstreamDiscreteUse": "requires_separate_uncertainty_guard_or_remains_blocked",
        },
        "provenance": {
            "contract": {"path": "api/provider/dut1-c04-contract-v1.json", "sha256": contract_sha},
            "observedProvider": {
                "identity": contract["observedProvider"]["identity"],
                "productId": contract["observedProvider"]["productId"],
                "version": contract["observedProvider"]["version"],
                "sourceUrl": contract["observedProvider"]["sourceUrl"],
                "assetPath": contract["observedProvider"]["assetPath"],
                "assetSha256": contract["observedProvider"]["assetSha256"],
                "documentationAssets": contract["observedProvider"].get("documentationAssets", []),
            },
            "utcTaiHistory": {
                "identity": contract["utcTaiHistory"]["identity"],
                "sourceUrl": contract["utcTaiHistory"]["sourceUrl"],
                "assetPath": contract["utcTaiHistory"]["assetPath"],
                "assetSha256": contract["utcTaiHistory"]["assetSha256"],
                "segmentStart": segment["start"],
                "taiMinusUtcSecondsAtEpoch": tai_minus_utc(mjd, segment),
            },
            "interpolation": {
                "identity": contract["interpolation"]["sourceIdentity"],
                "sourceUrl": contract["interpolation"]["sourceUrl"],
                "sourcePath": contract["interpolation"]["sourcePath"],
                "sourceSha256": contract["interpolation"]["sourceSha256"],
                "documentationAssets": contract["interpolation"].get("documentationAssets", []),
            },
            "corrections": {
                "ocean": {"identity": contract["corrections"]["oceanTide"]["identity"], "sourceSha256": contract["interpolation"]["sourceSha256"], "terms": len(ocean_terms)},
                "libration": {"identity": contract["corrections"]["libration"]["identity"], "sourceSha256": contract["corrections"]["libration"]["sourceSha256"], "terms": len(libration_terms)},
                "fundamentalArguments": {"identity": contract["corrections"]["fundamentalArguments"]["identity"], "sourceSha256": contract["corrections"]["fundamentalArguments"]["sourceSha256"]},
            },
            "sourceRefs": [
                "C04.data.UT1-UTC",
                "C04.data.UT1-UTC-Er",
                "IERS.INTERP.F.LAGINT",
                "IERS.INTERP.F.PMUT1_OCEANS",
                "IERS.UTLIBR.F",
                "IERS.FUNDARG.F",
                "IERS.UTC-TAI.history",
            ],
        },
        "failClosed": {
            "prediction": False,
            "runtimeFetch": False,
            "extrapolation": False,
            "fallback": False,
        },
    }
    return output


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Produce a verified offline C04 DUT1 value")
    parser.add_argument("--utc", required=True, help="UTC ISO instant without leap-second second=60")
    parser.add_argument("--contract", type=Path, default=DEFAULT_CONTRACT_PATH)
    parser.add_argument("--asset-root", type=Path, default=REPOSITORY_ROOT)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args(argv)
    try:
        result = produce(args.utc, args.contract.resolve(), args.asset_root.resolve())
        payload = json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2) + "\n"
        if args.output:
            args.output.write_text(payload, encoding="utf-8")
        else:
            sys.stdout.write(payload)
        return 0
    except ProviderError as exc:
        print(f"astrology DUT1 provider failed: {exc}", file=sys.stderr)
        return 1
    except (OSError, OverflowError, ValueError) as exc:
        print(f"astrology DUT1 provider failed: provider_internal_error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
