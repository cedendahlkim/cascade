# Task: gen-dict-char_count-6928 | Score: 100% | 2026-02-15T07:53:10.685552

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))