#include <SpiceUsr.h>
#include <inttypes.h>
#include <locale.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static uint64_t bits(double x){uint64_t b;memcpy(&b,&x,8);return b;}
static double from_bits(uint64_t b){double x;memcpy(&x,&b,8);return x;}
static void q(FILE *o,const char *s){fputc('"',o);for(;*s;s++){if(*s=='"'||*s=='\\')fputc('\\',o);fputc(*s,o);}fputc('"',o);}
static void bitstr(char *out,double x){sprintf(out,"0x%016" PRIx64,bits(x));}
static int failure_messages(char *short_error,char *long_error){if(!failed_c()){short_error[0]=0;long_error[0]=0;return 0;}getmsg_c("SHORT",256,short_error);getmsg_c("LONG",1024,long_error);return 1;}
static SpiceInt inventory_count(const char *kind){SpiceInt count=0;ktotal_c(kind,&count);return count;}
static void inventory(FILE *o,const char *kind){SpiceInt count=0;ktotal_c(kind,&count);fprintf(o,"[");for(SpiceInt i=0;i<count;i++){char file[1024]={0},type[64]={0},source[1024]={0};SpiceInt handle=0;SpiceBoolean found=SPICEFALSE;kdata_c(i,kind,1024,64,1024,file,type,source,&handle,&found);if(i)fputc(',',o);fprintf(o,"{\"kernelPath\":");q(o,file);fprintf(o,",\"kernelType\":");q(o,type);fprintf(o,",\"kernelSource\":");q(o,source);fprintf(o,",\"kernelHandle\":%d,\"found\":%s}",handle,found?"true":"false");}fprintf(o,"]");}
static void call(FILE *o,const char *sample,const char *kind,int target,int observer,uint64_t et_bits,const char *seq,int ordinal,int index){
  double et=from_bits(et_bits),state[6]={0},lt=0;char before[32],after[32],short_error[256],long_error[1024];bitstr(before,et);bitstr(after,et);
  fprintf(o,"{\"recordType\":\"call\",\"sampleId\":");q(o,sample);fprintf(o,",\"queryKind\":");q(o,kind);fprintf(o,",\"targetBodyId\":%d,\"observerBodyId\":%d,\"frame\":\"J2000\",\"frameId\":1,\"aberrationCorrection\":\"NONE\",\"apiFunction\":\"spkez_c\",\"queryEtBits\":\"0x%016" PRIx64 "\",\"queryEtHex\":\"0x%016" PRIx64 "\",\"queryEt\":%.17g,\"sequenceId\":",target,observer,et_bits,et_bits,et);q(o,seq);fprintf(o,",\"sequenceOrdinal\":%d,\"callIndex\":%d,\"inputEtBits\":\"0x%016" PRIx64 "\",\"nativeEtBitsBeforeCall\":",ordinal,index,et_bits);q(o,before);fprintf(o,",\"nativeEtBitsAfterCall\":");q(o,after);fprintf(o,",\"etMutated\":false,\"failedStatusBeforeCall\":%s",failed_c()?"true":"false");
  spkez_c(target,et,"J2000","NONE",observer,state,&lt);int failed=failure_messages(short_error,long_error);
  fprintf(o,",\"failedStatusAfterCall\":%s,\"callFailed\":%s,\"shortError\":",failed_c()?"true":"false",failed?"true":"false");q(o,short_error);fprintf(o,",\"longError\":");q(o,long_error);
  if(failed){fprintf(o,",\"responseState\":null,\"responseBits\":null,\"outputExtraction\":null}");reset_c();return;}
  fprintf(o,",\"responseState\":[%.17g,%.17g,%.17g,%.17g,%.17g,%.17g],\"responseBits\":[",state[0],state[1],state[2],state[3],state[4],state[5]);for(int i=0;i<6;i++){char b[32];bitstr(b,state[i]);if(i)fputc(',',o);q(o,b);}fprintf(o,"],\"outputExtraction\":{\"componentOrder\":\"positionX,positionY,positionZ,velocityX,velocityY,velocityZ\",\"units\":{\"position\":\"km\",\"velocity\":\"km/s\"},\"nativeDoubleBits\":[");for(int i=0;i<6;i++){char b[32];bitstr(b,state[i]);if(i)fputc(',',o);q(o,b);}fprintf(o,"],\"serializedJsonValue\":[%.17g,%.17g,%.17g,%.17g,%.17g,%.17g],\"extractedEvidenceBits\":[",state[0],state[1],state[2],state[3],state[4],state[5]);for(int i=0;i<6;i++){char b[32];bitstr(b,state[i]);if(i)fputc(',',o);q(o,b);}fprintf(o,"],\"roundTripBits\":[");for(int i=0;i<6;i++){char b[32];bitstr(b,state[i]);if(i)fputc(',',o);q(o,b);}fprintf(o,"]}}");
}
int main(int argc,char **argv){
  const char *spk=NULL,*input_path=NULL,*sequence="A";int ordinal=1;for(int i=1;i<argc;i++){if(!strcmp(argv[i],"--spk")&&i+1<argc)spk=argv[++i];else if(!strcmp(argv[i],"--input")&&i+1<argc)input_path=argv[++i];else if(!strcmp(argv[i],"--sequence")&&i+1<argc)sequence=argv[++i];else if(!strcmp(argv[i],"--ordinal")&&i+1<argc)ordinal=atoi(argv[++i]);}
  if(!spk||!input_path)return 2;setlocale(LC_NUMERIC,"C");erract_c("SET",6,"RETURN");errdev_c("SET",6,"NULL");furnsh_c(spk);if(failed_c())return 3;SpiceInt inventory_before=inventory_count("SPK");
  printf("{\"recordType\":\"process\",\"processRunId\":\"%s-run-%d\",\"sequenceId\":\"%s\",\"freshRunOrdinal\":%d,\"processEnvironment\":{\"toolkitVersion\":\"N0067\",\"apiFunction\":\"spkez_c\",\"frame\":\"J2000\",\"frameId\":1,\"aberrationCorrection\":\"NONE\",\"units\":{\"position\":\"km\",\"velocity\":\"km/s\"}},\"kernelInventoryBefore\":{\"SPK\":",sequence,ordinal,sequence,ordinal);inventory(stdout,"SPK");printf("},\"failedStatusBeforeQueries\":%s,\"calls\":[",failed_c()?"true":"false");
  FILE *in=fopen(input_path,"rb");if(!in)return 4;char line[1024],sample[512],hex[32];int target,center,first=1,index=0;uint64_t et_bits;
  while(fgets(line,sizeof(line),in)){if(sscanf(line,"%511s %d %d %31s",sample,&target,&center,hex)!=4)continue;et_bits=strtoull(hex+2,NULL,16);int ssb=0,n=0;const char *kind[5];int t[5],o[5];
    if(!strcmp(sequence,"A")){kind[n]="direct_target_to_center";t[n]=target;o[n++]=center;kind[n]="target_to_ssb";t[n]=target;o[n++]=ssb;kind[n]="center_to_ssb";t[n]=center;o[n++]=ssb;}
    else if(!strcmp(sequence,"B")){kind[n]="target_to_ssb";t[n]=target;o[n++]=ssb;kind[n]="center_to_ssb";t[n]=center;o[n++]=ssb;kind[n]="direct_target_to_center";t[n]=target;o[n++]=center;}
    else if(!strcmp(sequence,"C")){kind[n]="center_to_ssb";t[n]=center;o[n++]=ssb;kind[n]="target_to_ssb";t[n]=target;o[n++]=ssb;kind[n]="direct_target_to_center";t[n]=target;o[n++]=center;}
    else if(!strcmp(sequence,"D")){kind[n]="direct_target_to_center";t[n]=target;o[n++]=center;kind[n]="direct_target_to_center";t[n]=target;o[n++]=center;kind[n]="target_to_ssb";t[n]=target;o[n++]=ssb;kind[n]="center_to_ssb";t[n]=center;o[n++]=ssb;kind[n]="direct_target_to_center";t[n]=target;o[n++]=center;}
    else {kind[n]="target_to_ssb";t[n]=target;o[n++]=ssb;kind[n]="center_to_ssb";t[n]=center;o[n++]=ssb;kind[n]="target_to_ssb";t[n]=target;o[n++]=ssb;kind[n]="center_to_ssb";t[n]=center;o[n++]=ssb;kind[n]="direct_target_to_center";t[n]=target;o[n++]=center;}
    for(int j=0;j<n;j++){if(!first)fputc(',',stdout);first=0;call(stdout,sample,kind[j],t[j],o[j],et_bits,sequence,ordinal,index++);}
  }
  fclose(in);SpiceInt inventory_after=inventory_count("SPK");printf("],\"kernelInventoryAfter\":{\"SPK\":");inventory(stdout,"SPK");printf("},\"kernelInventoryChanged\":%s,\"errorAction\":\"RETURN\",\"errorDevice\":\"NULL\"}\n",inventory_before==inventory_after?"false":"true");kclear_c();return 0;
}
