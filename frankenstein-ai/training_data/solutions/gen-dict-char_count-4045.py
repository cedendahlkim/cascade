# Task: gen-dict-char_count-4045 | Score: 100% | 2026-02-17T20:09:03.854879

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))