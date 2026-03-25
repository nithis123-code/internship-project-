"""
Project 4: Password Strength Analyzer with Custom Wordlist Generator
Analyzes password strength via entropy + custom scoring,
and generates targeted attack wordlists from user inputs.
Tools: Python, argparse, re, itertools, tkinter (optional GUI)
"""

import re
import math
import argparse
import itertools
import string
import os
from datetime import datetime

# ─────────────────────────────────────────────
# Password Strength Analyzer
# ─────────────────────────────────────────────
class PasswordAnalyzer:
    COMMON_PASSWORDS = {
        "password", "123456", "password1", "qwerty", "abc123",
        "letmein", "monkey", "1234567890", "iloveyou", "admin",
        "welcome", "login", "hello", "master", "dragon",
    }

    def analyze(self, password: str) -> dict:
        score = 0
        feedback = []

        # Length scoring
        length = len(password)
        if length < 6:
            feedback.append("❌ Too short (< 6 characters)")
        elif length < 8:
            score += 1
            feedback.append("⚠️  Short password (< 8 characters)")
        elif length < 12:
            score += 2
            feedback.append("✅ Acceptable length")
        else:
            score += 3
            feedback.append("✅ Good length (12+)")

        # Character variety
        has_lower  = bool(re.search(r'[a-z]', password))
        has_upper  = bool(re.search(r'[A-Z]', password))
        has_digit  = bool(re.search(r'\d', password))
        has_symbol = bool(re.search(r'[!@#$%^&*()\-_=+\[\]{};:\'",.<>?/\\|`~]', password))

        charset_size = 0
        if has_lower:  charset_size += 26;  score += 1
        else:          feedback.append("❌ Add lowercase letters")
        if has_upper:  charset_size += 26;  score += 1
        else:          feedback.append("❌ Add uppercase letters")
        if has_digit:  charset_size += 10;  score += 1
        else:          feedback.append("❌ Add digits")
        if has_symbol: charset_size += 32;  score += 2; feedback.append("✅ Special characters found")
        else:          feedback.append("❌ Add special characters (!@#$...)")

        # Entropy calculation
        entropy = length * math.log2(charset_size) if charset_size > 0 else 0

        # Repeat / sequential patterns
        if re.search(r'(.)\1{2,}', password):
            score -= 1
            feedback.append("⚠️  Repeated characters detected (e.g. 'aaa')")
        if re.search(r'(012|123|234|345|456|567|678|789|890|abc|bcd|cde|qwe|wer)', password.lower()):
            score -= 1
            feedback.append("⚠️  Sequential pattern detected (e.g. '123', 'abc')")

        # Common password check
        if password.lower() in self.COMMON_PASSWORDS:
            score = 0
            feedback.append("❌ This is one of the most commonly used passwords!")

        # Determine strength label
        score = max(0, score)
        if score <= 2:
            strength = "VERY WEAK"
            bar = "█░░░░░░░░░"
        elif score <= 4:
            strength = "WEAK"
            bar = "███░░░░░░░"
        elif score <= 6:
            strength = "MODERATE"
            bar = "██████░░░░"
        elif score <= 8:
            strength = "STRONG"
            bar = "████████░░"
        else:
            strength = "VERY STRONG"
            bar = "██████████"

        return {
            "password": password,
            "length": length,
            "score": score,
            "strength": strength,
            "strength_bar": bar,
            "entropy_bits": round(entropy, 2),
            "charset_size": charset_size,
            "feedback": feedback,
            "has_lower": has_lower,
            "has_upper": has_upper,
            "has_digit": has_digit,
            "has_symbol": has_symbol,
        }

    def print_report(self, result: dict):
        print("\n" + "="*55)
        print(f"  PASSWORD ANALYSIS REPORT")
        print("="*55)
        print(f"  Password  : {'*' * len(result['password'])}")
        print(f"  Length    : {result['length']}")
        print(f"  Strength  : {result['strength']:12s}  {result['strength_bar']}")
        print(f"  Score     : {result['score']}/11")
        print(f"  Entropy   : {result['entropy_bits']} bits")
        print(f"  Charset   : {result['charset_size']} possible characters")
        print("-"*55)
        print("  Feedback:")
        for fb in result['feedback']:
            print(f"    {fb}")
        print("="*55 + "\n")


