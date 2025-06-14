
import React from "react";
import { RefreshCw, ArrowRight, ExternalLink, ChevronDown, Code, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NavigationBarProps {
  className?: string;
}

export const NavigationBar = ({ className }: NavigationBarProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  if (currentPath.startsWith('/admin')) {
    return null;
  }

  const pathSegments = currentPath.split('/').filter(Boolean);
  const displayPath = pathSegments.length > 0 ? `${pathSegments.join('/')}` : 'home';
  

};
