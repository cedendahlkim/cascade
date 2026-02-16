# Task: gen-dict-char_count-1633 | Score: 100% | 2026-02-13T13:10:50.980717

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))