# ─────────────────────────────────────────────
# Custom Wordlist Generator
# ─────────────────────────────────────────────
class WordlistGenerator:
    LEET_MAP = {
        'a': ['a', '@', '4'],
        'e': ['e', '3'],
        'i': ['i', '1', '!'],
        'o': ['o', '0'],
        's': ['s', '$', '5'],
        't': ['t', '7'],
        'l': ['l', '1'],
        'g': ['g', '9'],
    }

    COMMON_SUFFIXES = [
        "", "1", "12", "123", "1234", "!", "!!", "123!", "#",
        str(datetime.now().year),
        str(datetime.now().year - 1),
        str(datetime.now().year + 1),
        "2025", "2024", "2023",
    ]

    COMMON_PREFIXES = ["", "the", "my", "mr", "ms", "dr", "00"]

    def __init__(self, name="", dob="", pet="", keywords=None, phone=""):
        self.tokens = []
        if name:
            parts = name.strip().lower().split()
            self.tokens += parts
            if len(parts) >= 2:
                # initials + lastname, firstname + initial, etc.
                self.tokens += [parts[0] + parts[-1], parts[-1] + parts[0]]
                self.tokens += [parts[0][0] + parts[-1], parts[0] + parts[-1][0]]
        if dob:
            # Accept dd/mm/yyyy, ddmmyyyy, dd-mm-yyyy etc.
            digits = re.sub(r'\D', '', dob)
            self.tokens += [digits, digits[:4], digits[4:], digits[:2]+digits[2:4], digits[-4:]]
        if pet:
            self.tokens += [pet.lower(), pet.capitalize()]
        if keywords:
            for kw in keywords:
                self.tokens += [kw.lower(), kw.capitalize()]
        if phone:
            d = re.sub(r'\D', '', phone)
            self.tokens += [d, d[-4:], d[-6:], d[-8:]]
        # Deduplicate
        self.tokens = list(dict.fromkeys([t for t in self.tokens if t]))

    def _leet_variants(self, word: str) -> list:
        """Generate leet-speak variants of a word."""
        variants = {word}
        for i, ch in enumerate(word):
            if ch.lower() in self.LEET_MAP:
                new_variants = set()
                for v in variants:
                    for sub in self.LEET_MAP[ch.lower()]:
                        new_variants.add(v[:i] + sub + v[i+1:])
                variants |= new_variants
        return list(variants)

    def _capitalizations(self, word: str) -> list:
        caps = {word, word.lower(), word.upper(), word.capitalize()}
        # Title every other char
        caps.add(''.join(c.upper() if i % 2 == 0 else c.lower() for i, c in enumerate(word)))
        return list(caps)

    def generate(self, max_words: int = 5000) -> list:
        wordlist = set()

        # Single tokens with caps + leet + suffixes
        for token in self.tokens:
            for cap in self._capitalizations(token):
                for leet in self._leet_variants(cap):
                    for suffix in self.COMMON_SUFFIXES:
                        for prefix in self.COMMON_PREFIXES:
                            wordlist.add(prefix + leet + suffix)
                            if len(wordlist) >= max_words:
                                return sorted(wordlist)

        # Token combinations (pairs)
        for t1, t2 in itertools.permutations(self.tokens, 2):
            combined = t1 + t2
            for suffix in self.COMMON_SUFFIXES[:6]:
                wordlist.add(combined + suffix)
                wordlist.add(combined.capitalize() + suffix)
            if len(wordlist) >= max_words:
                break

        return sorted(wordlist)

    def export(self, path: str, words: list):
        with open(path, "w") as f:
            f.write("\n".join(words))
        print(f"[*] Wordlist exported: {path} ({len(words)} words)")


# ─────────────────────────────────────────────
# CLI Interface
# ─────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Password Strength Analyzer + Custom Wordlist Generator"
    )
    subparsers = parser.add_subparsers(dest="command")

    # analyze sub-command
    analyze_p = subparsers.add_parser("analyze", help="Analyze a password")
    analyze_p.add_argument("password", help="Password to analyze")

    # generate sub-command
    gen_p = subparsers.add_parser("generate", help="Generate custom wordlist")
    gen_p.add_argument("--name",     default="", help="Full name of target")
    gen_p.add_argument("--dob",      default="", help="Date of birth (dd/mm/yyyy)")
    gen_p.add_argument("--pet",      default="", help="Pet name")
    gen_p.add_argument("--phone",    default="", help="Phone number")
    gen_p.add_argument("--keywords", default="", help="Comma-separated extra keywords")
    gen_p.add_argument("--output",   default="wordlist.txt", help="Output file path")
    gen_p.add_argument("--max",      default=5000, type=int, help="Max word count")

    args = parser.parse_args()

    if args.command == "analyze":
        analyzer = PasswordAnalyzer()
        result = analyzer.analyze(args.password)
        analyzer.print_report(result)

    elif args.command == "generate":
        kws = [k.strip() for k in args.keywords.split(",") if k.strip()] if args.keywords else []
        gen = WordlistGenerator(
            name=args.name,
            dob=args.dob,
            pet=args.pet,
            keywords=kws,
            phone=args.phone,
        )
        print(f"[*] Generating wordlist from {len(gen.tokens)} token(s)...")
        words = gen.generate(max_words=args.max)
        gen.export(args.output, words)
        print(f"[*] Done. Preview (first 10):")
        for w in words[:10]:
            print(f"    {w}")

    else:
        # Interactive mode
        print("\n" + "="*55)
        print("  PASSWORD STRENGTH ANALYZER + WORDLIST GENERATOR")
        print("="*55)
        print("1. Analyze a password")
        print("2. Generate custom wordlist")
        choice = input("\nChoose (1/2): ").strip()

        if choice == "1":
            pwd = input("Enter password to analyze: ")
            analyzer = PasswordAnalyzer()
            result = analyzer.analyze(pwd)
            analyzer.print_report(result)

        elif choice == "2":
            print("\n[Enter details to build personalized wordlist]")
            name     = input("Full name (leave blank to skip): ").strip()
            dob      = input("Date of birth dd/mm/yyyy (blank to skip): ").strip()
            pet      = input("Pet name (blank to skip): ").strip()
            phone    = input("Phone number (blank to skip): ").strip()
            keywords = input("Other keywords, comma-separated (blank to skip): ").strip()
            kws = [k.strip() for k in keywords.split(",") if k.strip()]
            gen = WordlistGenerator(name=name, dob=dob, pet=pet, phone=phone, keywords=kws)
            print(f"\n[*] Generating wordlist from {len(gen.tokens)} tokens...")
            words = gen.generate()
            out_path = f"wordlist_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            gen.export(out_path, words)
        else:
            print("Invalid choice.")


if __name__ == "__main__":
    main()
