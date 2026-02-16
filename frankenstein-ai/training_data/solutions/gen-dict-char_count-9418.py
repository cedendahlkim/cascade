# Task: gen-dict-char_count-9418 | Score: 100% | 2026-02-14T12:59:43.593791

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))