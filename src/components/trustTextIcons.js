import {
  Award,
  CreditCard,
  Headphones,
  HeartHandshake,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Truck,
} from 'lucide-react';

// Explicit allowlist: API values are identifiers, never component names.
const TRUST_TEXT_ICONS = {
  award: Award,
  credit_card: CreditCard,
  creditcard: CreditCard,
  customer_support: Headphones,
  delivery: Truck,
  free_shipping: Truck,
  headphones: Headphones,
  heart_handshake: HeartHandshake,
  easy_returns: RotateCcw,
  package_check: PackageCheck,
  premium_quality: Award,
  returns: RotateCcw,
  rotate_ccw: RotateCcw,
  secure_payment: ShieldCheck,
  secure_payments: ShieldCheck,
  shield_check: ShieldCheck,
  support: Headphones,
  shipping: Truck,
  truck: Truck,
};

export function getTrustTextIcon(identifier) {
  if (typeof identifier !== 'string') return null;
  return TRUST_TEXT_ICONS[identifier.trim().toLowerCase().replace(/[\s-]+/g, '_')] ?? null;
}
