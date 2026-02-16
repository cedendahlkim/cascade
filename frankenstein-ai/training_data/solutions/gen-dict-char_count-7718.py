# Task: gen-dict-char_count-7718 | Score: 100% | 2026-02-15T10:29:13.422824

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))