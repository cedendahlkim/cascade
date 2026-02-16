# Task: gen-dict-char_count-9585 | Score: 100% | 2026-02-15T12:30:01.310990

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))