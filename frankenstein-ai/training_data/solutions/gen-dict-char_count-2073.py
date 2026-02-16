# Task: gen-dict-char_count-2073 | Score: 100% | 2026-02-13T12:04:17.854704

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))