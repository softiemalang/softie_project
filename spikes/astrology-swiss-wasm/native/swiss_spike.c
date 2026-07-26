#include <emscripten/emscripten.h>
#include <stdio.h>
#include <string.h>

#include "swephexp.h"

static char result_buffer[8192];

static void json_escape(const char *source, char *destination, size_t size) {
  size_t output = 0;
  for (size_t input = 0; source[input] != '\0' && output + 2 < size; input += 1) {
    unsigned char value = (unsigned char) source[input];
    if (value == '"' || value == '\\') {
      destination[output++] = '\\';
      destination[output++] = (char) value;
    } else if (value == '\n' || value == '\r' || value == '\t') {
      destination[output++] = '\\';
      destination[output++] = value == '\n' ? 'n' : value == '\r' ? 'r' : 't';
    } else if (value >= 0x20) {
      destination[output++] = (char) value;
    }
  }
  destination[output] = '\0';
}

EMSCRIPTEN_KEEPALIVE
const char *astro_spike_version(void) {
  static char version[64];
  memset(version, 0, sizeof(version));
  swe_version(version);
  return version;
}

EMSCRIPTEN_KEEPALIVE
void astro_spike_init(const char *ephemeris_path) {
  swe_close();
  swe_set_ephe_path(ephemeris_path);
}

EMSCRIPTEN_KEEPALIVE
double astro_spike_julday(
  int year,
  int month,
  int day,
  double utc_hour
) {
  return swe_julday(year, month, day, utc_hour, SE_GREG_CAL);
}

EMSCRIPTEN_KEEPALIVE
const char *astro_spike_calculate_body(
  double julian_day_ut,
  int body,
  int requested_flags
) {
  double values[6] = {0};
  char error[AS_MAXCH] = {0};
  char escaped_error[AS_MAXCH * 2] = {0};
  int effective_flags = swe_calc_ut(
    julian_day_ut,
    body,
    requested_flags,
    values,
    error
  );
  json_escape(error, escaped_error, sizeof(escaped_error));

  snprintf(
    result_buffer,
    sizeof(result_buffer),
    "{\"body\":%d,\"requestedFlags\":%d,\"effectiveFlags\":%d,"
    "\"longitude\":%.15f,\"latitude\":%.15f,\"distance\":%.15f,"
    "\"longitudeSpeed\":%.15f,\"latitudeSpeed\":%.15f,"
    "\"distanceSpeed\":%.15f,\"retrograde\":%s,\"error\":\"%s\"}",
    body,
    requested_flags,
    effective_flags,
    values[0],
    values[1],
    values[2],
    values[3],
    values[4],
    values[5],
    values[3] < 0 ? "true" : "false",
    escaped_error
  );
  return result_buffer;
}

EMSCRIPTEN_KEEPALIVE
const char *astro_spike_calculate_houses(
  double julian_day_ut,
  double latitude,
  double longitude,
  int house_system
) {
  double cusps[13] = {0};
  double angles[10] = {0};
  double cusp_speeds[13] = {0};
  double angle_speeds[10] = {0};
  char error[AS_MAXCH] = {0};
  char escaped_error[AS_MAXCH * 2] = {0};
  int return_code = swe_houses_ex2(
    julian_day_ut,
    0,
    latitude,
    longitude,
    house_system,
    cusps,
    angles,
    cusp_speeds,
    angle_speeds,
    error
  );
  json_escape(error, escaped_error, sizeof(escaped_error));
  int offset = snprintf(
    result_buffer,
    sizeof(result_buffer),
    "{\"requestedHouseSystem\":\"%c\",\"returnCode\":%d,"
    "\"ascendant\":%.15f,\"mc\":%.15f,\"cusps\":[",
    house_system,
    return_code,
    angles[SE_ASC],
    angles[SE_MC]
  );

  for (int house = 1; house <= 12; house += 1) {
    offset += snprintf(
      result_buffer + offset,
      sizeof(result_buffer) - (size_t) offset,
      "%s%.15f",
      house == 1 ? "" : ",",
      cusps[house]
    );
  }

  snprintf(
    result_buffer + offset,
    sizeof(result_buffer) - (size_t) offset,
    "],\"error\":\"%s\"}",
    escaped_error
  );
  return result_buffer;
}
