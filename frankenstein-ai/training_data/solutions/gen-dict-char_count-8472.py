# Task: gen-dict-char_count-8472 | Score: 100% | 2026-02-14T12:46:58.256193

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))