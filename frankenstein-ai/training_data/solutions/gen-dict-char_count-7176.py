# Task: gen-dict-char_count-7176 | Score: 100% | 2026-02-13T11:03:18.796015

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))