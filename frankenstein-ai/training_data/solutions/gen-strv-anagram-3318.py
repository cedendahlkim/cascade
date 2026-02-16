# Task: gen-strv-anagram-3318 | Score: 100% | 2026-02-15T10:28:48.728024

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')