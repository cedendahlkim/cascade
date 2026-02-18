# Task: gen-dict-char_count-4573 | Score: 100% | 2026-02-17T20:03:24.391516

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))