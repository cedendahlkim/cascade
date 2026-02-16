# Task: gen-dict-char_count-1664 | Score: 100% | 2026-02-14T12:03:06.837895

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))