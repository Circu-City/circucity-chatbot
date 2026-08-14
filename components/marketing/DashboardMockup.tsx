'use client';

const DashboardMockup = ({ variant = 'chat' }: { variant?: 'chat' | 'analytics' | 'conversations' }) => {
  if (variant === 'analytics') {
    return (
      <svg viewBox="0 0 800 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto rounded-xl shadow-lg border border-gray-200">
        <rect width="800" height="480" rx="12" fill="#0A1428" />
        <rect x="0" y="0" width="800" height="56" rx="12" fill="#121c3a" />
        <rect x="0" y="40" width="800" height="16" fill="#121c3a" />
        <circle cx="28" cy="28" r="8" fill="#A3E635" />
        <rect x="48" y="22" width="80" height="4" rx="2" fill="#A3E635" opacity="0.6" />
        <rect x="48" y="30" width="50" height="3" rx="1.5" fill="#fff" opacity="0.2" />
        <circle cx="760" cy="28" r="5" fill="#fff" opacity="0.15" />
        <circle cx="778" cy="28" r="5" fill="#fff" opacity="0.15" />
        {/* Sidebar */}
        <rect x="0" y="56" width="200" height="424" rx="0" fill="#121c3a" />
        {[0,1,2,3,4,5,6].map(i => (
          <g key={i}>
            <rect x="16" y={80 + i * 52} width="12" height="12" rx="3" fill={i === 0 ? '#A3E635' : '#fff'} opacity={i === 0 ? 1 : 0.1} />
            <rect x="36" y={82 + i * 52} width="60" height="4" rx="2" fill="#fff" opacity={i === 0 ? 0.6 : 0.1} />
            <rect x="36" y={90 + i * 52} width="40" height="3" rx="1.5" fill="#fff" opacity={i === 0 ? 0.3 : 0.08} />
          </g>
        ))}
        {/* Main content */}
        <rect x="220" y="76" width="560" height="12" rx="6" fill="#fff" opacity="0.08" />
        {/* Metric cards */}
        {[[228,108,160,90],[404,108,160,90],[580,108,160,90]].map(([x,y,w,h], i) => (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx="8" fill="#fff" opacity="0.04" stroke="#fff" strokeOpacity="0.06" strokeWidth="1" />
            <rect x={x+12} y={y+12} width="24" height="24" rx="6" fill="#A3E635" opacity="0.15" />
            <rect x={x+44} y={y+14} width="50" height="4" rx="2" fill="#fff" opacity="0.3" />
            <rect x={x+44} y={y+22} width="80" height="8" rx="4" fill="#A3E635" opacity="0.8" />
            <rect x={x+12} y={y+50} width="120" height="3" rx="1.5" fill="#fff" opacity="0.15" />
            <rect x={x+12} y={y+58} width="90" height="3" rx="1.5" fill="#fff" opacity="0.08" />
          </g>
        ))}
        {/* Chart area */}
        <rect x="228" y="216" width="340" height="190" rx="8" fill="#fff" opacity="0.04" stroke="#fff" strokeOpacity="0.06" strokeWidth="1" />
        <rect x="244" y="232" width="80" height="4" rx="2" fill="#fff" opacity="0.2" />
        {/* Chart bars */}
        {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => (
          <rect key={i} x={258 + i * 26} y={356 - ((i * 17 + 11) % 80)} width="14" height={((i * 31 + 7) % 80) + 20} rx="3" fill="#A3E635" opacity={0.3 + ((i * 13 + 5) % 40) * 0.01} />
        ))}
        {/* Right panel */}
        <rect x="582" y="216" width="198" height="190" rx="8" fill="#fff" opacity="0.04" stroke="#fff" strokeOpacity="0.06" strokeWidth="1" />
        <rect x="596" y="232" width="60" height="4" rx="2" fill="#fff" opacity="0.2" />
        {[0,1,2,3].map(i => (
          <g key={i}>
            <circle cx={610} cy={268 + i * 30} r="4" fill="#A3E635" opacity={0.5} />
            <rect x={622} y={266 + i * 30} width="110" height="3" rx="1.5" fill="#fff" opacity="0.12" />
            <rect x={622} y={272 + i * 30} width="70" height="3" rx="1.5" fill="#fff" opacity="0.08" />
          </g>
        ))}
      </svg>
    );
  }

  if (variant === 'conversations') {
    return (
      <svg viewBox="0 0 800 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto rounded-xl shadow-lg border border-gray-200">
        <rect width="800" height="480" rx="12" fill="#0A1428" />
        <rect x="0" y="0" width="800" height="56" rx="12" fill="#121c3a" />
        <rect x="0" y="40" width="800" height="16" fill="#121c3a" />
        <rect x="16" y="16" width="120" height="24" rx="6" fill="#A3E635" />
        <text x="28" y="32" fontSize="10" fontWeight="bold" fill="#0A1428">Conversations</text>
        <circle cx="760" cy="28" r="6" fill="#A3E635" opacity="0.3" />
        <circle cx="760" cy="28" r="3" fill="#A3E635" />
        {/* Left list */}
        <rect x="0" y="56" width="280" height="424" fill="#121c3a" />
        {[0,1,2,3,4,5,6,7].map(i => (
          <g key={i}>
            <rect x={i === 0 ? 0 : 0} y={60 + i * 48} width="280" height={48} fill="#A3E635" opacity={i === 0 ? 0.08 : 0} />
            <rect x={i === 0 ? 0 : 0} y={60 + i * 48} width="3" height={48} fill="#A3E635" opacity={i === 0 ? 1 : 0} />
            <circle cx={38} cy={84 + i * 48} r="14" fill="#A3E635" opacity="0.15" />
            <text x={32} y={88 + i * 48} fontSize="10" fontWeight="bold" fill="#A3E635" textAnchor="middle">{['JD','AL','MK','RS','TW','KP','BN','CL'][i]}</text>
            <rect x={60} y={76 + i * 48} width={i === 0 ? 140 : 100 + (i * 23 + 7) % 50} height="4" rx="2" fill="#fff" opacity={i === 0 ? 0.5 : 0.12} />
            <rect x={60} y={84 + i * 48} width={i === 0 ? 100 : 60 + (i * 29 + 3) % 40} height="3" rx="1.5" fill="#fff" opacity={i === 0 ? 0.25 : 0.06} />
            <rect x={220} y={76 + i * 48} width="40" height="3" rx="1.5" fill="#fff" opacity={0.05} />
            {i === 0 && <rect x="255" y={84} width="16" height="16" rx="8" fill="#A3E635" />}
            {i === 0 && <text x="263" y={94} fontSize="9" fontWeight="bold" fill="#0A1428" textAnchor="middle">3</text>}
          </g>
        ))}
        {/* Right conversation area */}
        <rect x="300" y="72" width="480" height="12" rx="6" fill="#fff" opacity="0.08" />
        <rect x="300" y="90" width="200" height="3" rx="1.5" fill="#fff" opacity="0.04" />
        {/* Chat messages */}
        <rect x="310" y="120" width="200" height="40" rx="10" fill="#A3E635" opacity="0.15" />
        <rect x="322" y="130" width="120" height="3" rx="1.5" fill="#fff" opacity="0.3" />
        <rect x="322" y="138" width="80" height="3" rx="1.5" fill="#fff" opacity="0.15" />
        <rect x="322" y="146" width="100" height="3" rx="1.5" fill="#fff" opacity="0.1" />
        <rect x="530" y="180" width="200" height="40" rx="10" fill="#fff" opacity="0.06" />
        <rect x="542" y="190" width="140" height="3" rx="1.5" fill="#fff" opacity="0.2" />
        <rect x="542" y="198" width="90" height="3" rx="1.5" fill="#fff" opacity="0.1" />
        <rect x="542" y="206" width="110" height="3" rx="1.5" fill="#fff" opacity="0.08" />
        <rect x="310" y="240" width="180" height="32" rx="10" fill="#A3E635" opacity="0.12" />
        <rect x="322" y="250" width="100" height="3" rx="1.5" fill="#fff" opacity="0.2" />
        <rect x="322" y="258" width="60" height="3" rx="1.5" fill="#fff" opacity="0.1" />
        <rect x="530" y="292" width="220" height="48" rx="10" fill="#fff" opacity="0.06" />
        <rect x="542" y="302" width="160" height="3" rx="1.5" fill="#fff" opacity="0.2" />
        <rect x="542" y="310" width="120" height="3" rx="1.5" fill="#fff" opacity="0.1" />
        <rect x="542" y="318" width="90" height="3" rx="1.5" fill="#fff" opacity="0.08" />
        {/* Input bar */}
        <rect x="300" y="420" width="480" height="40" rx="20" fill="#fff" opacity="0.06" stroke="#fff" strokeOpacity="0.08" strokeWidth="1" />
        <rect x="316" y="432" width="200" height="3" rx="1.5" fill="#fff" opacity="0.1" />
        <rect x="740" y="428" width="24" height="24" rx="6" fill="#A3E635" opacity="0.3" />
      </svg>
    );
  }

  // Default: chat widget mockup
  return (
    <svg viewBox="0 0 800 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto rounded-xl shadow-lg border border-gray-200">
      {/* Browser window chrome */}
      <rect width="800" height="480" rx="12" fill="#fff" />
      <rect x="0" y="0" width="800" height="40" rx="12" fill="#F3F4F6" />
      <rect x="0" y="24" width="800" height="16" fill="#F3F4F6" />
      <circle cx="20" cy="20" r="5" fill="#EF4444" />
      <circle cx="36" cy="20" r="5" fill="#F59E0B" />
      <circle cx="52" cy="20" r="5" fill="#10B981" />
      <rect x="80" y="14" width="400" height="14" rx="7" fill="#E5E7EB" />
      {/* Website background */}
      <rect x="0" y="40" width="800" height="440" fill="#FAFAFA" />
      {/* Navigation bar */}
      <rect x="0" y="40" width="800" height="48" fill="#0A1428" />
      <rect x="24" y="56" width="100" height="16" rx="4" fill="#A3E635" />
      <rect x="600" y="56" width="60" height="12" rx="4" fill="#fff" opacity="0.15" />
      <rect x="670" y="56" width="60" height="12" rx="4" fill="#fff" opacity="0.15" />
      <rect x="740" y="56" width="40" height="12" rx="4" fill="#A3E635" />
      {/* Hero section */}
      <rect x="60" y="120" width="400" height="12" rx="6" fill="#0A1428" opacity="0.8" />
      <rect x="60" y="140" width="300" height="8" rx="4" fill="#0A1428" opacity="0.4" />
      <rect x="60" y="160" width="340" height="8" rx="4" fill="#0A1428" opacity="0.3" />
      <rect x="60" y="190" width="160" height="40" rx="20" fill="#A3E635" />
      {/* Product cards */}
      <rect x="60" y="260" width="200" height="180" rx="12" fill="#fff" stroke="#E5E7EB" strokeWidth="1" />
      <rect x="80" y="280" width="160" height="100" rx="8" fill="#F3F4F6" />
      <rect x="80" y="392" width="140" height="6" rx="3" fill="#0A1428" opacity="0.6" />
      <rect x="80" y="404" width="100" height="5" rx="2.5" fill="#0A1428" opacity="0.3" />
      <rect x="80" y="418" width="60" height="6" rx="3" fill="#A3E635" />
      <rect x="290" y="260" width="200" height="180" rx="12" fill="#fff" stroke="#E5E7EB" strokeWidth="1" />
      <rect x="310" y="280" width="160" height="100" rx="8" fill="#F3F4F6" />
      <rect x="310" y="392" width="140" height="6" rx="3" fill="#0A1428" opacity="0.6" />
      <rect x="310" y="404" width="100" height="5" rx="2.5" fill="#0A1428" opacity="0.3" />
      <rect x="310" y="418" width="60" height="6" rx="3" fill="#A3E635" />
      {/* Chat widget bubble */}
      <rect x="600" y="320" width="180" height="120" rx="16" fill="#0A1428" />
      <rect x="600" y="320" width="180" height="36" rx="16" fill="#A3E635" />
      <circle cx="628" cy="338" r="10" fill="#0A1428" />
      <rect x="646" y="334" width="50" height="4" rx="2" fill="#0A1428" opacity="0.6" />
      <rect x="646" y="342" width="30" height="3" rx="1.5" fill="#0A1428" opacity="0.4" />
      <rect x="618" y="372" width="144" height="28" rx="14" fill="#fff" opacity="0.08" />
      <rect x="626" y="380" width="80" height="3" rx="1.5" fill="#fff" opacity="0.3" />
      <rect x="654" y="396" width="90" height="28" rx="14" fill="#A3E635" opacity="0.6" />
      <rect x="662" y="404" width="50" height="3" rx="1.5" fill="#fff" opacity="0.4" />
      {/* Chat launcher */}
      <circle cx="740" cy="430" r="24" fill="#A3E635" className="drop-shadow-lg" />
      <rect x="732" y="422" width="16" height="16" rx="3" fill="#0A1428" />
    </svg>
  );
};

export default DashboardMockup;

