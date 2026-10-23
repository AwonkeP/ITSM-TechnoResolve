import React, { useEffect, useRef, useState } from 'react';
import { TicketCategory, TicketPriority } from '../types';

/**
 * Pure JavaScript requestAnimationFrame number counter hook
 * Smoothly interpolates numeric changes without abrupt jumps.
 */
export function useAnimatedCounter(target: number, duration = 420): number {
  const [count, setCount] = useState<number>(target);
  const prevTargetRef = useRef<number>(target);

  useEffect(() => {
    const startValue = prevTargetRef.current;
    const endValue = target;
    prevTargetRef.current = target;

    if (startValue === endValue) {
      setCount(endValue);
      return;
    }

    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setCount(endValue);
      return;
    }

    let animationFrameId: number;
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * eased);
      setCount(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, duration]);

  return count;
}

/**
 * JavaScript Typewriter Hook for lively hero/input demonstrations
 */
export function useTypewriterCycle(
  phrases: string[],
  typingSpeedMs = 42,
  deletingSpeedMs = 22,
  pauseDurationMs = 2200
): string {
  const [displayText, setDisplayText] = useState<string>(phrases[0] || '');
  const [phraseIndex, setPhraseIndex] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (!phrases.length) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setDisplayText(phrases[0]);
      return;
    }

    const currentPhrase = phrases[phraseIndex % phrases.length];
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayText === currentPhrase) {
      timer = setTimeout(() => setIsDeleting(true), pauseDurationMs);
    } else if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    } else {
      const nextLength = isDeleting ? displayText.length - 1 : displayText.length + 1;
      const nextText = currentPhrase.slice(0, nextLength);
      timer = setTimeout(
        () => setDisplayText(nextText),
        isDeleting ? deletingSpeedMs : typingSpeedMs
      );
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex, phrases, typingSpeedMs, deletingSpeedMs, pauseDurationMs]);

  return displayText;
}

/**
 * Subtle JavaScript Web Animations API fade-and-slide transition for container updates
 */
export function animateCalmFadeSlide(el: HTMLElement | null) {
  if (!el || typeof el.animate !== 'function') return;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  el.animate(
    [
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0px)' },
    ],
    {
      duration: 200,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    }
  );
}

/**
 * Subtle JavaScript feedback pulse for status or assignment changes
 */
export function triggerElementPop(el: HTMLElement | null) {
  if (!el || typeof el.animate !== 'function') return;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  el.animate(
    [
      { opacity: 0.85, transform: 'scale(0.98) translateY(2px)' },
      { opacity: 1, transform: 'scale(1) translateY(0px)' },
    ],
    {
      duration: 200,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    }
  );
}

/**
 * Interactive 3D Card Tilt & Radial Spotlight via JavaScript pointer tracking
 */
export function handleCardSpotlightMove(e: React.MouseEvent<HTMLElement>) {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const rotateX = ((y - centerY) / centerY) * -2.2;
  const rotateY = ((x - centerX) / centerX) * 2.2;

  el.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
  el.style.setProperty('--spotlight-x', `${x.toFixed(0)}px`);
  el.style.setProperty('--spotlight-y', `${y.toFixed(0)}px`);
}

export function handleCardSpotlightLeave(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  el.style.transform = '';
}

/**
 * Java-Style Object-Oriented Ticket Triage Engine
 * Encapsulates real-time keyword scoring, priority heuristics, SLA computation,
 * and specialist routing for interactive homepage & portal previews.
 */
export interface TriageSimulationResult {
  category: TicketCategory;
  categoryLabel: string;
  priority: TicketPriority;
  confidence: number;
  slaTargetHours: number;
  assignedTeam: string;
  recommendedAction: string;
  matchedSignals: string[];
}

