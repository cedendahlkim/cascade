# Task: gen-dict-char_count-3223 | Score: 100% | 2026-02-17T20:03:22.975435

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))