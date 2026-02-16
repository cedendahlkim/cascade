# Task: gen-strv-anagram-5903 | Score: 100% | 2026-02-13T12:35:39.154383

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')