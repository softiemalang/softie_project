#include <fenv.h>
#include <float.h>
#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
static uint64_t bits(double x){uint64_t b;memcpy(&b,&x,8);return b;} static double val(uint64_t b){double x;memcpy(&x,&b,8);return x;}
int main(void){if(sizeof(double)!=8||DBL_MANT_DIG!=53||FLT_RADIX!=2||fegetround()!=FE_TONEAREST){fprintf(stderr,"binary64 environment contract failed\n");return 2;}char id[128],op[8],a[32],b[32];while(scanf("%127s %7s %31s %31s",id,op,a,b)==4){uint64_t x=strtoull(a+2,0,16),y=strtoull(b+2,0,16);double z;if(!strcmp(op,"add"))z=val(x)+val(y);else if(!strcmp(op,"sub"))z=val(x)-val(y);else if(!strcmp(op,"neg"))z=-val(x);else return 3;printf("%s 0x%016" PRIx64 "\n",id,bits(z));}return 0;}
