interface InsanoLogoProps {
  size?: number;
  className?: string;
}

const InsanoLogo = ({ size = 24, className = "" }: InsanoLogoProps) => {
  return (
    <div className={`font-cinzel font-bold tracking-tight text-primary flex items-center ${className}`} style={{ fontSize: size }}>
      miris no foco<span className="text-secondary-foreground">.</span>
    </div>
  );
};

export default InsanoLogo;
