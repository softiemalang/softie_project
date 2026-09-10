"""CSPICE-free Astrology technical FACT function.

The endpoint is a small Vercel file-based Python Function.  It retains the
fixture request as a comparison surface and also accepts the strict Korea-only
local-civil-time input contract for the already verified offline time-scale
bundle.  It does not download providers, call the old CSPICE packet contract,
or generate interpretation.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import math
import re
import sys
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[1]
PRODUCER_PATH = ROOT / "api" / "provider" / "astrology-jplephem-producer.py"
TIME_SCALE_PROVIDER_PATH = ROOT / "api" / "provider" / "astrology_time_scale_provider.py"
FIXTURE_PATH = ROOT / "api" / "provider" / "provider-equivalence-v1.json"
BSP_PATH = ROOT / "api" / "provider" / "de405.bsp"
RELEASE_CONTRACT_PATH = ROOT / "api" / "provider" / "de405-only-release-contract-v1.json"
NOTICE_PATH = ROOT / "api" / "provider" / "NOTICE.md"
INPUT_CONTRACT_PATH = ROOT / "api" / "provider" / "astrology-user-input-contract-v1.json"
TIMEZONE_ASSET_PATH = ROOT / "api" / "provider" / "asia-seoul.tzif"
LOCATION_SOURCE_PATH = ROOT / "src" / "interpretationPrep" / "koreaAdministrativeLocations.js"
REQUEST_SCHEMA = "astrology-jplephem-preview-request-v1"
USER_INPUT_REQUEST_SCHEMA = "astrology-jplephem-user-input-request-v1"
USER_INPUT_RESPONSE_SCHEMA = "astrology-jplephem-user-input-handoff-v1"
CANONICAL_INPUT_SCHEMA = "astrology-canonical-astronomy-input-v1"
RESPONSE_SCHEMA = "astrology-jplephem-fact-handoff-v1"
PACKET_SCHEMA = "astrology-jplephem-fact-packet-v1"
PACKET_VERSION = "1.0.0"
USER_INPUT_VERSION = "1.0.0"
TIME_SCALE_SCHEMA = "astrology-verified-time-scales-v1"
EXPECTED_RELEASE_CONTRACT_SHA256 = "7a83e01e8ef24eefb4124d5021711ae8392ee6c40b4e2986fed543081c68209f"
EXPECTED_NOTICE_SHA256 = "b9f19cbceebb8ab4f42e48f08542d15f01b0118d71740d816753a89ea3086d5a"
EXPECTED_NOTICE_BYTES = 3781
EXPECTED_DE405_SHA256 = "30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89"
EXPECTED_DE405_BYTES = 10898432
EXPECTED_INPUT_CONTRACT_SHA256 = "1375c906e25b4dc1bf442c2628ffee1fa615165f9aba8126dc9ed159c3671976"
EXPECTED_TIME_SCALE_BUNDLE_CANONICAL_SHA256 = "eec8801b2c7b4a0c002a3bf24a76714f60c2c334c5ea63113c37a24ef6f6cf2b"
EXPECTED_DISCRETE_BOUNDARY_CONTRACT_CANONICAL_SHA256 = "a8451af3e48b2183c21d90ded20e2dcde6fd968f4e5fc6a45fce4ba353bae014"
EXPECTED_TIMEZONE_ASSET_SHA256 = "2c8f4bb15dd77090b497e2a841ff3323ecbbae4f9dbb9edead2f8dd8fb5d8bb4"
EXPECTED_TIMEZONE_ASSET_BYTES = 617
EXPECTED_LOCATION_SOURCE_SHA256 = "35dfca5a7b6a9e8dcf247a25e6a2e8da30fac0726b8f57fb0726c6d24aff4964"
EXPECTED_LOCATION_COORDINATE_SOURCE_SHA256 = "e612605e957e71ea2770876331eb20965820590bc57e5a98a91bc9307a678ec9"
EXPECTED_LOCATION_ROW_COUNT = 252
MAX_REQUEST_BYTES = 64 * 1024
DAY_SECONDS = 86400.0
J2000 = 2451545.0
ARCSEC_TO_RAD = math.pi / (180.0 * 3600.0)
RAD_TO_DEG = 180.0 / math.pi
SIGN_BOUNDARY_THRESHOLD = 1.0 / 60.0
ORB_BOUNDARY_THRESHOLD = 1.0 / 60.0
MOTION_EPSILON = 1e-7
GEOGRAPHIC_POLE_EPSILON = 1e-10
LOCAL_DATETIME_KEYS = {"year", "month", "day", "hour", "minute", "second"}
USER_INPUT_KEYS = {"localDateTime", "locationId", "fold"}
LOCATION_ROW_PATTERN = re.compile(r'^\s*"(?P<row>\d{5}\|[^"\n]+)"\s*,?\s*$', re.MULTILINE)

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
_time_scale_provider_module: Any = None
_time_scale_provider_error: str | None = None


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


def _load_time_scale_provider() -> Any:
    global _time_scale_provider_module, _time_scale_provider_error
    if _time_scale_provider_module is not None:
        return _time_scale_provider_module
    if _time_scale_provider_error is not None:
        raise PreviewError(_time_scale_provider_error)
    try:
        spec = importlib.util.spec_from_file_location("astrology_time_scale_provider", TIME_SCALE_PROVIDER_PATH)
        if spec is None or spec.loader is None:
            raise RuntimeError("time-scale provider module cannot be loaded")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        _time_scale_provider_module = module
        return module
    except Exception as error:  # pragma: no cover - dependency failure is exercised through the handler
        _time_scale_provider_error = f"time_scale_provider_unavailable:{type(error).__name__}"
        raise PreviewError(_time_scale_provider_error) from error


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


def _load_de405_release_contract() -> dict[str, Any]:
    if not RELEASE_CONTRACT_PATH.is_file() or not NOTICE_PATH.is_file():
        raise PreviewError("de405_release_contract_missing")
    if _sha256_file(RELEASE_CONTRACT_PATH) != EXPECTED_RELEASE_CONTRACT_SHA256:
        raise PreviewError("de405_release_contract_sha_mismatch")
    try:
        contract = json.loads(RELEASE_CONTRACT_PATH.read_text(encoding="utf-8"))
        notice = NOTICE_PATH.read_text(encoding="utf-8")
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise PreviewError("de405_release_contract_unreadable") from error
    if not isinstance(contract, dict) or contract.get("schemaVersion") != "astrology-de405-only-release-contract-v1":
        raise PreviewError("de405_release_contract_schema_mismatch")
    if contract.get("contractVersion") != "1.0.0" or contract.get("scope") != "cspice_free_function_bundle_with_unmodified_de405_kernel":
        raise PreviewError("de405_release_contract_version_mismatch")
    if contract.get("publicReleaseAllowed") is not True or contract.get("releaseStatus") != "allowed_for_unmodified_naif_kernel_scope":
        raise PreviewError("de405_public_release_gate_closed")
    if contract.get("provider") != {
        "id": "jplephem-2.24-direct-spk",
        "jplephemVersion": "2.24",
        "numpyVersion": "2.5.3",
        "implementation": "direct_spk",
        "cspiceIncluded": False,
        "spiceToolkitIncluded": False,
    }:
        raise PreviewError("de405_release_provider_mismatch")
    if contract.get("runtimeCompatibility") != {
        "python": {
            "implementation": "cpython",
            "versionSeries": "3.14.x",
            "abiTag": "cpython-314",
            "referenceVersion": "3.14.7",
            "exactVersionEqualityRequired": False,
        },
        "dependencies": {"jplephem": "2.24", "numpy": "2.5.3"},
        "verification": {
            "importsRequired": ["jplephem.spk", "numpy"],
            "patchVersionRecordedInPacket": True,
            "patchVersionUsedAsAcceptanceGate": False,
            "abiValidation": "sys.implementation.name_and_cache_tag",
        },
    }:
        raise PreviewError("de405_runtime_compatibility_mismatch")
    source = contract.get("source")
    if not isinstance(source, dict) or source.get("sha256") != EXPECTED_DE405_SHA256 or source.get("bytes") != EXPECTED_DE405_BYTES or source.get("identity") != "unmodified_official_naif_de405_bsp" or source.get("embeddedCommentsRetained") is not True:
        raise PreviewError("de405_release_source_mismatch")
    notice = contract.get("notice")
    if not isinstance(notice, dict) or notice.get("path") != "api/provider/NOTICE.md" or notice.get("sha256") != EXPECTED_NOTICE_SHA256 or notice.get("bytes") != EXPECTED_NOTICE_BYTES or notice.get("containsNaifSourceAndCredit") is not True:
        raise PreviewError("de405_release_notice_mismatch")
    if _sha256_file(NOTICE_PATH) != EXPECTED_NOTICE_SHA256 or NOTICE_PATH.stat().st_size != EXPECTED_NOTICE_BYTES:
        raise PreviewError("de405_notice_integrity_mismatch")
    for marker in ("de405.bsp", EXPECTED_DE405_SHA256, "NAIF rules", "NAIF credit guidance", "does not include CSPICE"):
        if marker not in NOTICE_PATH.read_text(encoding="utf-8"):
            raise PreviewError("de405_notice_content_mismatch")
    if contract.get("basis", {}).get("naifKernelRedistribution", {}).get("status") != "permitted_when_unmodified":
        raise PreviewError("de405_release_basis_mismatch")
    if contract.get("basis", {}).get("cspiceToolkitRedistribution", {}).get("status") != "not_applicable" or contract.get("basis", {}).get("cspiceDerivedExportDesignation", {}).get("status") != "not_in_scope":
        raise PreviewError("de405_release_cspice_boundary_mismatch")
    boundaries = contract.get("boundaries", {})
    if boundaries.get("onlyUnmodifiedDe405Kernel") is not True or boundaries.get("noCspiceProductionDependency") is not True or boundaries.get("noRuntimeProviderDownload") is not True or boundaries.get("interpretationActivation") is not False:
        raise PreviewError("de405_release_boundary_mismatch")
    for path in NOTICE_PATH.parent.iterdir():
        if path.is_file() and (path.suffix.lower() in {".a", ".so", ".dylib", ".dll", ".elf"} or "cspice" in path.name.lower() or "toolkit" in path.name.lower()):
            raise PreviewError("de405_release_forbidden_provider_asset")
    return contract


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


def _time_angles_from_values(utc: dict[str, Any], location: dict[str, Any], jd_ut1: float, jd_tt: float, *, expected_jd_tt: float | None = None) -> dict[str, float]:
    jd_utc = _compute_julian_date_utc(utc)
    if not _finite(jd_ut1) or not _finite(jd_tt):
        raise PreviewError("time_scale_values_invalid")
    if expected_jd_tt is not None and abs(jd_tt - expected_jd_tt) > 1e-12:
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


def _time_angles(item: dict[str, Any], location: dict[str, Any]) -> dict[str, float]:
    time_contract = _load_fixture()["time"]
    jd_utc = _compute_julian_date_utc(item["utc"])
    jd_ut1 = jd_utc + time_contract["ut1MinusUtcSeconds"] / DAY_SECONDS
    jd_tt = jd_utc + time_contract["ttMinusUtcSeconds"] / DAY_SECONDS
    return _time_angles_from_values(item["utc"], location, jd_ut1, jd_tt, expected_jd_tt=item["jdTt"])


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


def _boundary_assessment(rule: dict[str, Any], time_scales: dict[str, Any], provider_identity: str) -> dict[str, Any]:
    """Record the frozen boundary decision without inventing final intervals.

    The source-relative packet may carry central Rule Core values.  The
    existing boundary contract requires an independently materialized final
    observable interval before a discrete result can be called confirmed, so
    this producer reports interval-backed assessment as indeterminate and
    preserves the central near-boundary markers already emitted by Rule Core.
    """

    reasons: list[str] = []

    def point_result(point: dict[str, Any], kind: str) -> dict[str, Any]:
        central_status = point.get("boundaryStatus")
        reason = "sign_interval_crosses_or_approaches_boundary" if central_status == "near_sign_boundary" else "uncertainty_interval_missing"
        reasons.append(reason)
        return {"status": "indeterminate", "reason": reason, "centralBoundaryStatus": central_status, "sourceRefs": [f"ruleChart.{kind}"]}

    points: dict[str, Any] = {}
    for body in rule.get("bodies", []):
        body_id = body.get("id")
        points[body_id] = {
            "sign": point_result(body, f"bodies.{body_id}.sign"),
            "motion": {"status": "indeterminate", "reason": "uncertainty_interval_missing", "centralMotionState": body.get("motionState"), "sourceRefs": [f"ruleChart.bodies.{body_id}.motion"]},
        }
        reasons.append("uncertainty_interval_missing")
    for angle_id in ("ascendant", "midheaven"):
        angle = rule.get("angles", {}).get(angle_id, {})
        points[angle_id] = {"sign": point_result(angle, f"angles.{angle_id}.sign")}

    aspects = []
    for aspect in rule.get("aspects", []):
        reason = "aspect_interval_overlaps_or_approaches_orb_boundary" if aspect.get("orbBoundaryStatus") == "near_orb_boundary" else "uncertainty_interval_missing"
        reasons.append(reason)
        aspects.append({
            "key": f"{aspect.get('pointA')}__{aspect.get('pointB')}",
            "status": "indeterminate",
            "reason": reason,
            "centralAspectId": aspect.get("aspectId"),
            "centralOrbBoundaryStatus": aspect.get("orbBoundaryStatus"),
            "sourceRefs": [f"ruleChart.aspects.{aspect.get('id') or 'unknown'}"],
        })

    composition = {}
    for name in ("wholeSignHouses", "chartRulers", "distribution"):
        composition[name] = {"status": "indeterminate", "reason": "uncertainty_interval_missing", "sourceRefs": [f"ruleChart.{name}"]}
        reasons.append("uncertainty_interval_missing")

    return {
        "schemaVersion": "astrology-discrete-fact-boundary-v1",
        "contractVersion": "1.0.0",
        "factFrame": {"mode": "source_relative_deterministic", "physicalTruthGuarantee": False, "universalAbsoluteBoundRequired": False},
        "status": "indeterminate",
        "mode": "central_rule_output_without_final_observable_interval",
        "intervalBacked": {"status": "blocked", "reason": "uncertainty_interval_missing", "finalObservableIntervalSupplied": False},
        "ruleSetVersion": "mallang-astrology-rule-core-v0",
        "source": {
            "timeScaleBundleSchemaVersion": TIME_SCALE_SCHEMA,
            "timeScaleBundleCanonicalSha256": EXPECTED_TIME_SCALE_BUNDLE_CANONICAL_SHA256,
            "ruleSetVersion": "mallang-astrology-rule-core-v0",
            "providerIdentity": provider_identity,
            "sourceRefs": ["timeScaleBundle", "rawChart.provenance", "ruleChart"],
        },
        "points": points,
        "aspects": aspects,
        "wholeSignHouses": composition["wholeSignHouses"],
        "chartRulers": composition["chartRulers"],
        "distribution": composition["distribution"],
        "reasonCodes": sorted(set(reasons)),
        "promotion": {"calculationFactsChanged": False, "existingToleranceChanged": False, "activationChanged": False, "semanticMeaningAdded": False},
    }


def _build_arbitrary_preview(
    *,
    verified_context: dict[str, Any],
    location: dict[str, Any],
    input_status: str,
) -> dict[str, Any]:
    """Build the source-relative packet from an already verified user context."""

    release_contract = _load_de405_release_contract()
    source = release_contract["source"]
    time_scales = verified_context["timeScales"]
    rows = _evaluate_states(
        None,
        None,
        et_seconds=time_scales["etSeconds"],
        coverage=verified_context["coverage"],
    )
    time_values = time_scales["julianDates"]
    time = _time_angles_from_values(
        verified_context["utc"],
        location,
        float(time_values["ut1"]),
        float(time_values["tt"]["value"]),
    )
    provider_info = {
        "id": "jplephem",
        "implementation": "direct_spk",
        "version": rows[0]["jplephemVersion"],
        "numpyVersion": rows[0]["numpyVersion"],
        "pythonVersion": rows[0]["pythonVersion"],
        "pythonImplementation": rows[0]["pythonImplementation"],
        "pythonAbi": rows[0]["pythonAbi"],
        "license": "MIT",
    }
    raw_bodies = []
    for row in rows:
        converted = _convert_state(row["state"], time["jdTt"])
        raw_bodies.append({
            "id": row["mapping"]["id"],
            "longitudeDegrees": converted["longitude"],
            "longitudeSpeedDegreesPerDay": converted["speed"],
            "state": converted,
        })

    canonical_input_sha = verified_context.get("canonicalInputContentSha256")
    if not isinstance(canonical_input_sha, str) or not re.fullmatch(r"[0-9a-f]{64}", canonical_input_sha):
        raise PreviewError("canonical_input_hash_missing")
    utc = verified_context["utc"]
    utc_iso = verified_context["utcIso"]
    candidate_id = f"{utc_iso}:{location['id']}"
    coverage = dict(verified_context["coverage"])
    raw = {
        "schemaVersion": "astrology-raw-chart-v1",
        "availability": "available",
        "candidateId": candidate_id,
        "inputStatus": input_status,
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
            "ephemerisTime": {
                "inputScale": "TT",
                "suppliedTdbMinusTtSeconds": time_scales["values"]["tdbMinusTtSeconds"],
                "etSeconds": time_scales["etSeconds"],
                "model": "HF2002_IERS_TN36_10_5_IAU2006_B3_TDB_MINUS_TT",
                "timeScaleBundleCanonicalSha256": time_scales["provenance"]["bundle"]["canonicalSha256"],
                "sourceRefs": ["timeScaleBundle", "timeScales.values.tdbMinusTtSeconds", "timeScales.etSeconds"],
            },
            "de405": {
                "evaluator": "jplephem-2.24-direct-spk",
                "source": source["identity"],
                "sourceUrl": source["sourceUrl"],
                "kernelSha256": rows[0]["kernelSha256"],
                "coverage": {"coverageStartEt": coverage["startEt"], "coverageEndEt": coverage["endEt"]},
                "observerId": 399,
                "observer": "EARTH",
                "frame": "J2000",
                "aberrationCorrection": "NONE",
                "units": {"position": "km", "velocity": "km/s"},
                "bodyMapping": BODY_MAPPING,
                "sourceRefs": ["de405.releaseContract", "provider.de405.bsp"],
            },
            "location": {"sourceRefs": ["canonicalInput.location", "canonicalInput.location.coordinateProvenance"]},
            "transform": {"model": "iau2006_fukushima_williams_precession_plus_mean_obliquity", "input": "J2000/ICRF_mean_equator", "output": "mean_ecliptic_and_equinox_of_date", "speed": "analytic_moving_date_frame_derivative", "frozenFrameDiagnostic": "frozen_frame_xy_angular_rate_only"},
        },
    }
    rule = _derive_rule_chart(raw)
    boundary = _boundary_assessment(rule, time_scales, "jplephem-2.24-direct-spk")
    source_refs = [
        "canonicalInput",
        "canonicalInput.userInput",
        "canonicalInput.civilTime",
        "canonicalInput.location",
        "timeScaleBundle",
        "timeScales.values",
        "timeScales.julianDates",
        "timeScales.provenance",
        "de405.releaseContract",
        "provider.de405.bsp",
        "provider.jplephem",
        "rawChart.provenance.timeAngleCore",
        "rawChart.provenance.ephemerisTime",
        "rawChart.provenance.transform",
        "ruleChart.ruleSetVersion",
        "boundaryAssessment",
    ]
    packet = {
        "schemaVersion": PACKET_SCHEMA,
        "packetVersion": PACKET_VERSION,
        "packetStatus": "complete",
        "usableForFactConsumption": True,
        "availableForInterpretation": False,
        "activation": dict(ACTIVATION),
        "factFrame": {"mode": "source_relative_deterministic", "physicalTruthGuarantee": False, "universalAbsoluteBoundRequired": False},
        "input": {
            "schemaVersion": CANONICAL_INPUT_SCHEMA,
            "canonicalInputContentSha256": canonical_input_sha,
            "utc": utc,
            "utcIso": utc_iso,
            "locationId": location["id"],
            "location": _canonical_location(location),
            "timeScale": "TDB",
            "timeScales": {"schemaVersion": time_scales["schemaVersion"], "status": time_scales["status"], "values": time_scales["values"], "julianDates": time_scales["julianDates"], "etSeconds": time_scales["etSeconds"]},
            "observerId": 399,
            "frame": "J2000/ICRF",
            "aberrationCorrection": "NONE",
        },
        "provider": {**provider_info, "sourceUrl": source["sourceUrl"], "sourceSha256": rows[0]["kernelSha256"], "sourceBytes": source["bytes"], "sourceIdentity": source["identity"], "coverage": coverage},
        "rawChart": raw,
        "ruleChart": rule,
        "boundaryAssessment": boundary,
        "unsupportedFeatures": [{"feature": "true_node", "status": "unsupported", "reason": "not_calculated_by_current_verified_technical_scope"}, {"feature": "chiron_lilith_asteroids_fixed_stars_arabic_parts_vertex", "status": "unsupported", "reason": "not_calculated_by_current_verified_technical_scope"}],
        "blockedFeatures": [{"feature": "interpretation_service_activation", "status": "blocked", "reason": ACTIVATION["reason"]}],
        "epistemicBoundary": {"raw": "calculated_fact", "derived": "deterministically_derived_fact", "unsupported": "not_a_fact", "boundary": "source_relative_interval_guard", "activation": "service_not_connected"},
        "provenance": {
            "sourceRefs": source_refs,
            "canonicalInputSha256": canonical_input_sha,
            "timeScaleBundle": time_scales["provenance"]["bundle"],
            "providerSha256": rows[0]["kernelSha256"],
            "rawChartSha256": _sha256_value(raw),
            "ruleChartSha256": _sha256_value(rule),
            "boundaryContractCanonicalSha256": EXPECTED_DISCRETE_BOUNDARY_CONTRACT_CANONICAL_SHA256,
            "claimSourceRefs": {"input": "canonicalInput", "bodyLongitudes": "rawChart.bodies[*].longitudeDegrees", "bodyMotion": "rawChart.bodies[*].longitudeSpeedDegreesPerDay", "angles": "rawChart.angles", "houses": "ruleChart.houses", "aspects": "ruleChart.aspects", "distribution": "ruleChart.distribution", "chartRulers": "ruleChart.chartRulers", "boundaryAssessment": "boundaryAssessment"},
        },
        "consumption": {"allowed": ["use included raw and derived FACT values", "retain provider/source identity and sourceRefs", "describe source-relative boundary status as stated", "describe unsupported or blocked state as stated"], "requiresUserContext": True, "forbidden": ["invent missing calculations", "replace jplephem with another provider", "infer personality, fate, prediction, or personal certainty", "merge with another lineage or source", "treat indeterminate boundary output as confirmed", "promote interpretation activation"]},
    }
    packet["packetContentSha256"] = _sha256_value(packet)
    handoff = {
        "schemaVersion": RESPONSE_SCHEMA,
        "handoffVersion": PACKET_VERSION,
        "handoffStatus": "complete",
        "usable": True,
        "activation": dict(ACTIVATION),
        "factFrame": packet["factFrame"],
        "sourcePacket": {"schemaVersion": packet["schemaVersion"], "packetVersion": packet["packetVersion"], "packetContentSha256": packet["packetContentSha256"]},
        "facts": {"raw": raw, "derived": rule},
        "boundaryAssessment": boundary,
        "unsupportedFeatures": packet["unsupportedFeatures"],
        "blockedFeatures": packet["blockedFeatures"],
        "provenance": {"sourceRefs": source_refs, "canonicalInputSha256": canonical_input_sha, "timeScaleBundle": packet["provenance"]["timeScaleBundle"], "providerSha256": packet["provenance"]["providerSha256"], "rawChartSha256": packet["provenance"]["rawChartSha256"], "ruleChartSha256": packet["provenance"]["ruleChartSha256"], "boundaryContractCanonicalSha256": packet["provenance"]["boundaryContractCanonicalSha256"]},
        "deliveryPolicy": {"relationSemantics": "structural_fact_reference_only", "noInterpretationText": True, "noPromptTemplate": True, "noLlmCall": True, "noActivation": True, "forbiddenUsages": packet["consumption"]["forbidden"]},
    }
    handoff["handoffContentSha256"] = _sha256_value(handoff)
    response = {"schemaVersion": RESPONSE_SCHEMA, "responseVersion": PACKET_VERSION, "status": "complete", "packet": packet, "factOnlyHandoff": handoff}
    response["responseContentSha256"] = _sha256_value(response)
    return response


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


def _load_user_input_contract() -> dict[str, Any]:
    if not INPUT_CONTRACT_PATH.is_file():
        raise PreviewError("input_contract_missing")
    try:
        contract_bytes = INPUT_CONTRACT_PATH.read_bytes()
        contract = json.loads(contract_bytes.decode("utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise PreviewError("input_contract_unreadable") from error
    if _sha256_file(INPUT_CONTRACT_PATH) != EXPECTED_INPUT_CONTRACT_SHA256:
        raise PreviewError("input_contract_sha_mismatch")
    if not isinstance(contract, dict) or contract.get("schemaVersion") != "astrology-user-input-normalization-contract-v1" or contract.get("contractVersion") != USER_INPUT_VERSION:
        raise PreviewError("input_contract_schema_mismatch")
    if contract.get("requestSchema") != USER_INPUT_REQUEST_SCHEMA or contract.get("responseSchema") != USER_INPUT_RESPONSE_SCHEMA:
        raise PreviewError("input_contract_schema_mismatch")
    resolver = contract.get("civilTime", {}).get("resolver", {})
    if resolver != {
        "id": "python-zoneinfo-from-pinned-tzif-v1",
        "ianaZone": "Asia/Seoul",
        "ianaRelease": "2026c",
        "assetPath": "api/provider/asia-seoul.tzif",
        "assetSha256": EXPECTED_TIMEZONE_ASSET_SHA256,
        "assetBytes": EXPECTED_TIMEZONE_ASSET_BYTES,
    }:
        raise PreviewError("input_contract_timezone_mismatch")
    location = contract.get("location", {})
    if location.get("sourcePath") != "src/interpretationPrep/koreaAdministrativeLocations.js" or location.get("sourceSha256") != EXPECTED_LOCATION_SOURCE_SHA256 or location.get("coordinateSourceSha256") != EXPECTED_LOCATION_COORDINATE_SOURCE_SHA256 or location.get("requiredRowCount") != EXPECTED_LOCATION_ROW_COUNT:
        raise PreviewError("input_contract_location_mismatch")
    ephemeris = contract.get("ephemeris", {})
    if ephemeris.get("providerId") != "jplephem-2.24-direct-spk" or ephemeris.get("sourceIdentity") != "unmodified_official_naif_de405_bsp" or ephemeris.get("sourceSha256") != EXPECTED_DE405_SHA256:
        raise PreviewError("input_contract_ephemeris_mismatch")
    time_scale = contract.get("timeScale", {})
    if time_scale.get("bundlePath") != "api/provider/astrology-time-scale-bundle-v1.json" or time_scale.get("bundleCanonicalSha256") != EXPECTED_TIME_SCALE_BUNDLE_CANONICAL_SHA256 or time_scale.get("providerOutputSchema") != TIME_SCALE_SCHEMA or time_scale.get("noImplicitZero") is not True or time_scale.get("noFormulaSubstitution") is not True or time_scale.get("noRuntimeFetch") is not True or time_scale.get("noFixtureValueReuse") is not True:
        raise PreviewError("input_contract_time_scale_mismatch")
    return contract


def _load_korea_location_snapshot() -> dict[str, dict[str, Any]]:
    if not LOCATION_SOURCE_PATH.is_file():
        raise PreviewError("location_source_missing")
    if _sha256_file(LOCATION_SOURCE_PATH) != EXPECTED_LOCATION_SOURCE_SHA256:
        raise PreviewError("location_source_sha_mismatch")
    try:
        source = LOCATION_SOURCE_PATH.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as error:
        raise PreviewError("location_source_missing") from error
    required_markers = (
        "schemaVersion: 'korea-sgg-location-provenance-v1'",
        "timezone: 'Asia/Seoul'",
        "supportedCountry: '대한민국'",
        f"sha256: '{EXPECTED_LOCATION_COORDINATE_SOURCE_SHA256}'",
    )
    if any(marker not in source for marker in required_markers):
        raise PreviewError("location_source_provenance_mismatch")
    rows = LOCATION_ROW_PATTERN.findall(source)
    if len(rows) != EXPECTED_LOCATION_ROW_COUNT:
        raise PreviewError("location_source_row_count_mismatch")
    locations: dict[str, dict[str, Any]] = {}
    for row in rows:
        parts = row.split("|")
        if len(parts) != 7:
            raise PreviewError("location_source_row_malformed")
        code, sido_code, sido_name, sgg_name, latitude_text, longitude_text, coordinate_method = parts
        try:
            latitude = float(latitude_text)
            longitude = float(longitude_text)
        except ValueError as error:
            raise PreviewError("location_source_coordinate_invalid") from error
        if not re.fullmatch(r"\d{5}", code) or not _finite(latitude) or not _finite(longitude) or not 33.0 <= latitude <= 39.0 or not 124.0 <= longitude <= 132.0 or not coordinate_method:
            raise PreviewError("location_source_coordinate_invalid")
        location_id = f"sgg:{code}"
        if location_id in locations:
            raise PreviewError("location_source_duplicate_code")
        locations[location_id] = {
            "id": location_id,
            "code": code,
            "sidoCode": sido_code,
            "sidoName": sido_name,
            "sggName": sgg_name,
            "label": f"{sido_name} {sgg_name}",
            "country": "대한민국",
            "timezone": "Asia/Seoul",
            "latitudeDegrees": latitude,
            "longitudeDegreesEast": longitude,
            "resolution": "administrative_area_representative_point",
            "coordinateMethod": coordinate_method,
            "coordinateProvenance": {
                "schemaVersion": "korea-sgg-location-provenance-v1",
                "sourceIdentity": "admdongkor MDIS administrative-boundary center snapshot",
                "coordinateReferenceSystem": "WGS84 / EPSG:4326",
                "sourceSha256": EXPECTED_LOCATION_COORDINATE_SOURCE_SHA256,
                "sourcePath": "src/interpretationPrep/koreaAdministrativeLocations.js",
            },
        }
    if len(locations) != EXPECTED_LOCATION_ROW_COUNT:
        raise PreviewError("location_source_row_count_mismatch")
    return locations


def _load_pinned_seoul_timezone() -> ZoneInfo:
    if not TIMEZONE_ASSET_PATH.is_file():
        raise PreviewError("timezone_asset_missing")
    try:
        if TIMEZONE_ASSET_PATH.stat().st_size != EXPECTED_TIMEZONE_ASSET_BYTES:
            raise PreviewError("timezone_asset_size_mismatch")
    except OSError as error:
        raise PreviewError("timezone_asset_missing") from error
    if _sha256_file(TIMEZONE_ASSET_PATH) != EXPECTED_TIMEZONE_ASSET_SHA256:
        raise PreviewError("timezone_asset_sha_mismatch")
    try:
        with TIMEZONE_ASSET_PATH.open("rb") as stream:
            zone = ZoneInfo.from_file(stream, key="Asia/Seoul")
    except (OSError, ValueError) as error:
        raise PreviewError("timezone_resolution_failed") from error
    return zone


def _utc_object(value: datetime) -> dict[str, Any]:
    return {
        "year": value.year,
        "month": value.month,
        "day": value.day,
        "hour": value.hour,
        "minute": value.minute,
        "second": value.second,
    }


def _utc_iso(value: dict[str, Any]) -> str:
    if not isinstance(value, dict) or set(value) != LOCAL_DATETIME_KEYS:
        raise PreviewError("utc_record_invalid")
    return f"{value['year']:04d}-{value['month']:02d}-{value['day']:02d}T{value['hour']:02d}:{value['minute']:02d}:{value['second']:02d}Z"


def _validate_local_datetime(value: Any) -> dict[str, int]:
    if not isinstance(value, dict) or isinstance(value, list) or set(value) != LOCAL_DATETIME_KEYS:
        raise PreviewError("local_datetime_invalid")
    if any(isinstance(value[key], bool) or not isinstance(value[key], int) for key in LOCAL_DATETIME_KEYS):
        raise PreviewError("local_datetime_invalid")
    if value["year"] < 1900 or value["year"] > 2100 or value["month"] < 1 or value["month"] > 12 or value["day"] < 1 or value["hour"] < 0 or value["hour"] > 23 or value["minute"] < 0 or value["minute"] > 59 or value["second"] < 0 or value["second"] > 59:
        raise PreviewError("local_datetime_invalid")
    try:
        datetime(value["year"], value["month"], value["day"], value["hour"], value["minute"], value["second"])
    except ValueError as error:
        raise PreviewError("local_datetime_invalid") from error
    return {key: value[key] for key in ("year", "month", "day", "hour", "minute", "second")}


def _resolve_pinned_local_time(local: dict[str, int], zone: ZoneInfo, requested_fold: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    naive = datetime(**local)
    candidates: list[dict[str, Any]] = []
    seen_utc: set[str] = set()
    for fold_value in (0, 1):
        aware = naive.replace(tzinfo=zone, fold=fold_value)
        utc_value = aware.astimezone(timezone.utc)
        round_trip = utc_value.astimezone(zone).replace(tzinfo=None)
        if round_trip != naive:
            continue
        utc_key = utc_value.isoformat()
        if utc_key in seen_utc:
            continue
        seen_utc.add(utc_key)
        offset = aware.utcoffset()
        if offset is None:
            raise PreviewError("timezone_resolution_failed")
        candidates.append({"fold": fold_value, "utc": _utc_object(utc_value), "offsetSeconds": int(offset.total_seconds())})

    resolver = {
        "id": "python-zoneinfo-from-pinned-tzif-v1",
        "ianaZone": "Asia/Seoul",
        "ianaRelease": "2026c",
        "assetSha256": EXPECTED_TIMEZONE_ASSET_SHA256,
        "assetBytes": EXPECTED_TIMEZONE_ASSET_BYTES,
        "runtime": {
            "pythonVersion": ".".join(str(part) for part in sys.version_info[:3]),
            "pythonImplementation": sys.implementation.name,
            "pythonAbi": sys.implementation.cache_tag,
        },
    }
    if not candidates:
        return {
            "status": "gap",
            "localDateTime": local,
            "timeZone": "Asia/Seoul",
            "candidates": [],
            "resolver": resolver,
        }, {}
    if len(candidates) > 1:
        if requested_fold is None:
            return {
                "status": "overlap",
                "localDateTime": local,
                "timeZone": "Asia/Seoul",
                "candidates": candidates,
                "resolver": resolver,
            }, {}
        if isinstance(requested_fold, bool) or requested_fold not in (0, 1):
            raise PreviewError("civil_time_fold_invalid")
        selected = next((candidate for candidate in candidates if candidate["fold"] == requested_fold), None)
        if selected is None:
            raise PreviewError("civil_time_fold_invalid")
        return {
            "status": "overlap_resolved",
            "localDateTime": local,
            "timeZone": "Asia/Seoul",
            "selectedFold": requested_fold,
            "candidates": candidates,
            "resolver": resolver,
            "utc": selected["utc"],
            "offsetSeconds": selected["offsetSeconds"],
        }, selected
    if requested_fold is not None:
        raise PreviewError("civil_time_fold_invalid")
    selected = candidates[0]
    return {
        "status": "exact",
        "localDateTime": local,
        "timeZone": "Asia/Seoul",
        "selectedFold": "not_applicable",
        "candidates": candidates,
        "resolver": resolver,
        "utc": selected["utc"],
        "offsetSeconds": selected["offsetSeconds"],
    }, selected


def _canonical_location(location: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": location["id"],
        "code": location["code"],
        "label": location["label"],
        "country": location["country"],
        "timezone": location["timezone"],
        "latitudeDegrees": location["latitudeDegrees"],
        "longitudeDegreesEast": location["longitudeDegreesEast"],
        "resolution": location["resolution"],
        "coordinateMethod": location["coordinateMethod"],
        "coordinateProvenance": dict(location["coordinateProvenance"]),
    }


def _base_canonical_user_input(user_input: dict[str, Any] | None = None) -> dict[str, Any]:
    canonical: dict[str, Any] = {
        "schemaVersion": CANONICAL_INPUT_SCHEMA,
        "canonicalVersion": USER_INPUT_VERSION,
        "status": "blocked",
        "provenance": {"sourceRefs": ["userInput"]},
    }
    if user_input is not None:
        canonical["userInput"] = user_input
    return canonical


def _normalize_user_input(payload: Any, fixture: dict[str, Any] | None = None) -> tuple[dict[str, Any], dict[str, Any] | None]:
    if not isinstance(payload, dict) or isinstance(payload, list):
        raise PreviewError("request_not_object")
    if set(payload) != {"schemaVersion", "userInput"}:
        raise PreviewError("request_fields_mismatch")
    if payload["schemaVersion"] != USER_INPUT_REQUEST_SCHEMA:
        raise PreviewError("request_schema_mismatch")
    user_input = payload["userInput"]
    if not isinstance(user_input, dict) or isinstance(user_input, list) or set(user_input) != USER_INPUT_KEYS:
        raise PreviewError("request_fields_mismatch")
    local = _validate_local_datetime(user_input["localDateTime"])
    location_id = user_input["locationId"]
    if not isinstance(location_id, str) or not re.fullmatch(r"sgg:\d{5}", location_id):
        raise PreviewError("location_unsupported")
    requested_fold = user_input["fold"]
    if requested_fold is not None and (isinstance(requested_fold, bool) or requested_fold not in (0, 1)):
        raise PreviewError("civil_time_fold_invalid")
    contract = _load_user_input_contract()
    locations = _load_korea_location_snapshot()
    location = locations.get(location_id)
    if location is None:
        raise PreviewError("location_unsupported")
    if location["timezone"] != contract["location"]["timezone"] or location["country"] != contract["location"]["country"]:
        raise PreviewError("location_unsupported")
    zone = _load_pinned_seoul_timezone()
    civil, selected = _resolve_pinned_local_time(local, zone, requested_fold)
    canonical = _base_canonical_user_input({"localDateTime": local, "locationId": location_id, "fold": requested_fold})
    canonical["civilTime"] = civil
    canonical["location"] = _canonical_location(location)
    canonical["provenance"] = {
        "sourceRefs": ["userInput.localDateTime", "userInput.locationId", "civilTime.resolver", "location.coordinateProvenance"],
        "locationSourceSha256": EXPECTED_LOCATION_SOURCE_SHA256,
        "timezoneAssetSha256": EXPECTED_TIMEZONE_ASSET_SHA256,
    }
    if not selected:
        reason = "civil_time_nonexistent" if civil["status"] == "gap" else "civil_time_ambiguous"
        canonical["blockedReasons"] = [reason]
        return canonical, None

    utc = selected["utc"]
    utc_iso = _utc_iso(utc)
    try:
        time_scale_provider = _load_time_scale_provider()
        time_scales = time_scale_provider.produce(utc_iso)
    except Exception as error:
        reason = getattr(error, "reason", None) or str(error) or "time_scale_provider_failure"
        canonical["timeScale"] = {"status": "blocked", "reason": reason, "fallbackPolicy": "none"}
        canonical["ephemeris"] = {"status": "not_evaluated", "reason": reason}
        canonical["blockedReasons"] = [reason]
        return canonical, None

    release_contract = _load_de405_release_contract()
    coverage = release_contract["source"].get("coverage", {})
    try:
        coverage_start = float(coverage["startEt"])
        coverage_end = float(coverage["endEt"])
    except (KeyError, TypeError, ValueError) as error:
        raise PreviewError("de405_coverage_contract_invalid") from error
    canonical_et_seconds = time_scales["etSeconds"]
    if not _finite(canonical_et_seconds):
        raise PreviewError("time_scale_values_invalid")
    if not coverage_start <= canonical_et_seconds <= coverage_end:
        canonical["timeScale"] = time_scales
        canonical["ephemeris"] = {"status": "blocked", "reason": "de405_coverage_outside", "coverage": {"startEt": coverage["startEt"], "endEt": coverage["endEt"]}}
        canonical["blockedReasons"] = ["de405_coverage_outside"]
        return canonical, None
    canonical["timeScale"] = time_scales
    canonical["ephemeris"] = {
        "status": "verified",
        "providerId": "jplephem-2.24-direct-spk",
        "sourceIdentity": release_contract["source"]["identity"],
        "sourceSha256": release_contract["source"]["sha256"],
        "coverage": dict(coverage),
        "requestedEtSeconds": canonical_et_seconds,
        "sourceRefs": ["de405.releaseContract", "timeScale.etSeconds"],
    }
    canonical["status"] = "verified_source_relative"
    canonical["provenance"]["sourceRefs"].extend(["timeScaleBundle", "de405.releaseContract", "timeScale.etSeconds"])
    return canonical, {
        "utc": utc,
        "utcIso": utc_iso,
        "location": location,
        "timeScales": time_scales,
        "coverage": coverage,
        "canonicalInput": canonical,
        "canonicalInputContentSha256": _sha256_value(canonical),
    }


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


def _evaluate_states(item: dict[str, Any] | None, fixture: dict[str, Any] | None, *, et_seconds: float | None = None, coverage: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    producer = _load_producer()
    if et_seconds is not None:
        if coverage is None:
            raise PreviewError("de405_coverage_contract_missing")
        try:
            evaluated = producer.evaluate_states(BSP_PATH, et_seconds, coverage)
        except Exception as error:
            message = str(error)
            if message.startswith("DE405 BSP is missing"):
                reason = "de405_bsp_missing"
            elif message.startswith("DE405 BSP byte size mismatch"):
                reason = "de405_bsp_size_mismatch"
            elif message.startswith("DE405 BSP SHA mismatch"):
                reason = "de405_bsp_sha_mismatch"
            elif message.startswith("DE405 BSP open failed"):
                reason = "de405_bsp_open_failed"
            elif message.startswith("required DE405 segment missing"):
                reason = "de405_required_segment_missing"
            else:
                reason = getattr(error, "args", [None])[0] or "de405_state_unavailable"
            raise PreviewError(str(reason)) from error
        rows = []
        mappings = {mapping["id"]: mapping for mapping in BODY_MAPPING}
        for evaluated_row in evaluated["rows"]:
            body_id = evaluated_row.get("body")
            mapping = mappings.get(body_id)
            if mapping is None:
                raise PreviewError("de405_body_mapping_mismatch")
            state = [*evaluated_row["positionKm"], *evaluated_row["velocityKmPerSecond"]]
            rows.append({
                "mapping": mapping,
                "state": state,
                "pythonVersion": evaluated["provider"]["pythonVersion"],
                "pythonImplementation": evaluated["provider"]["pythonImplementation"],
                "pythonAbi": evaluated["provider"]["pythonAbi"],
                "jplephemVersion": evaluated["provider"]["version"],
                "numpyVersion": evaluated["provider"]["numpyVersion"],
                "kernelSha256": evaluated["source"]["sha256"],
            })
        if len(rows) != len(BODY_MAPPING):
            raise PreviewError("de405_body_inventory_incomplete")
        return rows
    if item is None or fixture is None:
        raise PreviewError("fixture_state_input_missing")
    if not BSP_PATH.is_file():
        raise PreviewError("de405_bsp_missing")
    if BSP_PATH.stat().st_size != producer.EXPECTED_KERNEL_BYTES:
        raise PreviewError("de405_bsp_size_mismatch")
    kernel_sha = _sha256_file(BSP_PATH)
    if kernel_sha != producer.EXPECTED_KERNEL_SHA256:
        raise PreviewError("de405_bsp_sha_mismatch")
    python_version, python_implementation, python_abi, jplephem_version, numpy_version = producer.validate_runtime()
    if not hasattr(producer, "SPK"):
        raise PreviewError("jplephem_provider_missing")
    try:
        kernel = producer.SPK.open(str(BSP_PATH))
    except Exception as error:
        raise PreviewError("de405_bsp_open_failed") from error
    rows = []
    tdb1, tdb2 = producer.et_seconds_to_two_part_jd(item["et"])
    if producer.two_part_representation_error_bound_seconds(item["et"]) > producer.TWO_PART_JD_ERROR_BUDGET_SECONDS:
        raise PreviewError("tdb_two_part_representation_budget_exceeded")
    for mapping in BODY_MAPPING:
        state = producer.relative_to_earth(kernel, mapping["targetId"], tdb1, tdb2)
        if not isinstance(state, list) or len(state) != 6 or not all(_finite(value) for value in state):
            raise PreviewError(f"state_unavailable:{mapping['id']}")
        rows.append({"mapping": mapping, "state": state, "pythonVersion": python_version, "pythonImplementation": python_implementation, "pythonAbi": python_abi, "jplephemVersion": jplephem_version, "numpyVersion": numpy_version, "kernelSha256": kernel_sha})
    return rows


def _build_preview(
    payload: Any,
    *,
    verified_item: dict[str, Any] | None = None,
    verified_location: dict[str, Any] | None = None,
    input_status: str = "fixture_validated_preview",
    verified_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if verified_context is not None:
        if not isinstance(verified_location, dict):
            raise PreviewError("location_unavailable")
        return _build_arbitrary_preview(verified_context=verified_context, location=verified_location, input_status=input_status)
    release_contract = _load_de405_release_contract()
    fixture = None if verified_context is not None else _load_fixture()
    if verified_context is not None:
        item = None
        location = verified_location
        if not isinstance(location, dict):
            raise PreviewError("location_unavailable")
        rows = _evaluate_states(
            None,
            None,
            et_seconds=verified_context["timeScales"]["etSeconds"],
            coverage=verified_context["coverage"],
        )
        time_values = verified_context["timeScales"]["julianDates"]
        time = _time_angles_from_values(
            verified_context["utc"],
            location,
            float(time_values["ut1"]),
            float(time_values["tt"]["value"]),
        )
    elif verified_item is None or verified_location is None:
        item, location = _validate_request(payload, fixture)
        rows = _evaluate_states(item, fixture)
        time = _time_angles(item, location)
    else:
        item, location = verified_item, verified_location
        rows = _evaluate_states(item, fixture)
        time = _time_angles(item, location)
    raw_bodies = []
    provider_info = {"id": "jplephem", "implementation": "direct_spk", "version": rows[0]["jplephemVersion"], "numpyVersion": rows[0]["numpyVersion"], "pythonVersion": rows[0]["pythonVersion"], "pythonImplementation": rows[0]["pythonImplementation"], "pythonAbi": rows[0]["pythonAbi"], "license": "MIT"}
    for row in rows:
        converted = _convert_state(row["state"], time["jdTt"])
        raw_bodies.append({"id": row["mapping"]["id"], "longitudeDegrees": converted["longitude"], "longitudeSpeedDegreesPerDay": converted["speed"], "state": converted})
    raw = {
        "schemaVersion": "astrology-raw-chart-v1",
        "availability": "available",
        "candidateId": f"{item['id']}:{location['id']}",
        "inputStatus": input_status,
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


def _blocked_user_input_canonical(reason: str, payload: Any = None) -> dict[str, Any]:
    user_input = None
    if isinstance(payload, dict) and isinstance(payload.get("userInput"), dict):
        user_input = payload["userInput"]
    canonical = _base_canonical_user_input(user_input)
    canonical["blockedReasons"] = [reason]
    return canonical


def _finalize_user_input_response(canonical: dict[str, Any], reason: str | None = None, verified_response: dict[str, Any] | None = None) -> dict[str, Any]:
    canonical_copy = dict(canonical)
    canonical_copy["canonicalInputContentSha256"] = _sha256_value(canonical)
    response: dict[str, Any] = {
        "schemaVersion": USER_INPUT_RESPONSE_SCHEMA,
        "responseVersion": USER_INPUT_VERSION,
        "status": "complete" if verified_response is not None else "blocked",
        "normalizationStatus": canonical.get("status", "blocked"),
        "canonicalInput": canonical_copy,
        "activation": dict(ACTIVATION),
    }
    if reason is not None:
        response["reason"] = reason
    if verified_response is not None:
        response["verifiedResponse"] = verified_response
        response["unsupportedFeatures"] = verified_response.get("packet", {}).get("unsupportedFeatures", [])
        response["blockedFeatures"] = verified_response.get("packet", {}).get("blockedFeatures", [])
    else:
        response["unsupportedFeatures"] = []
        response["blockedFeatures"] = [{"feature": "astrology_user_input_normalization", "status": "blocked", "reason": reason or "input_normalization_blocked"}]
    response["responseContentSha256"] = _sha256_value(response)
    return response


def build_user_input_preview(payload: Any) -> dict[str, Any]:
    """Normalize supported user input and build a source-relative FACT packet."""

    try:
        _load_user_input_contract()
        canonical, resolved = _normalize_user_input(payload)
        if resolved is None:
            reason = canonical.get("blockedReasons", ["input_normalization_blocked"])[0]
            return _finalize_user_input_response(canonical, reason)
        verified_response = _build_preview(
            payload,
            verified_location=resolved["location"],
            input_status="user_input_normalized_source_relative_verified",
            verified_context=resolved,
        )
        return _finalize_user_input_response(canonical, verified_response=verified_response)
    except PreviewError as error:
        reason = str(error)
        blocked = canonical if "canonical" in locals() and isinstance(canonical, dict) else _blocked_user_input_canonical(reason, payload)
        blocked["status"] = "blocked"
        blocked["blockedReasons"] = [reason]
        if "timeScale" in blocked and isinstance(blocked["timeScale"], dict) and blocked["timeScale"].get("status") != "blocked":
            blocked["ephemeris"] = {"status": "not_evaluated", "reason": reason}
        return _finalize_user_input_response(blocked, reason)


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
        for key, expected in {"id": "jplephem", "implementation": "direct_spk", "version": "2.24", "numpyVersion": "2.5.3", "pythonImplementation": "cpython", "pythonAbi": "cpython-314", "sourceSha256": "30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89", "sourceBytes": 10898432, "sourceIdentity": "unmodified_official_naif_de405_bsp"}.items():
            require(provider.get(key) == expected, f"provider_{key}_mismatch")
        python_version = provider.get("pythonVersion")
        version_parts = python_version.split(".") if isinstance(python_version, str) else []
        require(len(version_parts) == 3 and version_parts[:2] == ["3", "14"] and version_parts[2].isdigit(), "provider_pythonVersion_series_mismatch")
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


def verify_user_input_response(response: Any) -> list[str]:
    """Verify a fresh user-input handoff without recalculating its packet."""

    errors: list[str] = []

    def require(condition: bool, code: str) -> None:
        if not condition and code not in errors:
            errors.append(code)

    require(isinstance(response, dict), "response_not_object")
    if not isinstance(response, dict):
        return errors
    require(response.get("schemaVersion") == USER_INPUT_RESPONSE_SCHEMA, "response_schema_mismatch")
    require(response.get("responseVersion") == USER_INPUT_VERSION, "response_version_mismatch")
    require(response.get("status") in {"complete", "blocked"}, "response_status_invalid")
    response_copy = dict(response)
    response_hash = response_copy.pop("responseContentSha256", None)
    require(isinstance(response_hash, str) and response_hash == _sha256_value(response_copy), "response_content_hash_mismatch")
    require(response.get("activation") == ACTIVATION, "activation_boundary_mismatch")

    canonical = response.get("canonicalInput")
    require(isinstance(canonical, dict), "canonical_input_missing")
    if not isinstance(canonical, dict):
        return sorted(errors)
    canonical_copy = dict(canonical)
    canonical_hash = canonical_copy.pop("canonicalInputContentSha256", None)
    require(isinstance(canonical_hash, str) and canonical_hash == _sha256_value(canonical_copy), "canonical_input_content_hash_mismatch")
    require(canonical.get("schemaVersion") == CANONICAL_INPUT_SCHEMA, "canonical_input_schema_mismatch")
    require(canonical.get("canonicalVersion") == USER_INPUT_VERSION, "canonical_input_version_mismatch")
    require(canonical.get("status") in {"verified_source_relative", "verified_fixture", "blocked"}, "canonical_input_status_invalid")

    civil = canonical.get("civilTime")
    if isinstance(civil, dict):
        require(civil.get("timeZone") == "Asia/Seoul", "canonical_timezone_mismatch")
        resolver = civil.get("resolver")
        require(isinstance(resolver, dict), "timezone_resolver_missing")
        if isinstance(resolver, dict):
            require(resolver.get("id") == "python-zoneinfo-from-pinned-tzif-v1", "timezone_resolver_id_mismatch")
            require(resolver.get("ianaZone") == "Asia/Seoul", "timezone_zone_mismatch")
            require(resolver.get("ianaRelease") == "2026c", "timezone_release_mismatch")
            require(resolver.get("assetSha256") == EXPECTED_TIMEZONE_ASSET_SHA256, "timezone_asset_sha_mismatch")
            require(resolver.get("assetBytes") == EXPECTED_TIMEZONE_ASSET_BYTES, "timezone_asset_bytes_mismatch")
        require(civil.get("status") in {"exact", "overlap_resolved", "overlap", "gap"}, "civil_time_status_invalid")
        if civil.get("status") in {"exact", "overlap_resolved"}:
            require(isinstance(civil.get("utc"), dict), "canonical_utc_missing")
        if civil.get("status") == "overlap":
            require(len(civil.get("candidates", [])) == 2 and "utc" not in civil, "overlap_selection_invalid")
        if civil.get("status") == "gap":
            require(civil.get("candidates") == [] and "utc" not in civil, "gap_selection_invalid")

    location = canonical.get("location")
    if isinstance(location, dict):
        location_id = location.get("id")
        require(isinstance(location_id, str) and bool(re.fullmatch(r"sgg:\d{5}", location_id)), "canonical_location_id_invalid")
        if isinstance(location_id, str):
            require(location.get("code") == location_id.removeprefix("sgg:"), "canonical_location_code_mismatch")
        require(location.get("country") == "대한민국", "canonical_location_country_mismatch")
        require(location.get("timezone") == "Asia/Seoul", "canonical_location_timezone_mismatch")
        require(location.get("resolution") == "administrative_area_representative_point", "canonical_location_resolution_mismatch")
        require(_finite(location.get("latitudeDegrees")) and _finite(location.get("longitudeDegreesEast")), "canonical_location_coordinates_invalid")
        provenance = location.get("coordinateProvenance")
        require(isinstance(provenance, dict), "canonical_location_provenance_missing")
        if isinstance(provenance, dict):
            require(provenance.get("schemaVersion") == "korea-sgg-location-provenance-v1", "canonical_location_provenance_schema_mismatch")
            require(provenance.get("sourceSha256") == EXPECTED_LOCATION_COORDINATE_SOURCE_SHA256, "canonical_location_provenance_sha_mismatch")

    if response.get("status") == "complete":
        require(canonical.get("status") in {"verified_source_relative", "verified_fixture"}, "complete_without_verified_canonical_input")
        verified_response = response.get("verifiedResponse")
        require(isinstance(verified_response, dict), "verified_response_missing")
        if isinstance(verified_response, dict):
            for code in verify_preview_response(verified_response):
                require(False, f"verified_{code}")
            packet = verified_response.get("packet", {})
            if isinstance(packet, dict):
                require(packet.get("input", {}).get("utc") == canonical.get("civilTime", {}).get("utc"), "canonical_packet_utc_mismatch")
                require(packet.get("input", {}).get("locationId") == canonical.get("location", {}).get("id"), "canonical_packet_location_mismatch")
                require(packet.get("input", {}).get("location", {}).get("latitudeDegrees") == canonical.get("location", {}).get("latitudeDegrees"), "canonical_packet_latitude_mismatch")
                require(packet.get("input", {}).get("location", {}).get("longitudeDegreesEast") == canonical.get("location", {}).get("longitudeDegreesEast"), "canonical_packet_longitude_mismatch")
                if canonical.get("status") == "verified_source_relative":
                    require(canonical.get("timeScale", {}).get("schemaVersion") == TIME_SCALE_SCHEMA, "canonical_time_scale_schema_mismatch")
                    require(canonical.get("timeScale", {}).get("status") == "verified_source_relative", "canonical_time_scale_status_mismatch")
                    require(canonical.get("ephemeris", {}).get("status") == "verified", "canonical_ephemeris_status_mismatch")
                    require(packet.get("input", {}).get("schemaVersion") == CANONICAL_INPUT_SCHEMA, "canonical_packet_input_schema_mismatch")
                    require(packet.get("input", {}).get("canonicalInputContentSha256") == canonical_hash, "canonical_packet_input_hash_mismatch")
                    require("fixtureId" not in packet.get("input", {}) and "fixtureCaseId" not in packet.get("input", {}), "arbitrary_packet_contains_fixture_identity")
                    canonical_utc = canonical.get("civilTime", {}).get("utc")
                    expected_utc_iso = _utc_iso(canonical_utc) if isinstance(canonical_utc, dict) else None
                    require(packet.get("input", {}).get("utcIso") == expected_utc_iso, "canonical_packet_utc_iso_mismatch")
                    require(packet.get("input", {}).get("location") == canonical.get("location"), "canonical_packet_location_projection_mismatch")
                    expected_time_scale_projection = {key: canonical["timeScale"].get(key) for key in ("schemaVersion", "status", "values", "julianDates", "etSeconds")}
                    require(packet.get("input", {}).get("timeScales") == expected_time_scale_projection, "canonical_packet_time_scale_projection_mismatch")
                    require(packet.get("provenance", {}).get("canonicalInputSha256") == canonical_hash, "canonical_packet_provenance_input_hash_mismatch")
                    require(packet.get("provenance", {}).get("timeScaleBundle", {}).get("canonicalSha256") == EXPECTED_TIME_SCALE_BUNDLE_CANONICAL_SHA256, "canonical_packet_time_scale_bundle_mismatch")
                    boundary = packet.get("boundaryAssessment")
                    require(isinstance(boundary, dict), "boundary_assessment_missing")
                    if isinstance(boundary, dict):
                        require(boundary.get("schemaVersion") == "astrology-discrete-fact-boundary-v1", "boundary_assessment_schema_mismatch")
                        require(boundary.get("factFrame", {}).get("mode") == "source_relative_deterministic", "boundary_assessment_fact_frame_mismatch")
                        require(boundary.get("status") == "indeterminate", "boundary_assessment_status_invalid")
                        require(boundary.get("intervalBacked", {}).get("status") == "blocked" and boundary.get("intervalBacked", {}).get("finalObservableIntervalSupplied") is False, "boundary_assessment_interval_gate_invalid")
                        require(boundary.get("source", {}).get("timeScaleBundleCanonicalSha256") == EXPECTED_TIME_SCALE_BUNDLE_CANONICAL_SHA256, "boundary_assessment_provenance_mismatch")
                    require(verified_response.get("factOnlyHandoff", {}).get("factFrame") == packet.get("factFrame"), "handoff_fact_frame_projection_mismatch")
                    require(verified_response.get("factOnlyHandoff", {}).get("boundaryAssessment") == boundary, "handoff_boundary_projection_mismatch")
        require(response.get("blockedFeatures") == response.get("verifiedResponse", {}).get("packet", {}).get("blockedFeatures"), "blocked_feature_projection_mismatch")
        require(response.get("unsupportedFeatures") == response.get("verifiedResponse", {}).get("packet", {}).get("unsupportedFeatures"), "unsupported_feature_projection_mismatch")
    else:
        require(canonical.get("status") == "blocked", "blocked_without_blocked_canonical_input")
        reasons = canonical.get("blockedReasons")
        require(isinstance(reasons, list) and len(reasons) > 0 and all(isinstance(reason, str) for reason in reasons), "blocked_reason_missing")
        if isinstance(reasons, list) and reasons:
            require(response.get("reason") == reasons[0], "blocked_reason_mismatch")
        require("verifiedResponse" not in response, "blocked_response_contains_verified_response")
        require(response.get("unsupportedFeatures") == [], "blocked_unsupported_projection_invalid")
        blocked = response.get("blockedFeatures")
        require(isinstance(blocked, list) and len(blocked) == 1 and blocked[0].get("status") == "blocked" and blocked[0].get("reason") == response.get("reason"), "blocked_feature_projection_invalid")
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
            if isinstance(payload, dict) and payload.get("schemaVersion") == USER_INPUT_REQUEST_SCHEMA:
                result = build_user_input_preview(payload)
                self._write_json(200 if result.get("status") == "complete" else 422, result)
            else:
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
    if len(sys.argv) == 3 and sys.argv[1] in {"--check", "--check-user-input"}:
        response_path = Path(sys.argv[2])
        try:
            response = json.loads(response_path.read_text(encoding="utf-8"))
            errors = verify_preview_response(response) if sys.argv[1] == "--check" else verify_user_input_response(response)
        except (OSError, UnicodeError, json.JSONDecodeError):
            errors = ["response_unreadable"]
        print(_stable_json({"status": "pass" if not errors else "fail", "errors": errors}), end="")
        raise SystemExit(0 if not errors else 1)
    if len(sys.argv) != 2:
        raise SystemExit("usage: astrology.py REQUEST.json | astrology.py --check RESPONSE.json | astrology.py --check-user-input RESPONSE.json")
    request_path = Path(sys.argv[1])
    request = json.loads(request_path.read_text(encoding="utf-8"))
    result = build_user_input_preview(request) if isinstance(request, dict) and request.get("schemaVersion") == USER_INPUT_REQUEST_SCHEMA else build_preview(request)
    print(_stable_json(result), end="")
