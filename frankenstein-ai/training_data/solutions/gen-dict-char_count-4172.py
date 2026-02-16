# Task: gen-dict-char_count-4172 | Score: 100% | 2026-02-13T21:08:25.114375

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))