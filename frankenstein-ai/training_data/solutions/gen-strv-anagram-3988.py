# Task: gen-strv-anagram-3988 | Score: 100% | 2026-02-14T12:08:28.933594

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')