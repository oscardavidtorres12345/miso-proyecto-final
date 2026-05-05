interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

const KpiCard = ({ label, value, icon }: KpiCardProps) => (
  <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#7DA10D]/20 flex flex-col gap-2">
    {icon && (
      <div className="w-8 h-8 rounded-full bg-[#7DA10D]/10 flex items-center justify-center text-[#7DA10D]">
        {icon}
      </div>
    )}
    <span className="text-sm text-gray-500 font-medium">{label}</span>
    <span className="text-3xl font-bold text-[#213500] leading-tight">{value}</span>
  </div>
);

export default KpiCard;
