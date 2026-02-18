# Task: gen-dict-char_count-8667 | Score: 100% | 2026-02-17T20:03:21.063712

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))