import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import "../styles/header.css";
import Logo from "../assets/logo.svg";
import { AdminPanel } from "./AdminPanel";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);

  const [showFab, setShowFab] = useState(false);          // FAB activé ou non
  const [isPanelVisible, setIsPanelVisible] = useState(false); // Panel ouvert ou non

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Accueil", href: "welcome" },
    { name: "À Propos", href: "about" },
    {
      name: "Services",
      href: "services",
      hasDropdown: true,
      dropdownItems: [
        { name: "Nos Services", href: "services" },
        { name: "Services Détaillés", href: "categories-section" },
        { name: "type de maintenance", href: "catalogue" },
      ],
    },
    { name: "Réalisations", href: "realizations" },
    { name: "Contact", href: "contact" },
  ];

  const handleScrollWithOffset = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (!target) return;
    const headerOffset = 80;
    const elementPosition = target.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - headerOffset;
    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
  };

  const handleLogoDoubleClick = () => {
    setShowFab(prev => !prev);   // toggle FAB
    if (isPanelVisible) setIsPanelVisible(false); // ferme le panel si ouvert
  };

  return (
    <>
      <header className={`header ${isScrolled ? "scrolled" : "initial"}`}>
        <div className="header-container">
          <div className="header-content">
            {/* Logo */}
            <div className="header-logo" onDoubleClick={handleLogoDoubleClick}>
              <img src={Logo} alt="Building Service Logo" className="header-logo-image" />
              <div className={`header-logo-text ${isScrolled ? "scrolled" : "initial"}`}>
                <h1>BUILDING</h1>
                <p>SERVICE</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="header-nav">
              {navItems.map(item => (
                <div
                  key={item.name}
                  className="nav-item-wrapper"
                  onMouseEnter={() => item.hasDropdown && setIsServicesDropdownOpen(true)}
                  onMouseLeave={() => item.hasDropdown && setIsServicesDropdownOpen(false)}
                >
                  <a
                    href={`#${item.href}`}
                    className={`header-nav-link ${isScrolled ? "scrolled" : "initial"} ${
                      item.hasDropdown ? "has-dropdown" : ""
                    }`}
                    onClick={(e) => handleScrollWithOffset(e, item.href)}
                  >
                    {item.name}
                    {item.hasDropdown && (
                      <ChevronDown
                        size={16}
                        className={`dropdown-arrow ${isServicesDropdownOpen ? "open" : ""}`}
                      />
                    )}
                  </a>

                  {item.hasDropdown && (
                    <div className={`dropdown-menu ${isServicesDropdownOpen ? "open" : ""}`}>
                      {item.dropdownItems?.map(dropdownItem => (
                        <a
                          key={dropdownItem.name}
                          href={`#${dropdownItem.href}`}
                          className="dropdown-link"
                          onClick={(e) => handleScrollWithOffset(e, dropdownItem.href)}
                        >
                          {dropdownItem.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className={`header-mobile-button ${isScrolled ? "scrolled" : "initial"}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <nav className="header-mobile-nav">
              <div className="header-mobile-nav-list">
                {navItems.map((item) => (
                  <div key={item.name}>
                    <a
                      href={`#${item.href}`}
                      className={`header-mobile-nav-link ${isScrolled ? "scrolled" : "initial"}`}
                      onClick={(e) => {
                        setIsMobileMenuOpen(false);
                        handleScrollWithOffset(e, item.href);
                      }}
                    >
                      {item.name}
                    </a>
                    {item.hasDropdown && item.dropdownItems && (
                      <div className="mobile-dropdown">
                        {item.dropdownItems.map((dropdownItem) => (
                          <a
                            key={dropdownItem.name}
                            href={`#${dropdownItem.href}`}
                            className="mobile-dropdown-link"
                            onClick={(e) => {
                              setIsMobileMenuOpen(false);
                              handleScrollWithOffset(e, dropdownItem.href);
                            }}
                          >
                            {dropdownItem.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Admin Panel */}
      <AdminPanel
        showFab={showFab && !isPanelVisible}
        onPanelToggle={(visible: boolean) => setIsPanelVisible(visible)}
      />
    </>
  );
}
