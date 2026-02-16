# Task: gen-dict-char_count-2808 | Score: 100% | 2026-02-15T13:59:50.997645

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))