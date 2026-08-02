FROM --platform=linux/amd64 docker.io/library/alpine@sha256:eafc1edb577d2e9b458664a15f23ea1c370214193226069eb22921169fc7e43f
RUN apk add musl=1.2.5-r12 binutils=2.44-r3 gcc=14.2.0-r6 clang20=20.1.8-r0 nodejs unzip tar gzip git \
 && mkdir -p /opt/de405-toolchain \
 && apk info -vv > /opt/de405-toolchain/package-info.txt \
 && cat /etc/apk/repositories > /opt/de405-toolchain/repositories.txt \
 && sha256sum /var/cache/apk/* > /opt/de405-toolchain/apkindex-sha256.txt \
 && sha256sum /lib/apk/db/installed > /opt/de405-toolchain/installed-db-sha256.txt \
 && sha256sum /lib/ld-musl-x86_64.so.1 /usr/bin/node /usr/bin/ar /usr/bin/ld /usr/bin/gcc /usr/bin/clang > /opt/de405-toolchain/tool-binary-sha256.txt \
 && sha256sum /lib/apk/db/installed /lib/ld-musl-x86_64.so.1 /usr/bin/node /usr/bin/ar /usr/bin/ld /usr/bin/gcc /usr/bin/clang | sha256sum | cut -d' ' -f1 > /opt/de405-toolchain/filesystem-sha256.txt \
 && test "$(uname -m)" = x86_64
