# Task: gen-dict-char_count-1935 | Score: 100% | 2026-02-15T08:36:24.141924

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))