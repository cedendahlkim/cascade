# Task: gen-dict-char_count-8105 | Score: 100% | 2026-02-13T20:17:16.539641

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))