export const NavLink = ({ item, onClick, isScrolled, isMobile }) => {
  const mobileClasses = "text-2xl font-serif font-bold text-[#0f172a] py-3";
  const textLinkClasses = "text-sm font-medium hover:underline decoration-2 underline-offset-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const desktopClasses = `${textLinkClasses} ${
    isScrolled
        ? 'text-gray-800 hover:text-[#a18225] focus-visible:ring-[#0f172a]'
        : 'text-white hover:text-[#d4af37] focus-visible:ring-white drop-shadow-md'
  }`;

  return (
    <button
      onClick={onClick}
      className={isMobile ? mobileClasses : desktopClasses}
    >
      {item.label}
    </button>
  );
};

