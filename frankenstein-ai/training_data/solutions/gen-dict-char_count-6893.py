# Task: gen-dict-char_count-6893 | Score: 100% | 2026-02-17T20:09:04.662358

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))