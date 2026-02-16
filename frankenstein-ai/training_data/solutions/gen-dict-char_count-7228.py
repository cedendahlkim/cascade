# Task: gen-dict-char_count-7228 | Score: 100% | 2026-02-13T09:20:49.610595

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))