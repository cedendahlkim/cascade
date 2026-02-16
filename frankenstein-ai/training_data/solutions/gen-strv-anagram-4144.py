# Task: gen-strv-anagram-4144 | Score: 100% | 2026-02-14T12:08:24.984640

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')