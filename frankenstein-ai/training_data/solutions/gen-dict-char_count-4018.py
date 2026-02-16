# Task: gen-dict-char_count-4018 | Score: 100% | 2026-02-14T12:59:42.756624

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))