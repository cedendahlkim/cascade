# Task: gen-dict-char_count-1070 | Score: 100% | 2026-02-15T13:00:26.582229

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))