# Task: gen-dict-char_count-4163 | Score: 100% | 2026-02-15T09:34:54.327792

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))