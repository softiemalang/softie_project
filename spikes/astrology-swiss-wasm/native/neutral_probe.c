#include <emscripten/emscripten.h>

EMSCRIPTEN_KEEPALIVE
int astro_asset_probe(int left, int right) {
  return left + right;
}
