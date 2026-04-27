import { useState, forwardRef, type ComponentPropsWithoutRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PasswordInputProps = ComponentPropsWithoutRef<typeof Input>;

/**
 * Password input with a show/hide toggle button. Drop-in replacement for
 * `<Input type="password" />`. The button is keyboard-focusable and clearly
 * communicates the current state.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={show ? "text" : "password"}
          className={cn("pr-10", className)}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShow((s) => !s)}
          className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

/**
 * Lightweight password strength estimator. Returns a score 0..4 based on:
 * - length buckets (8, 12, 16)
 * - character class variety (lower/upper/digit/symbol)
 * Good enough for UX feedback without a 300KB zxcvbn dependency.
 */
export function estimatePasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: "", color: "bg-gray-200" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  const classes = [
    /[a-z]/,
    /[A-Z]/,
    /[0-9]/,
    /[^A-Za-z0-9]/,
  ].filter((r) => r.test(password)).length;
  if (classes >= 3) score++;
  if (classes === 4 && password.length >= 12) score++;

  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-600",
  ];
  return { score: clamped, label: labels[clamped], color: colors[clamped] };
}

interface StrengthBarProps {
  password: string;
}

export function PasswordStrengthBar({ password }: StrengthBarProps) {
  const { score, label, color } = estimatePasswordStrength(password);
  if (!password) return null;
  return (
    <div className="mt-1">
      <div className="flex h-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-full flex-1 rounded-full",
              i < score ? color : "bg-gray-200",
            )}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-gray-600">{label}</p>
    </div>
  );
}
