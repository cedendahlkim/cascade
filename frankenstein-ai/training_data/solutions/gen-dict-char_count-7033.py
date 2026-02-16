# Task: gen-dict-char_count-7033 | Score: 100% | 2026-02-13T13:09:41.191093

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))