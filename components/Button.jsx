export const Button = ({ children, variant = "primary", className = "", onClick, fullWidth = false, ariaLabel }) => {
  const baseStyle = `min-h-[44px] font-medium rounded-full flex items-center justify-center gap-2 text-sm tracking-wide transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${fullWidth ? 'w-full py-4' : 'py-3 px-8'}`;

  const variants = {
    primary: "bg-[#0f172a] text-white hover:bg-[#1e293b] hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-[#0f172a]",
    gold: "bg-[#d4af37] text-[#0f172a] font-bold hover:bg-[#b4942b] shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-[#a18225]",
    outline: "border-2 border-[#0f172a] text-[#0f172a] hover:bg-[#0f172a] hover:text-white focus-visible:ring-[#0f172a]",
    ghost: "text-[#0f172a] hover:text-[#856404] hover:bg-gray-100 rounded-md focus-visible:ring-[#0f172a]"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  );
};

