# Task: gen-dict-char_count-1113 | Score: 100% | 2026-02-13T13:43:00.559756

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))