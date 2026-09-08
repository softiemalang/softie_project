/**
 * Closed South-Korea 시·군·구 location mapping for the Base input surface.
 *
 * The UI only exposes the administrative label. Coordinates and timezone are
 * resolved from this code-bound snapshot; an unknown code never falls back to
 * a different location.
 */

export const KOREA_LOCATION_DATA_PROVENANCE = Object.freeze({
  schemaVersion: 'korea-sgg-location-provenance-v1',
  administrativeSource: Object.freeze({
    publisher: '행정안전부',
    title: '2026년 지방자치단체 행정구역 및 인구 현황(2025.12.31.기준)',
    referenceDate: '2025-12-31',
    url: 'https://mois.go.kr/frt/bbs/type001/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000055&nttId=128138',
  }),
  boundarySource: Object.freeze({
    publisher: 'admdongkor (통계청 SGIS 기반 가공 자료)',
    version: 'ver20251231',
    coordinateReferenceSystem: 'WGS84 / EPSG:4326',
    url: 'https://github.com/vuski/admdongkor/tree/master/ver20251231',
    rawUrl: 'https://raw.githubusercontent.com/vuski/admdongkor/master/ver20251231/HangJeongDong_ver20251231.geojson',
    sha256: 'e873fb7b94b917d1bf0005a386d480e5fb742fdd6ab7d3f52e62c3ba7f524d31',
    mappingKey: 'properties.sgg (5-digit 시군구 code)',
  }),
  coordinateSource: Object.freeze({
    publisher: 'admdongkor MDIS administrative-boundary center snapshot',
    coordinateReferenceSystem: 'Korea 2000 Unified CS / EPSG:5179',
    outputCoordinateReferenceSystem: 'WGS84 / EPSG:4326',
    url: 'https://raw.githubusercontent.com/vuski/admdongkor/master/%ED%86%B5%EA%B3%84%EC%B2%ADMDIS%EC%9D%B8%EA%B5%AC%EC%9A%A9_%ED%96%89%EC%A0%95%EA%B2%BD%EA%B3%84%EC%A4%91%EC%8B%AC%EC%A0%90/coordinate_UTMK_%EC%9D%B4%EB%A6%84%ED%8F%AC%ED%95%A8.tsv',
    sha256: 'e612605e957e71ea2770876331eb20965820590bc57e5a98a91bc9307a678ec9',
    mappingKey: 'ADMCD = 5-digit 시군구 code + 00000',
    conversion: 'deterministic inverse Transverse Mercator (EPSG:5179 → EPSG:4326)',
    fallbackPolicy: '대표점이 현재 경계 내부가 아니면 해당 경계 bbox의 고정 1/100 grid를 row-major 탐색해 첫 내부점을 사용하고 otherwise reject',
  }),
  timezone: 'Asia/Seoul',
  supportedCountry: '대한민국',
})

