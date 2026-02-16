# Task: gen-dict-char_count-7537 | Score: 100% | 2026-02-14T12:59:43.851912

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))