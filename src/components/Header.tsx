import { ConnectButton } from '@rainbow-me/rainbowkit';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🪂</span>
            <span className="text-2xl font-bold gradient-text">ConfAirdrop</span>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#features" className="text-foreground/80 hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#dashboard" className="text-foreground/80 hover:text-foreground transition-colors">
              Dashboard
            </a>
            <ConnectButton />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
