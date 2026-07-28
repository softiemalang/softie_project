#include <locale.h>
#include <math.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include "SpiceUsr.h"

static int parse_arg(int argc, char **argv, const char *name, const char **value)
{
    for (int i = 1; i + 1 < argc; ++i) {
        if (strcmp(argv[i], name) == 0) {
            *value = argv[i + 1];
            return 1;
        }
    }
    return 0;
}

static int convert(const char *input, SpiceDouble *et, const char *label)
{
    str2et_c(input, et);
    if (failed_c()) {
        char message[1841];
        getmsg_c("LONG", sizeof(message), message);
        fprintf(stderr, "%s conversion failed: %s\n", label, message);
        reset_c();
        return 0;
    }
    return 1;
}

int main(int argc, char **argv)
{
    const char *start = NULL;
    const char *end = NULL;
    SpiceDouble start_et;
    SpiceDouble end_et;

    setlocale(LC_NUMERIC, "C");
    erract_c("SET", 6, "RETURN");

    const char *lsk = getenv("SOFTIE_DE405_LSK");
    if (lsk == NULL || *lsk == '\0') {
        fprintf(stderr, "SOFTIE_DE405_LSK must point to naif0012.tls\n");
        return 2;
    }
    furnsh_c(lsk);
    if (failed_c()) {
        char message[1841];
        getmsg_c("LONG", sizeof(message), message);
        fprintf(stderr, "LSK load failed: %s\n", message);
        reset_c();
        return 1;
    }

    if (!parse_arg(argc, argv, "--start", &start) ||
        !parse_arg(argc, argv, "--end", &end)) {
        fprintf(stderr, "usage: %s --start \"... TDB\" --end \"... TDB\"\n", argv[0]);
        return 2;
    }
    if (!convert(start, &start_et, "start") || !convert(end, &end_et, "end")) {
        return 1;
    }
    if (!isfinite(start_et) || !isfinite(end_et) ||
        (start_et == 0.0 && signbit(start_et)) ||
        (end_et == 0.0 && signbit(end_et))) {
        fprintf(stderr, "non-finite or negative-zero ET result\n");
        return 1;
    }

    printf("{\n");
    printf("  \"schemaVersion\": \"de405-boundary-resolution-v1\",\n");
    printf("  \"toolkitVersion\": \"N0067\",\n");
    printf("  \"startInputTdb\": \"%s\",\n", start);
    printf("  \"regularGridStartEt\": \"%.16e\",\n", start_et);
    printf("  \"endInputTdb\": \"%s\",\n", end);
    printf("  \"regularGridEndExclusiveEt\": \"%.16e\"\n", end_et);
    printf("}\n");
    return 0;
}
