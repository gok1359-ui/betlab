type Props = {
  label: string;
};

function pickClass(label: string) {
  if (label.includes("강추천")) return "badge badge-strong";
  if (label.includes("중추천")) return "badge badge-medium";
  if (label.includes("약추천")) return "badge badge-weak";
  return "badge badge-watch";
}

export default function RecommendationBadge({ label }: Props) {
  return <span className={pickClass(label)}>{label}</span>;
}
