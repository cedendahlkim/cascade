# Task: gen-dict-char_count-7493 | Score: 100% | 2026-02-13T16:07:11.876100

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))