const LOCATION_ROWS = [
"11110|11|서울특별시|종로구|37.598991|126.967598|mdis_center_epsg5179",
"11140|11|서울특별시|중구|37.557793|126.992698|mdis_center_epsg5179",
"11170|11|서울특별시|용산구|37.533599|126.981793|mdis_center_epsg5179",
"11200|11|서울특별시|성동구|37.551496|127.041999|mdis_center_epsg5179",
"11215|11|서울특별시|광진구|37.548897|127.090095|mdis_center_epsg5179",
"11230|11|서울특별시|동대문구|37.583895|127.052697|mdis_center_epsg5179",
"11260|11|서울특별시|중랑구|37.595194|127.093896|mdis_center_epsg5179",
"11290|11|서울특별시|성북구|37.606997|127.027293|mdis_center_epsg5179",
"11305|11|서울특별시|강북구|37.646898|127.004891|mdis_center_epsg5179",
"11320|11|서울특별시|도봉구|37.666300|127.032689|mdis_center_epsg5179",
"11350|11|서울특별시|노원구|37.655196|127.070896|mdis_center_epsg5179",
"11380|11|서울특별시|은평구|37.617195|126.926495|mdis_center_epsg5179",
"11410|11|서울특별시|서대문구|37.582295|126.933989|mdis_center_epsg5179",
"11440|11|서울특별시|마포구|37.559895|126.900791|mdis_center_epsg5179",
"11470|11|서울특별시|양천구|37.525498|126.854293|mdis_center_epsg5179",
"11500|11|서울특별시|강서구|37.565594|126.821291|mdis_center_epsg5179",
"11530|11|서울특별시|구로구|37.495597|126.853589|mdis_center_epsg5179",
"11545|11|서울특별시|금천구|37.459397|126.899593|mdis_center_epsg5179",
"11560|11|서울특별시|영등포구|37.517391|126.910399|mdis_center_epsg5179",
"11590|11|서울특별시|동작구|37.497697|126.951700|mdis_center_epsg5179",
"11620|11|서울특별시|관악구|37.465397|126.950793|mdis_center_epsg5179",
"11650|11|서울특별시|서초구|37.478992|127.012990|mdis_center_epsg5179",
"11680|11|서울특별시|강남구|37.498597|127.056690|mdis_center_epsg5179",
"11710|11|서울특별시|송파구|37.504194|127.107491|mdis_center_epsg5179",
"11740|11|서울특별시|강동구|37.548892|127.147299|mdis_center_epsg5179",
"26110|26|부산광역시|중구|35.106392|129.031089|mdis_center_epsg5179",
"26140|26|부산광역시|서구|35.094798|129.019595|mdis_center_epsg5179",
"26170|26|부산광역시|동구|35.128599|129.045300|mdis_center_epsg5179",
"26200|26|부산광역시|영도구|35.075495|129.065596|mdis_center_epsg5179",
"26230|26|부산광역시|부산진구|35.166893|129.045793|mdis_center_epsg5179",
"26260|26|부산광역시|동래구|35.205396|129.079697|mdis_center_epsg5179",
"26290|26|부산광역시|남구|35.129992|129.093691|mdis_center_epsg5179",
"26320|26|부산광역시|북구|35.234095|129.021892|mdis_center_epsg5179",
"26350|26|부산광역시|해운대구|35.199396|129.146297|mdis_center_epsg5179",
"26380|26|부산광역시|사하구|35.079593|128.964198|mdis_center_epsg5179",
"26410|26|부산광역시|금정구|35.258197|129.091790|mdis_center_epsg5179",
"26440|26|부산광역시|강서구|35.111493|128.870900|mdis_center_epsg5179",
"26470|26|부산광역시|연제구|35.178800|129.085090|mdis_center_epsg5179",
"26500|26|부산광역시|수영구|35.161493|129.113497|mdis_center_epsg5179",
"26530|26|부산광역시|사상구|35.156996|128.987991|mdis_center_epsg5179",
"26710|26|부산광역시|기장군|35.284192|129.193192|mdis_center_epsg5179",
"27110|27|대구광역시|중구|35.867495|128.595593|mdis_center_epsg5179",
"27140|27|대구광역시|동구|35.932598|128.682889|mdis_center_epsg5179",
"27170|27|대구광역시|서구|35.874695|128.548492|mdis_center_epsg5179",
"27200|27|대구광역시|남구|35.833895|128.581490|mdis_center_epsg5179",
"27230|27|대구광역시|북구|35.930997|128.580096|mdis_center_epsg5179",
"27260|27|대구광역시|수성구|35.834697|128.661793|mdis_center_epsg5179",
"27290|27|대구광역시|달서구|35.821191|128.526091|mdis_center_epsg5179",
"27710|27|대구광역시|달성군|35.888092|128.451094|mdis_center_epsg5179",
"27720|27|대구광역시|군위군|36.167492|128.724889|mdis_center_epsg5179",
"28110|28|인천광역시|중구|37.478298|126.471792|mdis_center_epsg5179",
"28140|28|인천광역시|동구|37.481992|126.635900|mdis_center_epsg5179",
"28177|28|인천광역시|미추홀구|37.456700|126.664695|mdis_center_epsg5179",
"28185|28|인천광역시|연수구|37.391094|126.633894|mdis_center_epsg5179",
"28200|28|인천광역시|남동구|37.430499|126.738295|mdis_center_epsg5179",
"28237|28|인천광역시|부평구|37.494393|126.717194|mdis_center_epsg5179",
"28245|28|인천광역시|계양구|37.558800|126.735995|mdis_center_epsg5179",
"28260|28|인천광역시|서구|37.556994|126.647296|mdis_center_epsg5179",
"28710|28|인천광역시|강화군|37.706892|126.437490|mdis_center_epsg5179",
"28720|28|인천광역시|옹진군|37.949199|124.670291|mdis_center_epsg5179",
"29110|29|광주광역시|동구|35.118697|126.957189|mdis_center_epsg5179",
"29140|29|광주광역시|서구|35.134592|126.853894|mdis_center_epsg5179",
"29155|29|광주광역시|남구|35.102598|126.877692|mdis_center_epsg5179",
"29170|29|광주광역시|북구|35.186895|126.911297|mdis_center_epsg5179",
"29200|29|광주광역시|광산구|35.164195|126.738991|mdis_center_epsg5179",
"30110|30|대전광역시|동구|36.313991|127.468998|mdis_center_epsg5179",
"30140|30|대전광역시|중구|36.278091|127.401693|mdis_center_epsg5179",
"30170|30|대전광역시|서구|36.278692|127.340596|mdis_center_epsg5179",
"30200|30|대전광역시|유성구|36.381997|127.345090|mdis_center_epsg5179",
"30230|30|대전광역시|대덕구|36.411095|127.442292|mdis_center_epsg5179",
"31110|31|울산광역시|중구|35.570992|129.306890|mdis_center_epsg5179",
"31140|31|울산광역시|남구|35.507092|129.340297|mdis_center_epsg5179",
"31170|31|울산광역시|동구|35.522000|129.424798|mdis_center_epsg5179",
"31200|31|울산광역시|북구|35.597596|129.397699|mdis_center_epsg5179",
"31710|31|울산광역시|울주군|35.527199|129.141498|mdis_center_epsg5179",
"36110|36|세종특별자치시|세종시|36.504863|127.256772|mdis_center_epsg5179",
"41111|41|경기도|수원시 장안구|37.317996|127.003896|mdis_center_epsg5179",
"41113|41|경기도|수원시 권선구|37.263698|126.964893|mdis_center_epsg5179",
"41115|41|경기도|수원시 팔달구|37.274995|127.015797|mdis_center_epsg5179",
"41117|41|경기도|수원시 영통구|37.276596|127.056292|mdis_center_epsg5179",
"41131|41|경기도|성남시 수정구|37.436099|127.105496|mdis_center_epsg5179",
"41133|41|경기도|성남시 중원구|37.440199|127.170091|mdis_center_epsg5179",
"41135|41|경기도|성남시 분당구|37.375199|127.094091|mdis_center_epsg5179",
"41150|41|경기도|의정부시|37.733091|127.066497|mdis_center_epsg5179",
"41171|41|경기도|안양시 만안구|37.403898|126.902691|mdis_center_epsg5179",
"41173|41|경기도|안양시 동안구|37.401294|126.955092|mdis_center_epsg5179",
"41192|41|경기도|부천시 원미구|37.502550|126.782423|mdis_center_epsg5179",
"41194|41|경기도|부천시 소사구|37.474459|126.790563|mdis_center_epsg5179",
"41196|41|경기도|부천시 오정구|37.530229|126.792762|mdis_center_epsg5179",
"41210|41|경기도|광명시|37.447293|126.866995|mdis_center_epsg5179",
"41220|41|경기도|평택시|37.024393|127.004789|mdis_center_epsg5179",
"41250|41|경기도|동두천시|37.920192|127.065993|mdis_center_epsg5179",
"41271|41|경기도|안산시 상록구|37.321196|126.857693|mdis_center_epsg5179",
"41273|41|경기도|안산시 단원구|37.327192|126.794692|mdis_center_epsg5179",
"41281|41|경기도|고양시 덕양구|37.661692|126.900700|mdis_center_epsg5179",
"41285|41|경기도|고양시 일산동구|37.681195|126.805190|mdis_center_epsg5179",
"41287|41|경기도|고양시 일산서구|37.671599|126.725995|mdis_center_epsg5179",
"41290|41|경기도|과천시|37.433993|127.003595|mdis_center_epsg5179",
"41310|41|경기도|구리시|37.602199|127.132999|mdis_center_epsg5179",
"41360|41|경기도|남양주시|37.643694|127.257494|mdis_center_epsg5179",
"41370|41|경기도|오산시|37.162893|127.051495|mdis_center_epsg5179",
"41390|41|경기도|시흥시|37.390496|126.805600|mdis_center_epsg5179",
"41410|41|경기도|군포시|37.342699|126.921691|mdis_center_epsg5179",
"41430|41|경기도|의왕시|37.358296|126.988895|mdis_center_epsg5179",
"41450|41|경기도|하남시|37.530696|127.211400|mdis_center_epsg5179",
"41461|41|경기도|용인시 처인구|37.222294|127.240894|mdis_center_epsg5179",
"41463|41|경기도|용인시 기흥구|37.270094|127.128899|mdis_center_epsg5179",
"41465|41|경기도|용인시 수지구|37.332995|127.088595|mdis_center_epsg5179",
"41480|41|경기도|파주시|37.846896|126.807389|mdis_center_epsg5179",
"41500|41|경기도|이천시|37.202195|127.450992|mdis_center_epsg5179",
"41550|41|경기도|안성시|37.024998|127.306098|mdis_center_epsg5179",
"41570|41|경기도|김포시|37.682193|126.595999|mdis_center_epsg5179",
"41590|41|경기도|화성시|37.153092|126.914490|mdis_center_epsg5179",
"41610|41|경기도|광주시|37.400600|127.291893|mdis_center_epsg5179",
"41630|41|경기도|양주시|37.805199|127.013992|mdis_center_epsg5179",
"41650|41|경기도|포천시|37.971199|127.237191|mdis_center_epsg5179",
"41670|41|경기도|여주시|37.286796|127.643895|mdis_center_epsg5179",
"41800|41|경기도|연천군|38.109596|126.977294|mdis_center_epsg5179",
"41820|41|경기도|가평군|37.811492|127.407591|mdis_center_epsg5179",
"41830|41|경기도|양평군|37.519294|127.581297|mdis_center_epsg5179",
"43111|43|충청북도|청주시 상당구|36.406382|127.507487|boundary_interior_fallback",
"43112|43|충청북도|청주시 서원구|36.548093|127.415799|mdis_center_epsg5179",
"43113|43|충청북도|청주시 흥덕구|36.632793|127.436098|mdis_center_epsg5179",
"43114|43|충청북도|청주시 청원구|36.712195|127.509293|mdis_center_epsg5179",
"43130|43|충청북도|충주시|37.006291|127.869399|mdis_center_epsg5179",
"43150|43|충청북도|제천시|37.035494|128.154296|mdis_center_epsg5179",
"43720|43|충청북도|보은군|36.490893|127.727899|mdis_center_epsg5179",
"43730|43|충청북도|옥천군|36.307993|127.652190|mdis_center_epsg5179",
"43740|43|충청북도|영동군|36.163196|127.795792|mdis_center_epsg5179",
"43745|43|충청북도|증평군|36.780492|127.592490|mdis_center_epsg5179",
"43750|43|충청북도|진천군|36.879999|127.440897|mdis_center_epsg5179",
"43760|43|충청북도|괴산군|36.774291|127.836491|mdis_center_epsg5179",
"43770|43|충청북도|음성군|36.994000|127.552291|mdis_center_epsg5179",
"43800|43|충청북도|단양군|36.978893|128.386399|mdis_center_epsg5179",
"44131|44|충청남도|천안시 동남구|36.756393|127.224992|mdis_center_epsg5179",
"44133|44|충청남도|천안시 서북구|36.878193|127.169393|mdis_center_epsg5179",
"44150|44|충청남도|공주시|36.477894|127.042995|mdis_center_epsg5179",
"44180|44|충청남도|보령시|36.350800|126.632097|mdis_center_epsg5179",
"44200|44|충청남도|아산시|36.794292|126.977793|mdis_center_epsg5179",
"44210|44|충청남도|서산시|36.810900|126.484700|mdis_center_epsg5179",
"44230|44|충청남도|논산시|36.201493|127.159592|mdis_center_epsg5179",
"44250|44|충청남도|계룡시|36.290996|127.224997|mdis_center_epsg5179",
"44270|44|충청남도|당진시|36.907099|126.646199|mdis_center_epsg5179",
"44710|44|충청남도|금산군|36.124700|127.469695|mdis_center_epsg5179",
"44760|44|충청남도|부여군|36.227994|126.871189|mdis_center_epsg5179",
"44770|44|충청남도|서천군|36.096997|126.734697|mdis_center_epsg5179",
"44790|44|충청남도|청양군|36.443296|126.847698|mdis_center_epsg5179",
"44800|44|충청남도|홍성군|36.566094|126.601600|mdis_center_epsg5179",
"44810|44|충청남도|예산군|36.665295|126.850395|mdis_center_epsg5179",
"44825|44|충청남도|태안군|36.781697|126.242590|mdis_center_epsg5179",
"46110|46|전라남도|목포시|34.812393|126.411890|mdis_center_epsg5179",
"46130|46|전라남도|여수시|34.764494|127.670196|mdis_center_epsg5179",
"46150|46|전라남도|순천시|35.009499|127.371100|mdis_center_epsg5179",
"46170|46|전라남도|나주시|34.988899|126.741099|mdis_center_epsg5179",
"46230|46|전라남도|광양시|35.035599|127.663290|mdis_center_epsg5179",
"46710|46|전라남도|담양군|35.290896|126.975794|mdis_center_epsg5179",
"46720|46|전라남도|곡성군|35.203698|127.284894|mdis_center_epsg5179",
"46730|46|전라남도|구례군|35.230896|127.501890|mdis_center_epsg5179",
"46770|46|전라남도|고흥군|34.634597|127.354891|mdis_center_epsg5179",
"46780|46|전라남도|보성군|34.811891|127.171398|mdis_center_epsg5179",
"46790|46|전라남도|화순군|35.019498|127.030398|mdis_center_epsg5179",
"46800|46|전라남도|장흥군|34.649494|126.957800|mdis_center_epsg5179",
"46810|46|전라남도|강진군|34.617796|126.731295|mdis_center_epsg5179",
"46820|46|전라남도|해남군|34.526799|126.563594|mdis_center_epsg5179",
"46830|46|전라남도|영암군|34.805498|126.668399|mdis_center_epsg5179",
"46840|46|전라남도|무안군|34.964394|126.464596|mdis_center_epsg5179",
"46860|46|전라남도|함평군|35.104093|126.549391|mdis_center_epsg5179",
"46870|46|전라남도|영광군|35.298593|126.490492|mdis_center_epsg5179",
"46880|46|전라남도|장성군|35.338498|126.769492|mdis_center_epsg5179",
"46890|46|전라남도|완도군|34.328798|126.824490|mdis_center_epsg5179",
"46900|46|전라남도|진도군|34.469694|126.256597|mdis_center_epsg5179",
"46910|46|전라남도|신안군|34.729595|126.130992|mdis_center_epsg5179",
"47111|47|경상북도|포항시 남구|35.962993|129.430789|mdis_center_epsg5179",
"47113|47|경상북도|포항시 북구|36.174294|129.193396|mdis_center_epsg5179",
"47130|47|경상북도|경주시|35.859593|129.207893|mdis_center_epsg5179",
"47150|47|경상북도|김천시|36.043495|128.050697|mdis_center_epsg5179",
"47170|47|경상북도|안동시|36.559298|128.724297|mdis_center_epsg5179",
"47190|47|경상북도|구미시|36.212292|128.362699|mdis_center_epsg5179",
"47210|47|경상북도|영주시|36.880491|128.534994|mdis_center_epsg5179",
"47230|47|경상북도|영천시|36.007498|128.915793|mdis_center_epsg5179",
"47250|47|경상북도|상주시|36.447093|128.096999|mdis_center_epsg5179",
"47280|47|경상북도|문경시|36.693200|128.133799|mdis_center_epsg5179",
"47290|47|경상북도|경산시|35.847692|128.802890|mdis_center_epsg5179",
"47730|47|경상북도|의성군|36.362200|128.594495|mdis_center_epsg5179",
"47750|47|경상북도|청송군|36.377698|129.096198|mdis_center_epsg5179",
"47760|47|경상북도|영양군|36.684200|129.136399|mdis_center_epsg5179",
"47770|47|경상북도|영덕군|36.470396|129.293798|mdis_center_epsg5179",
"47820|47|경상북도|청도군|35.706094|128.885296|mdis_center_epsg5179",
"47830|47|경상북도|고령군|35.730999|128.310893|mdis_center_epsg5179",
"47840|47|경상북도|성주군|35.916199|128.228689|mdis_center_epsg5179",
"47850|47|경상북도|칠곡군|36.004395|128.464494|mdis_center_epsg5179",
"47900|47|경상북도|예천군|36.652097|128.472689|mdis_center_epsg5179",
"47920|47|경상북도|봉화군|36.923294|128.901897|mdis_center_epsg5179",
"47930|47|경상북도|울진군|36.894792|129.284393|mdis_center_epsg5179",
"47940|47|경상북도|울릉군|37.505097|130.856993|mdis_center_epsg5179",
"48121|48|경상남도|창원시 의창구|35.303794|128.635796|mdis_center_epsg5179",
"48123|48|경상남도|창원시 성산구|35.196496|128.670999|mdis_center_epsg5179",
"48125|48|경상남도|창원시 마산합포구|35.136994|128.466797|mdis_center_epsg5179",
"48127|48|경상남도|창원시 마산회원구|35.227399|128.544492|mdis_center_epsg5179",
"48129|48|경상남도|창원시 진해구|35.123896|128.767697|mdis_center_epsg5179",
"48170|48|경상남도|진주시|35.200498|128.127096|mdis_center_epsg5179",
"48220|48|경상남도|통영시|34.869199|128.420195|mdis_center_epsg5179",
"48240|48|경상남도|사천시|35.038291|128.109189|mdis_center_epsg5179",
"48250|48|경상남도|김해시|35.274092|128.860496|mdis_center_epsg5179",
"48270|48|경상남도|밀양시|35.495896|128.765996|mdis_center_epsg5179",
"48310|48|경상남도|거제시|34.871500|128.608089|mdis_center_epsg5179",
"48330|48|경상남도|양산시|35.401199|129.047898|mdis_center_epsg5179",
"48720|48|경상남도|의령군|35.386092|128.287189|mdis_center_epsg5179",
"48730|48|경상남도|함안군|35.281595|128.441595|mdis_center_epsg5179",
"48740|48|경상남도|창녕군|35.526193|128.472194|mdis_center_epsg5179",
"48820|48|경상남도|고성군|35.009994|128.256794|mdis_center_epsg5179",
"48840|48|경상남도|남해군|34.823994|127.880789|mdis_center_epsg5179",
"48850|48|경상남도|하동군|35.135194|127.785594|mdis_center_epsg5179",
"48860|48|경상남도|산청군|35.397995|127.907795|mdis_center_epsg5179",
"48870|48|경상남도|함양군|35.544399|127.720899|mdis_center_epsg5179",
"48880|48|경상남도|거창군|35.714096|127.923694|mdis_center_epsg5179",
"48890|48|경상남도|합천군|35.600294|128.168000|mdis_center_epsg5179",
"50110|50|제주특별자치도|제주시|33.420094|126.482291|mdis_center_epsg5179",
"50130|50|제주특별자치도|서귀포시|33.338992|126.644891|mdis_center_epsg5179",
"51110|51|강원특별자치도|춘천시|37.879792|127.788399|mdis_center_epsg5179",
"51130|51|강원특별자치도|원주시|37.325293|127.902197|mdis_center_epsg5179",
"51150|51|강원특별자치도|강릉시|37.710599|128.882894|mdis_center_epsg5179",
"51170|51|강원특별자치도|동해시|37.516594|129.045297|mdis_center_epsg5179",
"51190|51|강원특별자치도|태백시|37.203099|128.956794|mdis_center_epsg5179",
"51210|51|강원특별자치도|속초시|38.175693|128.516491|mdis_center_epsg5179",
"51230|51|강원특별자치도|삼척시|37.257094|129.173192|mdis_center_epsg5179",
"51720|51|강원특별자치도|홍천군|37.749396|128.185890|mdis_center_epsg5179",
"51730|51|강원특별자치도|횡성군|37.491492|128.100890|mdis_center_epsg5179",
"51750|51|강원특별자치도|영월군|37.218293|128.458498|mdis_center_epsg5179",
"51760|51|강원특별자치도|평창군|37.543594|128.442396|mdis_center_epsg5179",
"51770|51|강원특별자치도|정선군|37.370397|128.704097|mdis_center_epsg5179",
"51780|51|강원특별자치도|철원군|38.215097|127.353496|mdis_center_epsg5179",
"51790|51|강원특별자치도|화천군|38.172899|127.691093|mdis_center_epsg5179",
"51800|51|강원특별자치도|양구군|38.172700|127.987594|mdis_center_epsg5179",
"51810|51|강원특별자치도|인제군|38.094595|128.246889|mdis_center_epsg5179",
"51820|51|강원특별자치도|고성군|38.402792|128.360991|mdis_center_epsg5179",
"51830|51|강원특별자치도|양양군|38.011899|128.623695|mdis_center_epsg5179",
"52111|52|전북특별자치도|전주시 완산구|35.787396|127.133293|mdis_center_epsg5179",
"52113|52|전북특별자치도|전주시 덕진구|35.851594|127.125500|mdis_center_epsg5179",
"52130|52|전북특별자치도|군산시|35.971496|126.713196|mdis_center_epsg5179",
"52140|52|전북특별자치도|익산시|36.018794|127.005696|mdis_center_epsg5179",
"52180|52|전북특별자치도|정읍시|35.610193|126.907693|mdis_center_epsg5179",
"52190|52|전북특별자치도|남원시|35.431693|127.480390|mdis_center_epsg5179",
"52210|52|전북특별자치도|김제시|35.792892|126.911995|mdis_center_epsg5179",
"52710|52|전북특별자치도|완주군|35.874692|127.245298|mdis_center_epsg5179",
"52720|52|전북특별자치도|진안군|35.823192|127.456691|mdis_center_epsg5179",
"52730|52|전북특별자치도|무주군|35.928295|127.716397|mdis_center_epsg5179",
"52740|52|전북특별자치도|장수군|35.653592|127.550199|mdis_center_epsg5179",
"52750|52|전북특별자치도|임실군|35.618399|127.260799|mdis_center_epsg5179",
"52770|52|전북특별자치도|순창군|35.427595|127.171395|mdis_center_epsg5179",
"52790|52|전북특별자치도|고창군|35.437596|126.589798|mdis_center_epsg5179",
"52800|52|전북특별자치도|부안군|35.684895|126.651790|mdis_center_epsg5179"
]

