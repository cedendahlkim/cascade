# Task: gen-strv-anagram-3425 | Score: 100% | 2026-02-13T14:00:30.277599

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')