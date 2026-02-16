# Task: gen-dict-char_count-7287 | Score: 100% | 2026-02-13T11:09:00.370987

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))