# Task: gen-dict-char_count-1193 | Score: 100% | 2026-02-13T21:07:39.375142

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))