# Task: gen-dict-char_count-3053 | Score: 100% | 2026-02-15T08:14:23.618942

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))