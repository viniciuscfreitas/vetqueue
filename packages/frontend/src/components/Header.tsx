import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b max-w-full overflow-x-hidden">
      <div className="container mx-auto px-4 py-4 max-w-full">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">VetQueue</h1>
          <Link href="/display">
            <Button variant="outline">Display</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