export class TicketTriageEngine {
  private static readonly RULES: Array<{
    category: TicketCategory;
    categoryLabel: string;
    assignedTeam: string;
    keywords: string[];
    urgentKeywords: string[];
    recommendedAction: string;
  }> = [
    {
      category: 'access',
      categoryLabel: 'Identity & Access',
      assignedTeam: 'Identity & Security Ops',
      keywords: ['vpn', 'password', 'mfa', 'login', 'locked', 'sso', 'authenticator', 'token', 'permission', 'access'],
      urgentKeywords: ['locked out', 'production', 'executive', 'expired', 'breach', 'urgent'],
      recommendedAction: 'Verify identity token and issue temporary MFA bypass or session reset.',
    },
    {
      category: 'hardware',
      categoryLabel: 'Hardware & Endpoints',
      assignedTeam: 'Endpoint Engineering',
      keywords: ['laptop', 'macbook', 'screen', 'monitor', 'dock', 'keyboard', 'battery', 'printer', 'flicker', 'hardware', 'audio'],
      urgentKeywords: ['broken', 'smoke', 'dead', 'wont turn on', 'black screen'],
      recommendedAction: 'Run remote endpoint diagnostics and dispatch loaner hardware if physical fault confirmed.',
    },
    {
      category: 'software',
      categoryLabel: 'Software & Cloud Apps',
      assignedTeam: 'Application Support',
      keywords: ['figma', 'slack', 'zoom', 'license', 'install', 'crash', 'update', 'outlook', 'excel', 'teams', 'jira', 'software'],
      urgentKeywords: ['outage', 'all users', 'crash', 'corrupted', 'blocked'],
      recommendedAction: 'Provision seat license via SSO group and clear local application cache.',
    },
    {
      category: 'billing',
      categoryLabel: 'Billing & Procurement',
      assignedTeam: 'IT Finance & Licensing',
      keywords: ['invoice', 'billing', 'charge', 'subscription', 'renewal', 'po', 'receipt', 'cost', 'seat', 'payment'],
      urgentKeywords: ['overdue', 'suspended', 'cancelled', 'audit'],
      recommendedAction: 'Reconcile department cost center and validate vendor contract renewal.',
    },
  ];

  public static evaluate(input: string): TriageSimulationResult {
    const normalized = input.toLowerCase().trim();
    if (!normalized) {
      return {
        category: 'software',
        categoryLabel: 'Software & Cloud Apps',
        priority: 'medium',
        confidence: 88,
        slaTargetHours: 8,
        assignedTeam: 'Application Support',
        recommendedAction: 'Categorize request and route to available support specialist.',
        matchedSignals: ['auto-triage', 'standard-queue'],
      };
    }

    let bestMatch = this.RULES[2]; // default software
    let highestScore = 0;
    const matchedSignals: string[] = [];

    for (const rule of this.RULES) {
      let score = 0;
      for (const kw of rule.keywords) {
        if (normalized.includes(kw)) {
          score += 2;
          if (matchedSignals.length < 4) matchedSignals.push(kw);
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = rule;
      }
    }

    // Determine priority
    let priority: TicketPriority = 'medium';
    const hasUrgentSignal = bestMatch.urgentKeywords.some((uk) => normalized.includes(uk)) ||
      normalized.includes('urgent') ||
      normalized.includes('immediately') ||
      normalized.includes('presentation') ||
      normalized.includes('client');

    if (hasUrgentSignal && highestScore >= 2) {
      priority = 'urgent';
      if (!matchedSignals.includes('high-impact')) matchedSignals.push('high-impact');
    } else if (highestScore >= 4 || hasUrgentSignal) {
      priority = 'high';
    } else if (highestScore === 0) {
      priority = 'low';
    }

    const slaMap: Record<TicketPriority, number> = {
      urgent: 2,
      high: 4,
      medium: 8,
      low: 24,
    };

    const confidence = Math.min(99, Math.max(84, 86 + highestScore * 3 + (hasUrgentSignal ? 2 : 0)));

    return {
      category: bestMatch.category,
      categoryLabel: bestMatch.categoryLabel,
      priority,
      confidence,
      slaTargetHours: slaMap[priority],
      assignedTeam: bestMatch.assignedTeam,
      recommendedAction: bestMatch.recommendedAction,
      matchedSignals: matchedSignals.length > 0 ? matchedSignals : ['semantic-intent', bestMatch.category],
    };
  }
}
