# Task: gen-dict-char_count-1727 | Score: 100% | 2026-02-14T12:20:43.210391

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))