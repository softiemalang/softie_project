# Ephemeris Core v1 longitude-speed semantics audit

The contract is now `d/dt` of the same mean ecliptic-and-equinox-of-date longitude used by `longitudeDegrees`. For `r_date(t) = R(t)r_J2000(t)`, the implemented date-frame velocity is

`v_date = R(t)v_J2000(t) + R_dot(t)r_J2000(t)`

and `longitudeSpeedDegreesPerDay` is the XY angular-rate projection of that velocity. The prior implementation used only `R(t)v_J2000(t)`. That value remains available only as `frozenFrameSpeedDegreesPerDay`; it is not supplied to Rule Core.

The correction uses analytic derivatives of every Fukushima-Williams and mean-obliquity polynomial and of each elementary rotation matrix. It adds no DE405 evaluation. Position longitude is unchanged. Because the field meaning changed, the raw-chart and Ephemeris Core schema identifiers are v1; no v0 compatibility claim is made.

The independent oracle evaluates actual DE405 states at `t-2h, t-h, t, t+h, t+2h`, applies the date-specific transform at every epoch, unwraps each longitude around the center value, and uses the five-point central derivative. `TDB-TT` is supplied at every epoch by the deterministic explicit periodic fixture model. The golden materializer sweeps `h={86400,3600,600,60,10,1}` seconds and records both selected-step and full-sweep errors.

The deterministic golden fixture is synthetic (`2000-01-01T12:00:00Z`, longitude/latitude `0/0`, DUT1 `0`, TT-UTC `64.184 s`, explicit TDB-TT), not personal birth data. It records actual DE405 SPK identity, body mapping, all ten bodies, ASC/MC, Rule Core output, hashes, and the integration shield. Local kernel paths, native binaries, and SPK bytes are deliberately omitted.
