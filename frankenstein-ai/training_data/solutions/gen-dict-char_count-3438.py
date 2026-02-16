# Task: gen-dict-char_count-3438 | Score: 100% | 2026-02-15T07:45:48.914962

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))