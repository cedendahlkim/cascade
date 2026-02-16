# Task: gen-dict-char_count-9283 | Score: 100% | 2026-02-15T08:36:22.967856

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))