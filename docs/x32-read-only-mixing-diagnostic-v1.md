# X32 read-only mixing diagnostic foundation v1

상태: `fixture_verified`, 실제 콘솔 연결은 이 작업에서 수행하지 않음.

이 기능은 X32/M32 OSC를 통해 상태를 관찰하고 관찰된 사실만 진단에 제공하는 최소 기반이다. 이 저장소의 수집기는 setter, scene recall, scene/snippet/preset 저장·복원, phantom power, preamp gain/trim 변경, fader·mute·EQ 변경, routing/inserts 변경 API를 제공하지 않는다.

## 공개 구현 검토 결과

검토 기준일은 2026-08-25 KST이다.

| 구현 | 직접 확인한 성격 | 이번 기반에서의 처리 |
| --- | --- | --- |
| [DXBMARK/x32-m32-osc-skill](https://github.com/DXBMARK/x32-m32-osc-skill) | `EXPLICIT`, `UNCERTAIN`, `CONFLICT`, `NOT FOUND`를 보존하는 source-grounded catalog; offline codec와 read-before-write 정책; live sender/MCP는 포함하지 않음 | 명시적으로 `EXPLICIT`인 identity, channel Get, meter 행만 좁은 allowlist로 반영 |
| [pmaillot/X32-Behringer](https://github.com/pmaillot/X32-Behringer) | UDP OSC 송수신 도구와 raw command 입력. 문서 예제에 fader/name 설정, `/node`, `/xremote`가 함께 존재 | raw command parser와 write 경로는 복사하지 않음 |
| [tjoracoder/python-x32](https://github.com/tjoracoder/python-x32) | 문서화되지 않은 `/-stat` UI 메시지를 별도로 열거하고 packet capture를 사용하도록 안내 | UI 상태와 audio 상태를 섞지 않으며 `/-stat`는 기본 수집에서 제외 |
| [anteriovieira/osc-mcp-server](https://github.com/anteriovieira/osc-mcp-server) | fader, mute, EQ, scene 등 bidirectional control과 `/xremote` keep-alive를 제공 | 이번 범위의 read-only contract와 권한 모델에 맞지 않아 runtime dependency로 사용하지 않음 |

DXBMARK가 인용한 OSC 문서는 community-authored unofficial reference이며 firmware 4.0 이상 범위를 명시한다. 따라서 이 구현은 공개 catalog의 source status를 런타임에 추론하거나 보정하지 않고, 아래에 적은 주소만 코드에 고정한다. 주소가 catalog에 없거나 불확실한 경우 query builder에서 만들 수 없다.

## 허용된 관찰 집합

모든 parameter query는 argument가 없는 OSC Get이다. fader와 preamp trim은 실제 dB로 변환하지 않고 direct OSC의 raw normalized float로 보존한다.

| 목적 | 요청 | 응답 계약 |
| --- | --- | --- |
| identity | `/info` | `ssss`: server version, server name, model, firmware |
| extended identity | `/xinfo` | `ssss`: network address, network name, model, firmware |
| status | `/status` | `sss`: state, IP, server name |
| channel name | `/ch/NN/config/name` | `s` |
| channel mix fader | `/ch/NN/mix/fader` | `f`, `0..1` raw normalized value |
| channel mix on/mute | `/ch/NN/mix/on` | `i`, OFF/ON; helper output is `mute` boolean |
| channel preamp trim | `/ch/NN/preamp/trim` | `f`, `0..1` raw normalized value |
| channel EQ enabled | `/ch/NN/eq/on` | `i`, OFF/ON |
| one-channel meter | `/meters ,siii "/meters/6" <channel-1> 0 99` | `/meters/6 ,b`; four little-endian native floats: pre-fade, gate GR, dynamics GR, post-fade |

`NN`은 `01..32`만 허용한다. meter time factor `99`는 짧은 관찰 window를 위한 고정값이며 collector는 첫 유효 응답 뒤 socket을 닫는다. `/xremote`, `/renew`, `/subscribe`, `/formatsubscribe`, `/batchsubscribe`, `/unsubscribe`는 console-side lifecycle을 만들거나 갱신하므로 이 기반에서는 전송하지 않는다. `/-stat`는 UI 관찰 트리이고 audio signal diagnostic과 다르며, catalog에 불확실·충돌 상태가 있는 행이 있어 사용하지 않는다. `/node`도 grouped text semantics가 write로 이어질 수 있어 제외한다.

## 구현 표면

- [`src/music/x32ReadOnlyDiagnostic.js`](../src/music/x32ReadOnlyDiagnostic.js)
  - exact query plan과 NUL padding/4-byte alignment을 포함한 OSC encode/decode
  - `int32`, `float32`, string, blob decode
  - meter 6의 big-endian size + little-endian count/float 경계 보존
  - exact IP/model/firmware identity gate
  - injected transport 기반 state collection과 observation-only diagnostics
- [`src/music/x32ReadOnlyUdp.js`](../src/music/x32ReadOnlyUdp.js)
  - Node 전용 UDP adapter
  - destination은 항상 supplied IPv4와 UDP `10023`
  - source IP/port가 일치하는 reply만 수용
  - timeout, retry, keep-alive, raw packet pass-through 없음
- [`test/fixtures/x32ReadOnlyDiagnosticFixture.js`](../test/fixtures/x32ReadOnlyDiagnosticFixture.js)
  - 실제 network 없이 사용할 raw OSC reply hex fixture
- [`test/x32ReadOnlyDiagnostic.test.js`](../test/x32ReadOnlyDiagnostic.test.js)
  - deterministic bytes, malformed/bundle rejection, meter endian decode, identity gate, no-write collection 검증

결과 envelope의 `status: read_only_observed`는 fixture 또는 주입된 transport가 모든 허용 조회에 응답했다는 뜻이다. 실제 콘솔이 연결되었다거나 응답이 audio path의 원인을 확정한다는 뜻이 아니다. 진단 문장은 `observationOnly: true`이며, 단일 meter snapshot으로 routing, gain, cable, speaker, EQ 원인을 자동 확정하지 않는다.

## 실제 콘솔 연결의 최소 입력

다음 세 값을 모두 operator가 직접 제공해야 한다.

```js
const connection = {
  ip: '192.168.10.42',       // X32 Network 화면의 IPv4
  model: 'X32',              // /info 또는 본체/Setup에서 확인한 exact model token
  firmware: '4.06',          // /info 또는 Setup의 exact firmware string
}
```

허용 model token은 `X32`, `X32C`, `X32P`, `X32RACK`, `X32CORE`, `M32`, `M32C`, `M32R`이다. 제품 family가 같다는 이유로 model이나 firmware를 대체하지 않는다. identity 응답의 model·firmware·IP가 supplied 값과 하나라도 다르면 channel query를 시작하지 않고 `blocked`를 반환한다.

Node 측의 명시적 호출 예시는 다음과 같다.

```js
import { collectX32ReadOnlyStateOverUdp } from '../src/music/x32ReadOnlyUdp.js'

const result = await collectX32ReadOnlyStateOverUdp({
  connection,
  channels: [1, 2],
  timeoutMs: 1000,
})
```

실제 연결 전에 확인할 것은 X32와 실행 host가 같은 신뢰된 네트워크에 있고, X32 OSC UDP `10023` traffic이 방화벽에서 허용되며, 다른 controller가 임의의 write를 수행하지 않는지이다. 이 adapter는 authentication이나 delivery guarantee를 추가하지 않으므로 production control network의 보안·운영 정책을 대신하지 않는다.

## 검증 경계

현재 검증이 증명하는 것:

- 고정 raw bytes를 같은 입력으로 두 번 수집하면 같은 결과가 나온다.
- malformed padding, unsupported type, OSC bundle을 fail closed 한다.
- identity mismatch가 있으면 channel 상태를 읽지 않는다.
- 수집 요청은 exact allowlist에서만 만들어지고 `writesPermitted: false`, `stateChangingPacketsSent: 0`을 유지한다.
- fixture meter는 mixed-endian header와 little-endian float를 정해진 순서로 복원한다.

현재 검증하지 않은 것:

- 실제 X32/M32 hardware/firmware 응답과의 live interoperability
- 실제 console의 routing, cable, preamp, EQ, speaker 또는 RF 원인
- UDP packet loss 이후의 retry/reconciliation 정책
- 모든 model/firmware 조합

실제 콘솔 smoke test는 별도 승인 후 exact IP·model·firmware와 operator가 제공한 read-only window가 있을 때만 수행한다. write, scene recall, phantom power, gain/fader/EQ 변경은 이 smoke test의 대상이 아니다.
