// 사주 계산을 위한 상수 정의

export const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
export const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']

export const TRINE_GROUPS = [
  { element: '수', branches: ['신', '자', '진'] },
  { element: '목', branches: ['해', '묘', '미'] },
  { element: '화', branches: ['인', '오', '술'] },
  { element: '금', branches: ['사', '유', '축'] }
]

export const BRANCH_RELATION_PAIRS = {
  he: [['자', '미'], ['축', '오'], ['인', '해'], ['묘', '진'], ['신', '해'], ['유', '술']],
  pa: [['유', '자'], ['축', '진'], ['인', '해'], ['묘', '오'], ['사', '신'], ['미', '술']],
  hyung: [['인', '사'], ['사', '신'], ['신', '인'], ['축', '술'], ['술', '미'], ['미', '축'], ['자', '묘'], ['묘', '자'], ['진', '진'], ['오', '오'], ['유', '유'], ['해', '해']]
}

export const HIDDEN_STEMS = {
  '자': [{ stem: '계', weight: 1.0 }],
  '축': [{ stem: '기', weight: 0.6 }, { stem: '계', weight: 0.3 }, { stem: '신', weight: 0.1 }],
  '인': [{ stem: '갑', weight: 0.6 }, { stem: '병', weight: 0.3 }, { stem: '무', weight: 0.1 }],
  '묘': [{ stem: '을', weight: 1.0 }],
  '진': [{ stem: '무', weight: 0.6 }, { stem: '을', weight: 0.3 }, { stem: '계', weight: 0.1 }],
  '사': [{ stem: '병', weight: 0.6 }, { stem: '경', weight: 0.3 }, { stem: '무', weight: 0.1 }],
  '오': [{ stem: '정', weight: 0.7 }, { stem: '기', weight: 0.3 }],
  '미': [{ stem: '기', weight: 0.6 }, { stem: '정', weight: 0.3 }, { stem: '을', weight: 0.1 }],
  '신': [{ stem: '경', weight: 0.6 }, { stem: '임', weight: 0.3 }, { stem: '무', weight: 0.1 }],
  '유': [{ stem: '신', weight: 1.0 }],
  '술': [{ stem: '무', weight: 0.6 }, { stem: '신', weight: 0.3 }, { stem: '정', weight: 0.1 }],
  '해': [{ stem: '임', weight: 0.7 }, { stem: '갑', weight: 0.3 }]
}

export const SEASONAL_ELEMENT_WEIGHTS = {
  '인': { seasonElement: '목', weights: { 목: 1.2, 화: 0.4, 토: 0.1 }, notes: ['봄의 시작', '목의 성장 기운'] },
  '묘': { seasonElement: '목', weights: { 목: 1.4, 화: 0.3 }, notes: ['봄의 중심', '목의 확장 기운'] },
  '진': { seasonElement: '목', weights: { 목: 0.8, 토: 0.6, 수: 0.2 }, notes: ['봄의 끝자락', '토의 정리 기운'] },
  '사': { seasonElement: '화', weights: { 화: 1.2, 토: 0.3, 금: 0.1 }, notes: ['여름의 시작', '화의 상승 기운'] },
  '오': { seasonElement: '화', weights: { 화: 1.4, 토: 0.3 }, notes: ['여름의 중심', '화의 발산 기운'] },
  '미': { seasonElement: '화', weights: { 화: 0.8, 토: 0.7, 목: 0.1 }, notes: ['여름의 끝자락', '토의 완충 기운'] },
  '신': { seasonElement: '금', weights: { 금: 1.2, 수: 0.3, 토: 0.1 }, notes: ['가을의 시작', '금의 정리 기운'] },
  '유': { seasonElement: '금', weights: { 금: 1.4 }, notes: ['가을의 중심', '금의 응축 기운'] },
  '술': { seasonElement: '금', weights: { 금: 0.8, 토: 0.7, 화: 0.1 }, notes: ['가을의 끝자락', '토의 저장 기운'] },
  '해': { seasonElement: '수', weights: { 수: 1.2, 목: 0.3 }, notes: ['겨울의 시작', '수의 저장 기운'] },
  '자': { seasonElement: '수', weights: { 수: 1.4 }, notes: ['겨울의 중심', '수의 응축 기운'] },
  '축': { seasonElement: '수', weights: { 수: 0.8, 토: 0.7, 금: 0.1 }, notes: ['겨울의 끝자락', '토의 보관 기운'] }
}

export const ELEMENTS = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수',
  '인': '목', '묘': '목',
  '사': '화', '오': '화',
  '진': '토', '미': '토', '술': '토', '축': '토',
  '신': '금', '유': '금',
  '해': '수', '자': '수'
}

export const YIN_YANG = {
  '갑': '양', '병': '양', '무': '양', '경': '양', '임': '양',
  '을': '음', '정': '음', '기': '음', '신': '음', '계': '음',
  '자': '양', '인': '양', '진': '양', '오': '양', '신': '양', '술': '양',
  '축': '음', '묘': '음', '사': '음', '미': '음', '유': '음', '해': '음'
}

export const TEN_GODS = {
  '비견': { description: '나와 같은 오행, 같은 음양' },
  '겁재': { description: '나와 같은 오행, 다른 음양' },
  '식신': { description: '내가 생하는 오행, 같은 음양' },
  '상관': { description: '내가 생하는 오행, 다른 음양' },
  '편재': { description: '내가 극하는 오행, 같은 음양' },
  '정재': { description: '내가 극하는 오행, 다른 음양' },
  '편관': { description: '나를 극하는 오행, 같은 음양' },
  '정관': { description: '나를 극하는 오행, 다른 음양' },
  '편인': { description: '나를 생하는 오행, 같은 음양' },
  '정인': { description: '나를 생하는 오행, 다른 음양' }
}

export const RELATIONSHIPS = {
  '생': { '목': '화', '화': '토', '토': '금', '금': '수', '수': '목' },
  '극': { '목': '토', '토': '수', '수': '화', '화': '금', '금': '목' }
}
