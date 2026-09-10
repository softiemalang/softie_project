"""Fixture-bound CSPICE-free Astrology preview function.

The endpoint is a small Vercel file-based Python Function.  It consumes only
the immutable DE405 fixture cases and the packaged BSP; it does not download
providers, call the old CSPICE packet contract, or generate interpretation.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import math
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PRODUCER_PATH = ROOT / "scripts" / "astrology-jplephem-producer.py"
FIXTURE_PATH = ROOT / "test" / "fixtures" / "astrology" / "provider-equivalence-v1.json"
BSP_PATH = ROOT / "api" / "provider" / "de405.bsp"
REQUEST_SCHEMA = "astrology-jplephem-preview-request-v1"
RESPONSE_SCHEMA = "astrology-jplephem-fact-handoff-v1"
PACKET_SCHEMA = "astrology-jplephem-fact-packet-v1"
PACKET_VERSION = "1.0.0"
MAX_REQUEST_BYTES = 64 * 1024
DAY_SECONDS = 86400.0
J2000 = 2451545.0
ARCSEC_TO_RAD = math.pi / (180.0 * 3600.0)
RAD_TO_DEG = 180.0 / math.pi
SIGN_BOUNDARY_THRESHOLD = 1.0 / 60.0
ORB_BOUNDARY_THRESHOLD = 1.0 / 60.0
MOTION_EPSILON = 1e-7
GEOGRAPHIC_POLE_EPSILON = 1e-10

ACTIVATION = {
    "availableForInterpretation": False,
    "integrationStatus": "not_connected",
    "serviceEligibility": "blocked",
    "reason": "interpretation_packet_not_activated",
}

BODY_ORDER = [
    "sun",
    "moon",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
    "pluto",
]
BODY_MAPPING = [
    {"id": "sun", "targetId": 10, "targetType": "body", "targetName": "SUN"},
    {"id": "moon", "targetId": 301, "targetType": "body", "targetName": "MOON"},
    {"id": "mercury", "targetId": 1, "targetType": "barycenter", "targetName": "MERCURY BARYCENTER"},
    {"id": "venus", "targetId": 2, "targetType": "barycenter", "targetName": "VENUS BARYCENTER"},
    {"id": "mars", "targetId": 4, "targetType": "barycenter", "targetName": "MARS BARYCENTER"},
    {"id": "jupiter", "targetId": 5, "targetType": "barycenter", "targetName": "JUPITER BARYCENTER"},
    {"id": "saturn", "targetId": 6, "targetType": "barycenter", "targetName": "SATURN BARYCENTER"},
    {"id": "uranus", "targetId": 7, "targetType": "barycenter", "targetName": "URANUS BARYCENTER"},
    {"id": "neptune", "targetId": 8, "targetType": "barycenter", "targetName": "NEPTUNE BARYCENTER"},
    {"id": "pluto", "targetId": 9, "targetType": "barycenter", "targetName": "PLUTO BARYCENTER"},
]
SIGNS = [
    "aries",
    "taurus",
    "gemini",
    "cancer",
    "leo",
    "virgo",
    "libra",
    "scorpio",
    "sagittarius",
    "capricorn",
    "aquarius",
    "pisces",
]
POINT_ORDER = BODY_ORDER + ["ascendant", "midheaven"]
ASPECTS = [
    {"id": "conjunction", "exactAngleDegrees": 0, "maxOrbDegrees": 8},
    {"id": "sextile", "exactAngleDegrees": 60, "maxOrbDegrees": 5},
    {"id": "square", "exactAngleDegrees": 90, "maxOrbDegrees": 7},
    {"id": "trine", "exactAngleDegrees": 120, "maxOrbDegrees": 7},
    {"id": "opposition", "exactAngleDegrees": 180, "maxOrbDegrees": 8},
]
SIGN_METADATA = {
    "aries": {"element": "fire", "modality": "cardinal", "polarity": "masculine", "traditionalRuler": "mars", "modernRuler": "mars"},
    "taurus": {"element": "earth", "modality": "fixed", "polarity": "feminine", "traditionalRuler": "venus", "modernRuler": "venus"},
    "gemini": {"element": "air", "modality": "mutable", "polarity": "masculine", "traditionalRuler": "mercury", "modernRuler": "mercury"},
    "cancer": {"element": "water", "modality": "cardinal", "polarity": "feminine", "traditionalRuler": "moon", "modernRuler": "moon"},
    "leo": {"element": "fire", "modality": "fixed", "polarity": "masculine", "traditionalRuler": "sun", "modernRuler": "sun"},
    "virgo": {"element": "earth", "modality": "mutable", "polarity": "feminine", "traditionalRuler": "mercury", "modernRuler": "mercury"},
    "libra": {"element": "air", "modality": "cardinal", "polarity": "masculine", "traditionalRuler": "venus", "modernRuler": "venus"},
    "scorpio": {"element": "water", "modality": "fixed", "polarity": "feminine", "traditionalRuler": "mars", "modernRuler": "pluto"},
    "sagittarius": {"element": "fire", "modality": "mutable", "polarity": "masculine", "traditionalRuler": "jupiter", "modernRuler": "jupiter"},
    "capricorn": {"element": "earth", "modality": "cardinal", "polarity": "feminine", "traditionalRuler": "saturn", "modernRuler": "saturn"},
    "aquarius": {"element": "air", "modality": "fixed", "polarity": "masculine", "traditionalRuler": "saturn", "modernRuler": "uranus"},
    "pisces": {"element": "water", "modality": "mutable", "polarity": "feminine", "traditionalRuler": "jupiter", "modernRuler": "neptune"},
}


class PreviewError(RuntimeError):
    """Expected input, dependency, provider, or integrity failure."""


_producer_module: Any = None
_producer_error: str | None = None


def _load_producer() -> Any:
    global _producer_module, _producer_error
    if _producer_module is not None:
        return _producer_module
    if _producer_error is not None:
        raise PreviewError(_producer_error)
    try:
        spec = importlib.util.spec_from_file_location("astrology_jplephem_producer", PRODUCER_PATH)
        if spec is None or spec.loader is None:
            raise RuntimeError("provider producer module cannot be loaded")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        _producer_module = module
        return module
    except Exception as error:  # pragma: no cover - dependency failure is exercised through the handler
        _producer_error = f"provider_dependency_unavailable:{type(error).__name__}"
        raise PreviewError(_producer_error) from error


def _finite(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    try:
        with path.open("rb") as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                digest.update(chunk)
    except OSError as error:
        raise PreviewError(f"provider_asset_unavailable:{path.name}") from error
    return digest.hexdigest()


def _stable_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False) + "\n"


def _sha256_value(value: Any) -> str:
    return hashlib.sha256(_stable_json(value).encode("utf-8")).hexdigest()


def _normalize_degrees(value: float) -> float:
    normalized = (value % 360.0 + 360.0) % 360.0
    return 0.0 if normalized == 0.0 else normalized


def _signed_degrees(value: float) -> float:
    normalized = _normalize_degrees(value)
    return normalized - 360.0 if normalized >= 180.0 else normalized


def _angular_distance(left: float, right: float) -> float:
    difference = abs(_normalize_degrees(left) - _normalize_degrees(right))
    return min(difference, 360.0 - difference)


def _multiply3(left: list[list[float]], right: list[list[float]]) -> list[list[float]]:
    return [
        [left[row][0] * right[0][column] + left[row][1] * right[1][column] + left[row][2] * right[2][column] for column in range(3)]
        for row in range(3)
    ]


def _add3(left: list[list[float]], right: list[list[float]]) -> list[list[float]]:
    return [[left[row][column] + right[row][column] for column in range(3)] for row in range(3)]


def _scale3(matrix: list[list[float]], scalar: float) -> list[list[float]]:
    return [[value * scalar for value in row] for row in matrix]


def _rx(angle: float) -> list[list[float]]:
    cosine = math.cos(angle)
    sine = math.sin(angle)
    return [[1.0, 0.0, 0.0], [0.0, cosine, sine], [0.0, -sine, cosine]]


def _drx(angle: float) -> list[list[float]]:
    cosine = math.cos(angle)
    sine = math.sin(angle)
    return [[0.0, 0.0, 0.0], [0.0, -sine, cosine], [0.0, -cosine, -sine]]


def _rz(angle: float) -> list[list[float]]:
    cosine = math.cos(angle)
    sine = math.sin(angle)
    return [[cosine, sine, 0.0], [-sine, cosine, 0.0], [0.0, 0.0, 1.0]]


def _drz(angle: float) -> list[list[float]]:
    cosine = math.cos(angle)
    sine = math.sin(angle)
    return [[-sine, cosine, 0.0], [-cosine, -sine, 0.0], [0.0, 0.0, 0.0]]


def _apply(matrix: list[list[float]], vector: list[float]) -> list[float]:
    return [row[0] * vector[0] + row[1] * vector[1] + row[2] * vector[2] for row in matrix]


def _polynomial(coefficients: list[float], value: float) -> float:
    result = 0.0
    for coefficient in reversed(coefficients):
        result = coefficient + value * result
    return result


def _polynomial_derivative(coefficients: list[float], value: float) -> float:
    result = 0.0
    for index in range(len(coefficients) - 1, 0, -1):
        result = index * coefficients[index] + value * result
    return result


def _mean_obliquity_radians(jd_tt: float) -> float:
    t = (jd_tt - J2000) / 36525.0
    arcseconds = _polynomial([84381.406, -46.836769, -0.0001831, 0.00200340, -0.000000576, -0.0000000434], t)
    return arcseconds * ARCSEC_TO_RAD


def _mean_obliquity_rate(jd_tt: float) -> float:
    t = (jd_tt - J2000) / 36525.0
    coefficients = [84381.406, -46.836769, -0.0001831, 0.00200340, -0.000000576, -0.0000000434]
    return _polynomial_derivative(coefficients, t) * ARCSEC_TO_RAD / (36525.0 * DAY_SECONDS)


def _precession_matrix(jd_tt: float) -> tuple[list[list[float]], list[list[float]]]:
    t = (jd_tt - J2000) / 36525.0
    gamb_coefficients = [-0.052928, 10.556378, 0.4932044, -0.00031238, -0.000002788, 0.0000000260]
    phib_coefficients = [84381.412819, -46.811016, 0.0511268, 0.00053289, -0.000000440, -0.0000000176]
    psib_coefficients = [-0.041775, 5038.481484, 1.5584175, -0.00018522, -0.000026452, -0.0000000148]
    gamb = _polynomial(gamb_coefficients, t) * ARCSEC_TO_RAD
    phib = _polynomial(phib_coefficients, t) * ARCSEC_TO_RAD
    psib = _polynomial(psib_coefficients, t) * ARCSEC_TO_RAD
    epsilon = _mean_obliquity_radians(jd_tt)
    century_seconds = 36525.0 * DAY_SECONDS
    rates = {
        "gamb": _polynomial_derivative(gamb_coefficients, t) * ARCSEC_TO_RAD / century_seconds,
        "phib": _polynomial_derivative(phib_coefficients, t) * ARCSEC_TO_RAD / century_seconds,
        "psib": _polynomial_derivative(psib_coefficients, t) * ARCSEC_TO_RAD / century_seconds,
        "epsa": _mean_obliquity_rate(jd_tt),
    }
    a = _rx(-phib)
    b = _rz(-psib)
    c = _rx(epsilon)
    d = _rz(gamb)
    da = _scale3(_drx(-phib), -rates["phib"])
    db = _scale3(_drz(-psib), -rates["psib"])
    dc = _scale3(_drx(epsilon), rates["epsa"])
    dd = _scale3(_drz(gamb), rates["gamb"])
    ab = _multiply3(a, b)
    abc = _multiply3(ab, c)
    matrix = _multiply3(abc, d)
    derivative = _add3(
        _add3(
            _add3(_multiply3(_multiply3(da, b), c), _multiply3(_multiply3(a, db), c)),
            _multiply3(_multiply3(a, b), dc),
        ),
        _multiply3(abc, dd),
    )
    return matrix, derivative


def _convert_state(state: list[float], jd_tt: float) -> dict[str, Any]:
    if len(state) != 6 or not all(_finite(value) for value in state):
        raise PreviewError("coordinate_transform_failed")
    matrix, derivative = _precession_matrix(jd_tt)
    position_equatorial = _apply(matrix, state[:3])
    frozen_velocity_equatorial = _apply(matrix, state[3:])
    moving_velocity_equatorial = [
        frozen_velocity_equatorial[index] + _apply(derivative, state[:3])[index] for index in range(3)
    ]
    epsilon = _mean_obliquity_radians(jd_tt)
    cosine = math.cos(epsilon)
    sine = math.sin(epsilon)

    def rotate(vector: list[float]) -> list[float]:
        return [vector[0], cosine * vector[1] + sine * vector[2], -sine * vector[1] + cosine * vector[2]]

    position = rotate(position_equatorial)
    frozen_velocity = rotate(frozen_velocity_equatorial)
    velocity = rotate(moving_velocity_equatorial)
    xy2 = position[0] ** 2 + position[1] ** 2
    if not xy2 > 0.0 or not _finite(xy2):
        raise PreviewError("coordinate_transform_failed")
    longitude = _normalize_degrees(math.atan2(position[1], position[0]) * RAD_TO_DEG)
    speed = ((position[0] * velocity[1] - position[1] * velocity[0]) / xy2) * RAD_TO_DEG * DAY_SECONDS
    frozen_speed = ((position[0] * frozen_velocity[1] - position[1] * frozen_velocity[0]) / xy2) * RAD_TO_DEG * DAY_SECONDS
    result = {
        "longitude": longitude,
        "speed": speed,
        "longitudeSpeedDegreesPerDay": speed,
        "frozenFrameSpeedDegreesPerDay": frozen_speed,
        "positionKm": position,
        "velocityKmPerSecond": velocity,
        "frozenFrameVelocityKmPerSecond": frozen_velocity,
    }
    if not all(_finite(value) for key, value in result.items() if key in {"longitude", "speed", "longitudeSpeedDegreesPerDay", "frozenFrameSpeedDegreesPerDay"}):
        raise PreviewError("coordinate_transform_failed")
    return result


def _compute_julian_date_utc(utc: dict[str, Any]) -> float:
    year, month, day = utc["year"], utc["month"], utc["day"]
    a = math.floor((14 - month) / 12)
    y = year + 4800 - a
    m = month + 12 * a - 3
    jdn = day + math.floor((153 * m + 2) / 5) + 365 * y + math.floor(y / 4) - math.floor(y / 100) + math.floor(y / 400) - 32045
    seconds = utc["hour"] * 3600 + utc["minute"] * 60 + utc["second"]
    return jdn - 0.5 + seconds / DAY_SECONDS


def _time_angles(item: dict[str, Any], location: dict[str, Any]) -> dict[str, float]:
    utc = item["utc"]
    jd_utc = _compute_julian_date_utc(utc)
    time_contract = _load_fixture()["time"]
    jd_ut1 = jd_utc + time_contract["ut1MinusUtcSeconds"] / DAY_SECONDS
    jd_tt = jd_utc + time_contract["ttMinusUtcSeconds"] / DAY_SECONDS
    if abs(jd_tt - item["jdTt"]) > 1e-12:
        raise PreviewError("fixture_time_mapping_mismatch")
    d_ut1 = jd_ut1 - J2000
    day_fraction = d_ut1 - math.floor(d_ut1)
    era_turns = (0.7790572732640 + day_fraction + 0.00273781191135448 * d_ut1) % 1.0
    era_degrees = _normalize_degrees(era_turns * 360.0)
    t = (jd_tt - J2000) / 36525.0
    epsilon_degrees = _polynomial([84381.406, -46.836769, -0.0001831, 0.00200340, -0.000000576, -0.0000000434], t) / 3600.0
    gmst_correction = (0.014506 + 4612.156534 * t + 1.3915817 * t**2 - 0.00000044 * t**3 - 0.000029956 * t**4 - 0.0000000368 * t**5) / 3600.0
    gmst = _normalize_degrees(era_degrees + gmst_correction)
    lmst = _normalize_degrees(gmst + location["longitudeDegreesEast"])
    theta = math.radians(lmst)
    epsilon = math.radians(epsilon_degrees)
    mc = _normalize_degrees(math.atan2(math.sin(theta), math.cos(theta) * math.cos(epsilon)) * RAD_TO_DEG)
    latitude = math.radians(location["latitudeDegrees"])
    if 90.0 - abs(location["latitudeDegrees"]) <= GEOGRAPHIC_POLE_EPSILON:
        raise PreviewError("ascendant_undefined_at_geographic_pole")
    asc_base = math.atan2(-math.cos(theta), math.sin(theta) * math.cos(epsilon) + math.tan(latitude) * math.sin(epsilon))
    asc = _normalize_degrees(asc_base * RAD_TO_DEG + 180.0)
    return {"ascendant": asc, "midheaven": mc, "jdUtc": jd_utc, "jdTt": jd_tt}


def _sign_placement(longitude: float, source_ref: str) -> dict[str, Any]:
    normalized = _normalize_degrees(longitude)
    sign_index = math.floor(normalized / 30.0) % 12
    degree = normalized % 30.0
    distance = min(degree, 30.0 - degree)
    return {
        "longitudeDegrees": normalized,
        "signId": SIGNS[sign_index],
        "signIndex": sign_index,
        "degreeInSign": degree,
        "boundaryStatus": "near_sign_boundary" if distance <= SIGN_BOUNDARY_THRESHOLD else "normal",
        "distanceToNearestBoundaryDegrees": distance,
        "thresholdDegrees": SIGN_BOUNDARY_THRESHOLD,
        "availability": "available",
        "epistemicStatus": "derived",
        "ruleId": "sign_from_ecliptic_longitude_v0",
        "ruleSetVersion": "mallang-astrology-rule-core-v0",
        "sourceRefs": [source_ref],
    }


def _motion(speed: float) -> dict[str, Any]:
    if speed > MOTION_EPSILON:
        state, retrograde = "direct", False
    elif speed < -MOTION_EPSILON:
        state, retrograde = "retrograde", True
    else:
        state, retrograde = "stationary", False
    return {
        "motionState": state,
        "retrograde": retrograde,
        "availability": "available",
        "sourceSpeedDegreesPerDay": speed,
        "ruleId": "motion_from_longitude_speed_v0",
    }


def _phase(point_a: str, point_b: str, aspect_id: str, lon_a: float, lon_b: float, speed_a: float | None, speed_b: float | None) -> dict[str, Any]:
    if point_a in {"ascendant", "midheaven"} or point_b in {"ascendant", "midheaven"}:
        return {"phase": "unavailable", "phaseReason": "angle_phase_not_supported_v0", "signedOffsetDegrees": None, "relativeSpeedDegreesPerDay": None, "phaseRuleId": "aspect_phase_from_relative_speed_v0"}
    if speed_a is None or speed_b is None:
        return {"phase": "unavailable", "phaseReason": "speed_unavailable", "signedOffsetDegrees": None, "relativeSpeedDegreesPerDay": None, "phaseRuleId": "aspect_phase_from_relative_speed_v0"}
    delta = _signed_degrees(lon_b - lon_a)
    targets = {"conjunction": [0], "sextile": [-60, 60], "square": [-90, 90], "trine": [-120, 120], "opposition": [-180, 180]}[aspect_id]
    best_target = targets[0]
    min_diff = abs(_signed_degrees(delta - best_target))
    for target in targets[1:]:
        difference = abs(_signed_degrees(delta - target))
        if difference < min_diff:
            min_diff, best_target = difference, target
    signed_offset = _signed_degrees(delta - best_target)
    relative_speed = speed_b - speed_a
    if abs(signed_offset) <= MOTION_EPSILON:
        phase = "exact"
    elif abs(relative_speed) <= MOTION_EPSILON:
        phase = "indeterminate"
    else:
        phase = "applying" if signed_offset * relative_speed < 0 else "separating"
    return {"phase": phase, "signedOffsetDegrees": signed_offset, "relativeSpeedDegreesPerDay": relative_speed, "phaseRuleId": "aspect_phase_from_relative_speed_v0"}


def _derive_aspects(points: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_id = {point["id"]: point for point in points if _finite(point.get("longitudeDegrees"))}
    output = []
    for first_index, point_a_id in enumerate(POINT_ORDER):
        point_a = by_id.get(point_a_id)
        if point_a is None:
            continue
        for point_b_id in POINT_ORDER[first_index + 1:]:
            point_b = by_id.get(point_b_id)
            if point_b is None or {point_a_id, point_b_id} == {"ascendant", "midheaven"}:
                continue
            distance = _angular_distance(point_a["longitudeDegrees"], point_b["longitudeDegrees"])
            matches = [(definition, abs(distance - definition["exactAngleDegrees"])) for definition in ASPECTS if abs(distance - definition["exactAngleDegrees"]) <= definition["maxOrbDegrees"]]
            if not matches:
                continue
            matches.sort(key=lambda item: (item[1], ASPECTS.index(item[0])))
            definition, orb = matches[0]
            record = {
                "id": f"{point_a_id}__{point_b_id}__{definition['id']}",
                "pointA": point_a_id,
                "pointB": point_b_id,
                "aspectId": definition["id"],
                "exactAngleDegrees": definition["exactAngleDegrees"],
                "angularDistanceDegrees": distance,
                "orbDegrees": orb,
                "maxOrbDegrees": definition["maxOrbDegrees"],
                "orbBoundaryStatus": "near_orb_boundary" if abs(definition["maxOrbDegrees"] - orb) <= ORB_BOUNDARY_THRESHOLD else "normal",
                "distanceToOrbBoundaryDegrees": abs(definition["maxOrbDegrees"] - orb),
                **_phase(point_a_id, point_b_id, definition["id"], point_a["longitudeDegrees"], point_b["longitudeDegrees"], point_a.get("speedDegreesPerDay"), point_b.get("speedDegreesPerDay")),
                "epistemicStatus": "derived",
                "ruleId": "major_aspect_v0",
            }
            output.append(record)
    return output


def _leaders(counts: dict[str, int], order: list[str]) -> dict[str, Any]:
    maximum = max((counts[key] for key in order), default=0)
    leaders = [] if maximum <= 0 else [key for key in order if counts[key] == maximum]
    return {"leaders": leaders, "tie": len(leaders) > 1}


def _distribution(bodies: list[dict[str, Any]]) -> dict[str, Any]:
    def aggregate(ids: list[str]) -> dict[str, Any]:
        by_id = {body["id"]: body for body in bodies}
        element_counts = {"fire": 0, "earth": 0, "air": 0, "water": 0}
        modality_counts = {"cardinal": 0, "fixed": 0, "mutable": 0}
        polarity_counts = {"masculine": 0, "feminine": 0}
        total = 0
        for body_id in ids:
            body = by_id.get(body_id)
            if body is None or body.get("signId") not in SIGN_METADATA:
                continue
            metadata = SIGN_METADATA[body["signId"]]
            element_counts[metadata["element"]] += 1
            modality_counts[metadata["modality"]] += 1
            polarity_counts[metadata["polarity"]] += 1
            total += 1
        return {
            "totalBodiesCount": total,
            "elements": {"counts": element_counts, **_leaders(element_counts, ["fire", "earth", "air", "water"])},
            "modalities": {"counts": modality_counts, **_leaders(modality_counts, ["cardinal", "fixed", "mutable"])},
            "polarities": {"counts": polarity_counts, **_leaders(polarity_counts, ["masculine", "feminine"])},
            "ruleId": "distribution_from_body_signs_v0",
        }

    return {"overall": aggregate(BODY_ORDER), "personal": aggregate(["sun", "moon", "mercury", "venus", "mars"]), "epistemicStatus": "derived", "ruleId": "distribution_from_body_signs_v0"}


def _derive_rule_chart(raw: dict[str, Any]) -> dict[str, Any]:
    body_placements = []
    for body in raw["bodies"]:
        placement = _sign_placement(body["longitudeDegrees"], f"bodies.{body['id']}.longitudeDegrees")
        placement.update({"id": body["id"], "longitudeDegrees": body["longitudeDegrees"], "longitudeSpeedDegreesPerDay": body["longitudeSpeedDegreesPerDay"]})
        placement.update(_motion(body["longitudeSpeedDegreesPerDay"]))
        placement["sourceRefs"] = [f"bodies.{body['id']}.longitudeDegrees", f"bodies.{body['id']}.longitudeSpeedDegreesPerDay"]
        body_placements.append(placement)

    angles = {}
    for angle_id in ["ascendant", "midheaven"]:
        angles[angle_id] = {"id": angle_id, **_sign_placement(raw["angles"][angle_id]["longitudeDegrees"], f"angles.{angle_id}.longitudeDegrees")}

    asc = angles["ascendant"]
    houses = {
        "availability": "available",
        "houseSystem": "whole_sign",
        "ascendantSignId": asc["signId"],
        "ascendantSignIndex": asc["signIndex"],
        "placements": [
            {"id": body["id"], "house": ((body["signIndex"] - asc["signIndex"] + 12) % 12) + 1, "houseSystem": "whole_sign", "availability": "available", "epistemicStatus": "derived", "ruleId": "whole_sign_house_v0"}
            for body in body_placements
        ],
        "ruleId": "whole_sign_house_v0",
    }
    ruler_metadata = SIGN_METADATA[asc["signId"]]
    chart_rulers = {"availability": "available", "ascendantSignId": asc["signId"], "traditionalChartRuler": ruler_metadata["traditionalRuler"], "modernChartRuler": ruler_metadata["modernRuler"], "epistemicStatus": "derived", "ruleId": "chart_ruler_from_ascendant_v0"}
    points = [{"id": body["id"], "longitudeDegrees": body["longitudeDegrees"], "speedDegreesPerDay": body["longitudeSpeedDegreesPerDay"]} for body in body_placements]
    points.extend({"id": angle_id, "longitudeDegrees": angles[angle_id]["longitudeDegrees"], "speedDegreesPerDay": None} for angle_id in ["ascendant", "midheaven"])
    return {
        "schemaVersion": "astrology-rule-chart-v0",
        "ruleSetVersion": "mallang-astrology-rule-core-v0",
        "candidateId": raw["candidateId"],
        "inputStatus": raw["inputStatus"],
        "verificationStatus": "verified",
        "epistemicStatus": "derived",
        "metadata": {"zodiac": "tropical", "referenceFrame": "geocentric", "coordinateBasis": "ecliptic-of-date", "houseSystem": "whole_sign"},
        "supportScope": {"supportedBodies": BODY_ORDER, "supportedHouseSystem": "whole_sign", "supportedAspects": ["conjunction", "sextile", "square", "trine", "opposition"]},
        "bodies": body_placements,
        "angles": angles,
        "unsupportedBodies": [],
        "houses": houses,
        "chartRulers": chart_rulers,
        "aspects": _derive_aspects(points),
        "distribution": _distribution(body_placements),
    }


def _load_fixture() -> dict[str, Any]:
    if not FIXTURE_PATH.is_file():
        raise PreviewError("fixture_missing")
    try:
        fixture_bytes = FIXTURE_PATH.read_bytes()
        fixture = json.loads(fixture_bytes.decode("utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise PreviewError("fixture_unreadable") from error
    producer = _load_producer()
    if _sha256_file(FIXTURE_PATH) != producer.EXPECTED_FIXTURE_SHA256:
        raise PreviewError("fixture_sha_mismatch")
    producer.validate_fixture(FIXTURE_PATH, fixture)
    return fixture


def _validate_request(payload: Any, fixture: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    if not isinstance(payload, dict) or isinstance(payload, list):
        raise PreviewError("request_not_object")
    expected_keys = {"schemaVersion", "fixtureId", "fixtureCaseId", "locationId", "utc"}
    if set(payload) != expected_keys:
        raise PreviewError("request_fields_mismatch")
    if payload["schemaVersion"] != REQUEST_SCHEMA:
        raise PreviewError("request_schema_mismatch")
    if payload["fixtureId"] != fixture["fixtureId"]:
        raise PreviewError("fixture_identity_mismatch")
    item = next((candidate for candidate in fixture["fixtures"] if candidate.get("id") == payload["fixtureCaseId"]), None)
    if item is None:
        raise PreviewError("fixture_case_unsupported")
    if payload["utc"] != item["utc"]:
        raise PreviewError("utc_not_equal_to_verified_fixture")
    location = next((candidate for candidate in fixture["locations"] if candidate.get("id") == payload["locationId"]), None)
    if location is None:
        raise PreviewError("location_unsupported")
    if not _finite(location.get("latitudeDegrees")) or not _finite(location.get("longitudeDegreesEast")):
        raise PreviewError("location_coordinates_invalid")
    return item, location


def _evaluate_states(item: dict[str, Any], fixture: dict[str, Any]) -> list[dict[str, Any]]:
    producer = _load_producer()
    if not BSP_PATH.is_file():
        raise PreviewError("de405_bsp_missing")
    if BSP_PATH.stat().st_size != producer.EXPECTED_KERNEL_BYTES:
        raise PreviewError("de405_bsp_size_mismatch")
    kernel_sha = _sha256_file(BSP_PATH)
    if kernel_sha != producer.EXPECTED_KERNEL_SHA256:
        raise PreviewError("de405_bsp_sha_mismatch")
    python_version, jplephem_version, numpy_version = producer.validate_runtime()
    if not hasattr(producer, "SPK"):
        raise PreviewError("jplephem_provider_missing")
    try:
        kernel = producer.SPK.open(str(BSP_PATH))
    except Exception as error:
        raise PreviewError("de405_bsp_open_failed") from error
    rows = []
    for mapping in BODY_MAPPING:
        state = producer.relative_to_earth(kernel, mapping["targetId"], float(item["jdTdb"]))
        if not isinstance(state, list) or len(state) != 6 or not all(_finite(value) for value in state):
            raise PreviewError(f"state_unavailable:{mapping['id']}")
        rows.append({"mapping": mapping, "state": state, "pythonVersion": python_version, "jplephemVersion": jplephem_version, "numpyVersion": numpy_version, "kernelSha256": kernel_sha})
    return rows


def _build_preview(payload: Any) -> dict[str, Any]:
    fixture = _load_fixture()
    item, location = _validate_request(payload, fixture)
    rows = _evaluate_states(item, fixture)
    time = _time_angles(item, location)
    raw_bodies = []
    provider_info = {"id": "jplephem", "implementation": "direct_spk", "version": rows[0]["jplephemVersion"], "numpyVersion": rows[0]["numpyVersion"], "pythonVersion": rows[0]["pythonVersion"], "license": "MIT"}
    for row in rows:
        converted = _convert_state(row["state"], time["jdTt"])
        raw_bodies.append({"id": row["mapping"]["id"], "longitudeDegrees": converted["longitude"], "longitudeSpeedDegreesPerDay": converted["speed"], "state": converted})
    raw = {
        "schemaVersion": "astrology-raw-chart-v1",
        "availability": "available",
        "candidateId": f"{item['id']}:{location['id']}",
        "inputStatus": "fixture_validated_preview",
        "verificationStatus": "verified",
        "availableForInterpretation": False,
        "integrationStatus": "not_connected",
        "zodiac": "tropical",
        "referenceFrame": "geocentric",
        "coordinateBasis": "ecliptic-of-date",
        "geometry": "geometric",
        "bodies": raw_bodies,
        "angles": {"ascendant": {"longitudeDegrees": time["ascendant"]}, "midheaven": {"longitudeDegrees": time["midheaven"]}},
        "provenance": {
            "timeAngleCore": {"schemaVersion": "astrology-time-angle-result-v0", "ruleSetVersion": "mallang-time-angle-core-v0", "modelId": "iau2000-era__iau2006-gmst-mean-obliquity"},
            "ephemerisTime": {"inputScale": "TT", "suppliedTdbMinusTtSeconds": item["tdbMinusTtSeconds"], "etSeconds": item["et"], "model": "explicit_offset_v0"},
            "de405": {"evaluator": "jplephem-2.24-direct-spk", "source": "official_unmodified_naif_de405_bsp", "kernelSha256": rows[0]["kernelSha256"], "coverage": {"coverageStartEt": fixture["kernel"]["coverage"]["startEt"], "coverageEndEt": fixture["kernel"]["coverage"]["endEt"]}, "observerId": 399, "observer": "EARTH", "frame": "J2000", "aberrationCorrection": "NONE", "units": {"position": "km", "velocity": "km/s"}, "bodyMapping": BODY_MAPPING},
            "transform": {"model": "iau2006_fukushima_williams_precession_plus_mean_obliquity", "input": "J2000/ICRF_mean_equator", "output": "mean_ecliptic_and_equinox_of_date", "speed": "analytic_moving_date_frame_derivative", "frozenFrameDiagnostic": "frozen_frame_xy_angular_rate_only"},
        },
    }
    rule = _derive_rule_chart(raw)
    source_refs = [
        "input.utc",
        "input.locationId",
        f"fixture.fixtures.{item['id']}",
        f"fixture.locations.{location['id']}",
        "provider.de405.bsp",
        "provider.jplephem",
        "rawChart.provenance.timeAngleCore",
        "rawChart.provenance.ephemerisTime",
        "rawChart.provenance.transform",
        "ruleChart.ruleSetVersion",
    ]
    packet = {
        "schemaVersion": PACKET_SCHEMA,
        "packetVersion": PACKET_VERSION,
        "packetStatus": "complete",
        "usableForFactConsumption": True,
        "availableForInterpretation": False,
        "activation": dict(ACTIVATION),
        "input": {"schemaVersion": REQUEST_SCHEMA, "fixtureId": fixture["fixtureId"], "fixtureCaseId": item["id"], "utc": item["utc"], "locationId": location["id"], "location": {"latitudeDegrees": location["latitudeDegrees"], "longitudeDegreesEast": location["longitudeDegreesEast"]}, "timeScale": "TDB", "observerId": 399, "frame": "J2000/ICRF", "aberrationCorrection": "NONE"},
        "provider": {**provider_info, "sourceUrl": fixture["kernel"]["sourceUrl"], "sourceSha256": rows[0]["kernelSha256"], "sourceBytes": fixture["kernel"]["bytes"], "sourceIdentity": fixture["kernel"]["identity"], "coverage": fixture["kernel"]["coverage"]},
        "rawChart": raw,
        "ruleChart": rule,
        "unsupportedFeatures": [{"feature": "true_node", "status": "unsupported", "reason": "not_calculated_by_current_verified_technical_scope"}, {"feature": "chiron_lilith_asteroids_fixed_stars_arabic_parts_vertex", "status": "unsupported", "reason": "not_calculated_by_current_verified_technical_scope"}],
        "blockedFeatures": [{"feature": "interpretation_service_activation", "status": "blocked", "reason": ACTIVATION["reason"]}],
        "epistemicBoundary": {"raw": "calculated_fact", "derived": "deterministically_derived_fact", "unsupported": "not_a_fact", "activation": "service_not_connected"},
        "provenance": {"sourceRefs": source_refs, "fixtureSha256": _sha256_file(FIXTURE_PATH), "providerSha256": rows[0]["kernelSha256"], "rawChartSha256": _sha256_value(raw), "ruleChartSha256": _sha256_value(rule), "claimSourceRefs": {"bodyLongitudes": "rawChart.bodies[*].longitudeDegrees", "bodyMotion": "rawChart.bodies[*].longitudeSpeedDegreesPerDay", "angles": "rawChart.angles", "houses": "ruleChart.houses", "aspects": "ruleChart.aspects", "distribution": "ruleChart.distribution", "chartRulers": "ruleChart.chartRulers"}},
        "consumption": {"allowed": ["use included raw and derived FACT values", "retain provider/source identity and sourceRefs", "describe unsupported or blocked state as stated"], "requiresUserContext": True, "forbidden": ["invent missing calculations", "replace jplephem with another provider", "infer personality, fate, prediction, or personal certainty", "merge with another lineage or source", "promote interpretation activation"]},
    }
    packet["packetContentSha256"] = _sha256_value(packet)
    handoff = {
        "schemaVersion": RESPONSE_SCHEMA,
        "handoffVersion": PACKET_VERSION,
        "handoffStatus": "complete",
        "usable": True,
        "activation": dict(ACTIVATION),
        "sourcePacket": {"schemaVersion": packet["schemaVersion"], "packetVersion": packet["packetVersion"], "packetContentSha256": packet["packetContentSha256"]},
        "facts": {"raw": raw, "derived": rule},
        "unsupportedFeatures": packet["unsupportedFeatures"],
        "blockedFeatures": packet["blockedFeatures"],
        "provenance": {"sourceRefs": source_refs, "fixtureSha256": packet["provenance"]["fixtureSha256"], "providerSha256": packet["provenance"]["providerSha256"], "rawChartSha256": packet["provenance"]["rawChartSha256"], "ruleChartSha256": packet["provenance"]["ruleChartSha256"]},
        "deliveryPolicy": {"relationSemantics": "structural_fact_reference_only", "noInterpretationText": True, "noPromptTemplate": True, "noLlmCall": True, "noActivation": True, "forbiddenUsages": packet["consumption"]["forbidden"]},
    }
    handoff["handoffContentSha256"] = _sha256_value(handoff)
    response = {"schemaVersion": RESPONSE_SCHEMA, "responseVersion": PACKET_VERSION, "status": "complete", "packet": packet, "factOnlyHandoff": handoff}
    response["responseContentSha256"] = _sha256_value(response)
    return response


def build_preview(payload: Any) -> dict[str, Any]:
    """Public pure entrypoint used by the HTTP handler and conformance tests."""

    return _build_preview(payload)


def _blocked_response(reason: str) -> dict[str, Any]:
    return {"schemaVersion": RESPONSE_SCHEMA, "responseVersion": PACKET_VERSION, "status": "blocked", "reason": reason, "activation": dict(ACTIVATION), "unsupportedFeatures": [], "blockedFeatures": [{"feature": "astrology_jplephem_preview_producer", "status": "blocked", "reason": reason}]}


def verify_preview_response(response: Any) -> list[str]:
    """Verify a materialized preview file without opening the provider asset."""

    errors: list[str] = []

    def require(condition: bool, code: str) -> None:
        if not condition and code not in errors:
            errors.append(code)

    require(isinstance(response, dict), "response_not_object")
    if not isinstance(response, dict):
        return errors
    require(response.get("schemaVersion") == RESPONSE_SCHEMA, "response_schema_mismatch")
    require(response.get("responseVersion") == PACKET_VERSION, "response_version_mismatch")
    require(response.get("status") == "complete", "response_not_complete")
    response_copy = dict(response)
    response_hash = response_copy.pop("responseContentSha256", None)
    require(isinstance(response_hash, str) and response_hash == _sha256_value(response_copy), "response_content_hash_mismatch")

    packet = response.get("packet")
    handoff = response.get("factOnlyHandoff")
    require(isinstance(packet, dict), "packet_missing")
    require(isinstance(handoff, dict), "handoff_missing")
    if not isinstance(packet, dict) or not isinstance(handoff, dict):
        return errors
    require(packet.get("schemaVersion") == PACKET_SCHEMA, "packet_schema_mismatch")
    require(packet.get("packetVersion") == PACKET_VERSION, "packet_version_mismatch")
    require(packet.get("packetStatus") == "complete" and packet.get("usableForFactConsumption") is True, "packet_status_invalid")
    require(packet.get("availableForInterpretation") is False and packet.get("activation") == ACTIVATION, "packet_activation_mismatch")
    require(handoff.get("schemaVersion") == RESPONSE_SCHEMA and handoff.get("handoffVersion") == PACKET_VERSION, "handoff_schema_mismatch")
    require(handoff.get("handoffStatus") == "complete" and handoff.get("usable") is True, "handoff_status_invalid")
    require(handoff.get("activation") == ACTIVATION, "handoff_activation_mismatch")

    packet_copy = dict(packet)
    packet_hash = packet_copy.pop("packetContentSha256", None)
    require(isinstance(packet_hash, str) and packet_hash == _sha256_value(packet_copy), "packet_content_hash_mismatch")
    handoff_copy = dict(handoff)
    handoff_hash = handoff_copy.pop("handoffContentSha256", None)
    require(isinstance(handoff_hash, str) and handoff_hash == _sha256_value(handoff_copy), "handoff_content_hash_mismatch")
    require(handoff.get("sourcePacket") == {"schemaVersion": packet.get("schemaVersion"), "packetVersion": packet.get("packetVersion"), "packetContentSha256": packet_hash}, "handoff_packet_link_invalid")
    require(handoff.get("facts", {}).get("raw") == packet.get("rawChart") and handoff.get("facts", {}).get("derived") == packet.get("ruleChart"), "handoff_fact_projection_mismatch")

    provider = packet.get("provider")
    require(isinstance(provider, dict), "provider_missing")
    if isinstance(provider, dict):
        for key, expected in {"id": "jplephem", "implementation": "direct_spk", "version": "2.24", "numpyVersion": "2.5.3", "pythonVersion": "3.14.7", "sourceSha256": "30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89", "sourceBytes": 10898432, "sourceIdentity": "unmodified_official_naif_de405_bsp"}.items():
            require(provider.get(key) == expected, f"provider_{key}_mismatch")
    raw = packet.get("rawChart")
    rule = packet.get("ruleChart")
    require(isinstance(raw, dict) and raw.get("schemaVersion") == "astrology-raw-chart-v1" and raw.get("availability") == "available" and raw.get("verificationStatus") == "verified", "raw_chart_invalid")
    require(isinstance(rule, dict) and rule.get("schemaVersion") == "astrology-rule-chart-v0" and rule.get("verificationStatus") == "verified" and rule.get("epistemicStatus") == "derived", "rule_chart_invalid")
    if isinstance(raw, dict):
        require(raw.get("availableForInterpretation") is False and raw.get("integrationStatus") == "not_connected", "raw_activation_mismatch")
        bodies = raw.get("bodies")
        require(isinstance(bodies, list) and [body.get("id") for body in bodies] == BODY_ORDER, "raw_body_inventory_invalid")
        if isinstance(bodies, list):
            require(all(_finite(body.get("longitudeDegrees")) and _finite(body.get("longitudeSpeedDegreesPerDay")) for body in bodies), "raw_body_values_invalid")
        require(raw.get("provenance", {}).get("de405", {}).get("evaluator") == "jplephem-2.24-direct-spk", "raw_provider_provenance_invalid")
    if isinstance(rule, dict):
        require(rule.get("metadata", {}).get("houseSystem") == "whole_sign", "rule_house_system_invalid")
        require(len(rule.get("bodies", [])) == len(BODY_ORDER), "rule_body_inventory_invalid")
    require(isinstance(packet.get("provenance", {}).get("sourceRefs"), list) and packet["provenance"]["sourceRefs"], "packet_source_refs_missing")
    require(isinstance(packet.get("unsupportedFeatures"), list) and all(item.get("status") == "unsupported" for item in packet["unsupportedFeatures"]), "unsupported_boundary_invalid")
    require(isinstance(packet.get("blockedFeatures"), list) and all(item.get("status") == "blocked" for item in packet["blockedFeatures"]), "blocked_boundary_invalid")
    return sorted(errors)


class handler(BaseHTTPRequestHandler):
    """Vercel file-based Python Function handler."""

    def _write_json(self, status: int, value: dict[str, Any]) -> None:
        body = _stable_json(value).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self) -> None:  # noqa: N802 - required BaseHTTPRequestHandler API
        content_type = (self.headers.get("Content-Type") or "").split(";", 1)[0].strip().lower()
        if content_type != "application/json":
            self._write_json(415, _blocked_response("content_type_must_be_application_json"))
            return
        try:
            content_length = int(self.headers.get("Content-Length", "-1"))
        except ValueError:
            content_length = -1
        if content_length < 0 or content_length > MAX_REQUEST_BYTES:
            self._write_json(413, _blocked_response("request_body_too_large_or_length_missing"))
            return
        try:
            raw_body = self.rfile.read(content_length)
            if len(raw_body) != content_length:
                raise PreviewError("request_body_incomplete")
            payload = json.loads(raw_body.decode("utf-8"))
            result = build_preview(payload)
            self._write_json(200, result)
        except (PreviewError, UnicodeDecodeError, json.JSONDecodeError) as error:
            self._write_json(422, _blocked_response(str(error)))
        except Exception:
            self._write_json(500, _blocked_response("producer_internal_failure"))

    def do_GET(self) -> None:  # noqa: N802 - required BaseHTTPRequestHandler API
        self._write_json(405, _blocked_response("post_required"))

    def do_HEAD(self) -> None:  # noqa: N802 - required BaseHTTPRequestHandler API
        self.send_response(405)
        self.send_header("Allow", "POST")
        self.end_headers()

    def log_message(self, _format: str, *_args: Any) -> None:
        return


if __name__ == "__main__":
    # This mode is only a local smoke entrypoint; Vercel loads ``handler``.
    if len(sys.argv) == 3 and sys.argv[1] == "--check":
        response_path = Path(sys.argv[2])
        try:
            response = json.loads(response_path.read_text(encoding="utf-8"))
            errors = verify_preview_response(response)
        except (OSError, UnicodeError, json.JSONDecodeError):
            errors = ["response_unreadable"]
        print(_stable_json({"status": "pass" if not errors else "fail", "errors": errors}), end="")
        raise SystemExit(0 if not errors else 1)
    if len(sys.argv) != 2:
        raise SystemExit("usage: astrology.py REQUEST.json | astrology.py --check RESPONSE.json")
    request_path = Path(sys.argv[1])
    request = json.loads(request_path.read_text(encoding="utf-8"))
    print(_stable_json(build_preview(request)), end="")
