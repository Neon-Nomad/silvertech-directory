import { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
}

export interface BusinessLayer {
  title: string;
  subtitle: string;
  features: string[];
  audience?: string;
  color: string;
}

export interface ComparisonPoint {
  feature: string;
  silverTech: string;
  legacy: string;
}

export interface Step {
  number: string;
  title: string;
  description: string;
}

export interface Stat {
  value: string;
  label: string;
}
