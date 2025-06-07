import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { PanelLeft } from "lucide-react";
import { Button } from "./ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <nav className="w-full flex justify-center h-16">
        <div className="w-full flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <PanelLeft className="h-4 w-4" />
            </Button>
            <div className="font-semibold text-lg">
                <Link href={"/"}>RLSeed</Link>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <AuthButton />
            <ThemeSwitcher />
          </div>
        </div>
      </nav>
    </header>
  );
} 