// 세대별 종족값 변경 데이터 (PokeAPI past_stats 기반)
// changedInGen: 해당 세대부터 새 종족값 적용
// oldStats: 변경 전 종족값 (변경된 항목만 기록)

export const STAT_CHANGES = {
  // ── 6세대(XY)부터 변경 ──────────────────────────────────────
  // 1세대
   12: { changedInGen: 6, oldStats: { 'special-attack': 80 } },          // 버터플
   15: { changedInGen: 6, oldStats: { 'attack': 80 } },                  // 독침붕
   18: { changedInGen: 6, oldStats: { 'speed': 91 } },                   // 피죤
   25: { changedInGen: 6, oldStats: { 'defense': 30, 'special-defense': 40 } }, // 피카츄
   26: { changedInGen: 6, oldStats: { 'speed': 100 } },                  // 라이츄
   31: { changedInGen: 6, oldStats: { 'attack': 82 } },                  // 니드퀸
   34: { changedInGen: 6, oldStats: { 'attack': 92 } },                  // 니드킹
   36: { changedInGen: 6, oldStats: { 'special-attack': 85 } },          // 픽시
   40: { changedInGen: 6, oldStats: { 'special-attack': 75 } },          // 푸크린
   45: { changedInGen: 6, oldStats: { 'special-attack': 100 } },         // 라플레시아
   62: { changedInGen: 6, oldStats: { 'attack': 85 } },                  // 강챙이
   65: { changedInGen: 6, oldStats: { 'special-defense': 85 } },         // 후딘
   71: { changedInGen: 6, oldStats: { 'special-defense': 60 } },         // 빅트리벨
   76: { changedInGen: 6, oldStats: { 'attack': 110 } },                 // 딱구리
  // 2세대
  181: { changedInGen: 6, oldStats: { 'defense': 75 } },                 // 전룡
  182: { changedInGen: 6, oldStats: { 'defense': 85 } },                 // 아르코
  184: { changedInGen: 6, oldStats: { 'special-attack': 50 } },          // 마릴리
  189: { changedInGen: 6, oldStats: { 'special-defense': 85 } },         // 솜솜코
  // 3세대
  267: { changedInGen: 6, oldStats: { 'special-attack': 90 } },          // 뷰티플라이
  295: { changedInGen: 6, oldStats: { 'special-defense': 63 } },         // 폭음룡
  // 4세대
  398: { changedInGen: 6, oldStats: { 'special-defense': 50 } },         // 찌르호크
  407: { changedInGen: 6, oldStats: { 'attack': 55 } },                  // 로즈레이드
  // 5세대
  508: { changedInGen: 6, oldStats: { 'attack': 100 } },                 // 거부왕
  521: { changedInGen: 6, oldStats: { 'attack': 105 } },                 // 켄호로우
  526: { changedInGen: 6, oldStats: { 'special-defense': 70 } },         // 암팰리스
  537: { changedInGen: 6, oldStats: { 'attack': 85 } },                  // 두꺼비왕
  542: { changedInGen: 6, oldStats: { 'special-defense': 70 } },         // 리피아
  545: { changedInGen: 6, oldStats: { 'attack': 90 } },                  // 왕지네
  553: { changedInGen: 6, oldStats: { 'defense': 70 } },                 // 크로코록크

  // ── 7세대(SM)부터 변경 ──────────────────────────────────────
  // 1세대
   24: { changedInGen: 7, oldStats: { 'attack': 85 } },                  // 아보크
   51: { changedInGen: 7, oldStats: { 'attack': 80 } },                  // 닥트리오
   83: { changedInGen: 7, oldStats: { 'attack': 65 } },                  // 파오리
   85: { changedInGen: 7, oldStats: { 'speed': 100 } },                  // 두트리오
  101: { changedInGen: 7, oldStats: { 'speed': 140 } },                  // 붐볼
  103: { changedInGen: 7, oldStats: { 'special-defense': 65 } },         // 나시
  // 2세대
  164: { changedInGen: 7, oldStats: { 'special-attack': 76 } },          // 야부엉
  168: { changedInGen: 7, oldStats: { 'special-defense': 60 } },         // 아리아도스
  // 3세대
  211: { changedInGen: 7, oldStats: { 'defense': 75 } },                 // 침바루
  219: { changedInGen: 7, oldStats: { 'hp': 50, 'special-attack': 80 } }, // 마그카르고
  222: { changedInGen: 7, oldStats: { 'hp': 55, 'defense': 85, 'special-defense': 85 } }, // 코산호
  226: { changedInGen: 7, oldStats: { 'hp': 65 } },                      // 만타인
  277: { changedInGen: 7, oldStats: { 'special-attack': 50 } },          // 스왈로
  279: { changedInGen: 7, oldStats: { 'special-attack': 85 } },          // 페리퍼
  284: { changedInGen: 7, oldStats: { 'special-attack': 80, 'speed': 60 } }, // 비나방
  301: { changedInGen: 7, oldStats: { 'speed': 70 } },                   // 에나비
  313: { changedInGen: 7, oldStats: { 'defense': 55, 'special-defense': 75 } }, // 볼비트
  314: { changedInGen: 7, oldStats: { 'defense': 55, 'special-defense': 75 } }, // 네오비트
  337: { changedInGen: 7, oldStats: { 'hp': 70 } },                      // 루나톤
  338: { changedInGen: 7, oldStats: { 'hp': 70 } },                      // 솔록
  358: { changedInGen: 7, oldStats: { 'hp': 65, 'defense': 70, 'special-defense': 80 } }, // 치링
  // 5세대
  527: { changedInGen: 7, oldStats: { 'hp': 55 } },                      // 코고미
  558: { changedInGen: 7, oldStats: { 'attack': 95 } },                  // 이와파르도
  614: { changedInGen: 7, oldStats: { 'attack': 110 } },                 // 두빈곰
  615: { changedInGen: 7, oldStats: { 'hp': 70, 'attack': 30 } },        // 크류폼

  // ── 8세대(SwSh)부터 변경 ─────────────────────────────────────
  // 6세대
  681: { changedInGen: 8, oldStats: { 'defense': 150, 'special-defense': 150 } }, // 애기슬래시

  // ── 9세대(SV)부터 변경 ──────────────────────────────────────
  // 8세대
  888: { changedInGen: 9, lastOldVersion: 'SwSh', oldStats: { 'attack': 130 } },  // 자시안 (BDSP·PLA 미등장)
  889: { changedInGen: 9, lastOldVersion: 'SwSh', oldStats: { 'attack': 130 } },  // 자마젠타 (BDSP·PLA 미등장)
};

