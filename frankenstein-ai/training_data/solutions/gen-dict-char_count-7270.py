# Task: gen-dict-char_count-7270 | Score: 100% | 2026-02-15T13:29:43.831400

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))