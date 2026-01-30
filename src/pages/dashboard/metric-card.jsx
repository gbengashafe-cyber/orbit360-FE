// Material Design Elevation Shadows
const ELEVATION = {
  1: 'shadow-sm', // 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)
  2: 'shadow', // 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)
  4: 'shadow-md', // 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)
  8: 'shadow-lg', // 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)
  16: 'shadow-xl', // 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)
};

export const MetricCard = ({ title, value, icon: Icon, color, trend }) => (
  <div
    className={`bg-white rounded-lg p-6 ${ELEVATION[4]} hover:${ELEVATION[8]} transition-all duration-200 cursor-pointer transform hover:scale-105`}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</p>
        <p className="text-3xl font-semibold text-gray-900 mt-2">{value}</p>
        {trend && (
          <p className={`text-sm mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}% from last month
          </p>
        )}
      </div>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center`} style={{ backgroundColor: color + '20' }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
    </div>
  </div>
);
