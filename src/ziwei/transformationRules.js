/**
 * transformationRules.js
 *
 * 자미두수 사화(四化: 화록/화권/화과/화기) 매핑 규칙 및 버전 관리 모듈
 */

export const TRANSFORMATION_RULESET = {
  version: 'traditional_v1',
  description: '전통 자미두수 출생 연간 기반 4대 사화 매핑 규칙',
}

// 10개 연간(甲~癸)별 4대 사화(록, 권, 과, 기) 주성/보조성 ID 매핑
export const YEAR_STEM_TRANSFORMATIONS = {
  甲: { lu: 'lianzhen', quan: 'pojun', ke: 'wugu', ji: 'taiyang' },
  乙: { lu: 'tianji', quan: 'tianliang', ke: 'ziwei', ji: 'taiyin' },
  丙: { lu: 'tiandong', quan: 'tianji', ke: 'wenchang', ji: 'lianzhen' },
  丁: { lu: 'taiyin', quan: 'tiandong', ke: 'tianji', ji: 'jumen' },
  戊: { lu: 'tanlang', quan: 'taiyin', ke: 'youbi', ji: 'tianji' },
  己: { lu: 'wugu', quan: 'tanlang', ke: 'tianliang', ji: 'wengu' },
  庚: { lu: 'taiyang', quan: 'wugu', ke: 'taiyin', ji: 'tiandong' },
  辛: { lu: 'jumen', quan: 'taiyang', ke: 'wengu', ji: 'wenchang' },
  壬: { lu: 'tianliang', quan: 'ziwei', ke: 'tianfu', ji: 'wugu' },
  癸: { lu: 'pojun', quan: 'jumen', ke: 'taiyin', ji: 'tanlang' },
}

export const TRANSFORMATION_LABELS = {
  lu: { type: 'hua_lu', name: '화록', description: '재물, 유연함, 발전' },
  quan: { type: 'hua_quan', name: '화권', description: '권력, 과감함, 영향력' },
  ke: { type: 'hua_ke', name: '화과', description: '명예, 학문, 구원' },
  ji: { type: 'hua_ji', name: '화기', description: '장애, 집착, 주의 요망' },
}
