# Task: gen-dict-char_count-2090 | Score: 100% | 2026-02-15T07:53:44.904939

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))