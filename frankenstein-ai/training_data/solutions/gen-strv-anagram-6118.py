# Task: gen-strv-anagram-6118 | Score: 100% | 2026-02-13T15:47:00.176954

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')