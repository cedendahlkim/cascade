# Task: gen-strv-anagram-4822 | Score: 100% | 2026-02-13T15:46:48.463224

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')