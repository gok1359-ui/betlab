export const TEAM_KOR: Record<string, string> = {
  "Los Angeles Dodgers": "LA 다저스",
  "San Diego Padres": "샌디에이고 파드리스",
  "New York Yankees": "뉴욕 양키스",
  "Boston Red Sox": "보스턴 레드삭스",
  "San Francisco Giants": "샌프란시스코 자이언츠",
  "Texas Rangers": "텍사스 레인저스",
  "Houston Astros": "휴스턴 애스트로스",
  "Seattle Mariners": "시애틀 매리너스",
  "Toronto Blue Jays": "토론토 블루제이스",
  "Atlanta Braves": "애틀랜타 브레이브스",
  "Chicago Cubs": "시카고 컵스",
  "Philadelphia Phillies": "필라델피아 필리스",
  "St. Louis Cardinals": "세인트루이스 카디널스",
  "Arizona Diamondbacks": "애리조나 다이아몬드백스",
  "Los Angeles Angels": "LA 에인절스",
  "Cleveland Guardians": "클리블랜드 가디언스",
  "Detroit Tigers": "디트로이트 타이거스",
  "Kansas City Royals": "캔자스시티 로열스",
  "Minnesota Twins": "미네소타 트윈스",
  "Chicago White Sox": "시카고 화이트삭스",
  "Baltimore Orioles": "볼티모어 오리올스",
  "Tampa Bay Rays": "탬파베이 레이스",
  "Milwaukee Brewers": "밀워키 브루어스",
  "Cincinnati Reds": "신시내티 레즈",
  "Pittsburgh Pirates": "피츠버그 파이리츠",
  "Miami Marlins": "마이애미 말린스",
  "New York Mets": "뉴욕 메츠",
  "Washington Nationals": "워싱턴 내셔널스",
  "Colorado Rockies": "콜로라도 로키스",
  "Oakland Athletics": "오클랜드 애슬레틱스"
};

export function toKorTeamName(name: string) {
  return TEAM_KOR[name] || name;
}
