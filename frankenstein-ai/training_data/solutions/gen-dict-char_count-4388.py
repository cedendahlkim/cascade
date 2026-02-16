# Task: gen-dict-char_count-4388 | Score: 100% | 2026-02-15T13:59:52.644081

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))