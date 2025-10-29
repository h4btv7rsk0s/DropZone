import { Github, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-border/50">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🪂</span>
            <span className="text-xl font-bold gradient-text">ConfAirdrop</span>
          </div>
          
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              Privacy-preserving airdrop distribution with FHE technology
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              © 2025 ConfAirdrop. Built with RainbowKit & Wagmi.
            </p>
          </div>
          
          <div className="flex gap-4">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
            >
              <Github className="w-5 h-5" />
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
