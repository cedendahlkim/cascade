# Task: gen-dict-char_count-2907 | Score: 100% | 2026-02-13T09:22:34.554423

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))