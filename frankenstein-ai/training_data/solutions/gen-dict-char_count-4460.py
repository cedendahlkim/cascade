# Task: gen-dict-char_count-4460 | Score: 100% | 2026-02-15T08:24:10.752073

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))