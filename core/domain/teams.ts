export const TEAM_MAP: Record<string, string> = {
  'Arizona Diamondbacks': 'Diamondbacks',
  'Atlanta Braves': 'Braves',
  'Baltimore Orioles': 'Orioles',
  'Boston Red Sox': 'Red Sox',
  'Chicago Cubs': 'Cubs',
  'Chicago White Sox': 'White Sox',
  'Cincinnati Reds': 'Reds',
  'Cleveland Guardians': 'Guardians',
  'Colorado Rockies': 'Rockies',
  'Detroit Tigers': 'Tigers',
  'Houston Astros': 'Astros',
  'Kansas City Royals': 'Royals',
  'Los Angeles Angels': 'Angels',
  'Los Angeles Dodgers': 'Dodgers',
  'Miami Marlins': 'Marlins',
  'Milwaukee Brewers': 'Brewers',
  'Minnesota Twins': 'Twins',
  'New York Mets': 'Mets',
  'New York Yankees': 'Yankees',
  Athletics: 'Athletics',
  'Philadelphia Phillies': 'Phillies',
  'Pittsburgh Pirates': 'Pirates',
  'San Diego Padres': 'Padres',
  'San Francisco Giants': 'Giants',
  'Seattle Mariners': 'Mariners',
  'St. Louis Cardinals': 'Cardinals',
  'Tampa Bay Rays': 'Rays',
  'Texas Rangers': 'Rangers',
  'Toronto Blue Jays': 'Blue Jays',
  'Washington Nationals': 'Nationals'
};

export const TEAM_KO_MAP: Record<string, string> = {
  Diamondbacks: '애리조나',
  Braves: '애틀랜타',
  Orioles: '볼티모어',
  'Red Sox': '보스턴',
  Cubs: '컵스',
  'White Sox': '화이트삭스',
  Reds: '신시내티',
  Guardians: '클리블랜드',
  Rockies: '콜로라도',
  Tigers: '디트로이트',
  Astros: '휴스턴',
  Royals: '캔자스시티',
  Angels: '에인절스',
  Dodgers: '다저스',
  Marlins: '마이애미',
  Brewers: '밀워키',
  Twins: '미네소타',
  Mets: '메츠',
  Yankees: '양키스',
  Athletics: '애슬레틱스',
  Phillies: '필라델피아',
  Pirates: '피츠버그',
  Padres: '샌디에이고',
  Giants: '샌프란시스코',
  Mariners: '시애틀',
  Cardinals: '세인트루이스',
  Rays: '탬파베이',
  Rangers: '텍사스',
  'Blue Jays': '토론토',
  Nationals: '워싱턴'
};

export function normalizeTeamName(name: string) {
  return TEAM_MAP[name] ?? name;
}

export function teamNameKo(name: string) {
  return TEAM_KO_MAP[normalizeTeamName(name)] ?? normalizeTeamName(name);
}
