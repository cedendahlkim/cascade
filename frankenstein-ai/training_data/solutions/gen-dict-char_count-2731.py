# Task: gen-dict-char_count-2731 | Score: 100% | 2026-02-14T12:05:09.360168

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))