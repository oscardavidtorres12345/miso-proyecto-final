interface KpiCardProps {
  label: string;
  value: string | number;
}

const KpiCard = ({ label, value }: KpiCardProps) => (
  <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#7DA10D]/20 flex flex-col gap-1">
    <span className="text-s text-gray-500 font-medium">{label}</span>
    <span className="text-5xl font-bold text-[#213500] leading-tight">{value}</span>
  </div>
);

export default KpiCard;