// 세대 경계 버전 상수
export const GEN_LAST_VERSION  = { 5: 'BW2', 6: 'ORAS', 7: 'USUM', 8: 'PLA' };
export const GEN_FIRST_VERSION = { 6: 'XY',  7: 'SM',   8: 'SwSh', 9: 'SV'  };

// 특정 폼(메가 등)의 세대별 종족값 변경
// firstVersion: 해당 폼이 처음 등장한 버전
export const FORM_STAT_CHANGES = {
  'alakazam-mega':    { changedInGen: 7, firstVersion: 'XY',  oldStats: { 'special-defense': 95 } },
  // 자시안 검왕: SwSh 공격 170 → SV에서 하향 (BDSP·PLA 미등장)
  'zacian-crowned':    { changedInGen: 9, firstVersion: 'SwSh', lastOldVersion: 'SwSh', oldStats: { 'attack': 170 } },
  // 자마젠타 방패왕: SwSh 92/130/145/80/145/128 → SV에서 변경 (BDSP·PLA 미등장)
  'zamazenta-crowned': { changedInGen: 9, firstVersion: 'SwSh', lastOldVersion: 'SwSh', oldStats: { 'hp': 92, 'attack': 130, 'defense': 145, 'special-attack': 80, 'special-defense': 145, 'speed': 128 } },
};

// Champions 등장 포켓몬(184마리) 기준 스탯 평균값
export const CHAMPIONS_AVG_STATS = {
  'hp':               79.8,
  'attack':           89.9,
  'defense':          80.9,
  'special-attack':   81.1,
  'special-defense':  81.7,
  'speed':            76.2,
};
