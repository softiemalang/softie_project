#include <locale.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "SpiceUsr.h"
static const int ids[] = {1,2,4,5,6,7,8,9,10,301};
static const char *names[] = {"MERCURY BARYCENTER","VENUS BARYCENTER","MARS BARYCENTER","JUPITER BARYCENTER","SATURN BARYCENTER","URANUS BARYCENTER","NEPTUNE BARYCENTER","PLUTO BARYCENTER","SUN","MOON"};
static const char *types[] = {"barycenter","barycenter","barycenter","barycenter","barycenter","barycenter","barycenter","barycenter","body","body"};
static void fail(const char *m) { fprintf(stderr,"%s\n",m); kclear_c(); exit(1); }
int main(int argc,char **argv) { setlocale(LC_NUMERIC,"C"); erract_c("SET",6,"RETURN"); if(argc<2){fprintf(stderr,"mode required\n");return 2;} if(!strcmp(argv[1],"--version")){puts("{\"runnerVersion\":\"de405-canonical-v2-runner\",\"cspiceToolkitVersion\":\"N0067\",\"testOnly\":false}");return 0;} const char *spk=NULL,*out=NULL,*start=NULL; int count=7342; double step=864000; for(int i=2;i+1<argc;i++){if(!strcmp(argv[i],"--spk"))spk=argv[++i];else if(!strcmp(argv[i],"--output"))out=argv[++i];else if(!strcmp(argv[i],"--start-et"))start=argv[++i];else if(!strcmp(argv[i],"--count"))count=atoi(argv[++i]);else if(!strcmp(argv[i],"--step-seconds"))step=atof(argv[++i]);} if(strcmp(argv[1],"--generate-regular-grid")||!spk||!out||!start)fail("missing regular-grid arguments"); furnsh_c(spk); if(failed_c())fail("SPK load failed"); FILE *f=fopen(out,"wb"); if(!f)fail("output open failed"); double s=atof(start); for(int i=0;i<count;i++){double et=s+i*step; for(int j=0;j<10;j++){double st[6],lt; spkez_c(ids[j],et,"J2000","NONE",399,st,&lt); if(failed_c())fail("spkez_c failed"); fprintf(f,"{\"schemaVersion\":\"de405-canonical-v2\",\"etSeconds\":\"%.16e\",\"targetId\":%d,\"target\":\"%s\",\"targetType\":\"%s\",\"observerId\":399,\"observer\":\"EARTH\",\"frame\":\"J2000\",\"aberrationCorrection\":\"NONE\",\"positionKm\":{\"x\":\"%.16e\",\"y\":\"%.16e\",\"z\":\"%.16e\"},\"velocityKmPerSecond\":{\"x\":\"%.16e\",\"y\":\"%.16e\",\"z\":\"%.16e\"}}\n",et,ids[j],names[j],types[j],st[0],st[1],st[2],st[3],st[4],st[5]);}} fclose(f); kclear_c(); return 0; }
