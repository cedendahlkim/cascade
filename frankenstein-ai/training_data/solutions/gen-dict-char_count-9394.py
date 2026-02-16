# Task: gen-dict-char_count-9394 | Score: 100% | 2026-02-15T07:53:43.705979

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))