function createLocation([code, sidoCode, sidoName, sggName, latitude, longitude, coordinateMethod]) {
  const numericLatitude = Number(latitude)
  const numericLongitude = Number(longitude)
  return Object.freeze({
    id: 'sgg:' + code,
    code,
    sidoCode,
    sidoName,
    sggName,
    label: sidoName + ' ' + sggName,
    latitude: numericLatitude,
    longitude: numericLongitude,
    correctionMinutes: (135 - numericLongitude) * 4,
    timezone: KOREA_LOCATION_DATA_PROVENANCE.timezone,
    country: KOREA_LOCATION_DATA_PROVENANCE.supportedCountry,
    coordinateMethod,
    coordinateProvenance: KOREA_LOCATION_DATA_PROVENANCE.coordinateSource,
  })
}

export const KOREA_ADMINISTRATIVE_LOCATIONS = Object.freeze(
  LOCATION_ROWS.map((row) => createLocation(row.split('|'))),
)

const LOCATION_BY_ID = new Map(KOREA_ADMINISTRATIVE_LOCATIONS.map((location) => [location.id, location]))

export function getKoreaAdministrativeLocation(locationId) {
  return LOCATION_BY_ID.get(locationId) || null
}

export function searchKoreaAdministrativeLocations(query, limit = 20) {
  const terms = String(query || '')
    .trim()
    .toLocaleLowerCase('ko-KR')
    .split(/\s+/u)
    .filter(Boolean)
    .map((term) => term.replaceAll(' ', ''))
  if (terms.length === 0) return KOREA_ADMINISTRATIVE_LOCATIONS.slice(0, limit)
  return KOREA_ADMINISTRATIVE_LOCATIONS
    .filter((location) => {
      const haystack = (location.sidoName + ' ' + location.sggName + ' ' + location.code)
        .replaceAll(' ', '')
        .toLocaleLowerCase('ko-KR')
      return terms.every((term) => haystack.includes(term))
    })
    .slice(0, limit)
}

export function isVerifiedKoreaAdministrativeLocation(location) {
  return Boolean(
    location
      && /^\d{5}$/u.test(location.code)
      && location.id === 'sgg:' + location.code
      && location.country === KOREA_LOCATION_DATA_PROVENANCE.supportedCountry
      && location.timezone === KOREA_LOCATION_DATA_PROVENANCE.timezone
      && Number.isFinite(location.latitude)
      && Number.isFinite(location.longitude)
      && location.latitude >= 33
      && location.latitude <= 39
      && location.longitude >= 124
      && location.longitude <= 132
      && typeof location.coordinateMethod === 'string'
      && location.coordinateProvenance?.sha256 === KOREA_LOCATION_DATA_PROVENANCE.coordinateSource.sha256,
  )
}

if (
  KOREA_ADMINISTRATIVE_LOCATIONS.length !== 252
  || new Set(KOREA_ADMINISTRATIVE_LOCATIONS.map((location) => location.code)).size !== KOREA_ADMINISTRATIVE_LOCATIONS.length
  || KOREA_ADMINISTRATIVE_LOCATIONS.some((location) => !isVerifiedKoreaAdministrativeLocation(location))
) {
  throw new Error('Korea administrative location snapshot failed closed validation.')
}
