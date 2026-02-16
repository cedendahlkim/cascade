# Task: gen-dict-char_count-3960 | Score: 100% | 2026-02-13T12:25:54.096606

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))