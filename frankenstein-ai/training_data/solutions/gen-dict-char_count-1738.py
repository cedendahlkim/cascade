# Task: gen-dict-char_count-1738 | Score: 100% | 2026-02-13T17:36:06.351158

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))